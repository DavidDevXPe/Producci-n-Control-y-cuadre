import { formatIsoDate } from '../../../utils/formatters'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  kg,
  kg100,
  sumKg100,
  toKilograms,
} from '../model/calculations'
import type {
  BalanceLot,
  Kg100,
  ProductionDay,
  ProductionDayCalculation,
  ProductionDayStatus,
  ShiftCode,
} from '../model/types'
import type { ProductionCatalogItem } from './productionCatalog'

export type CaptureSource = 'MANUAL' | 'EXCEL'
export type ShiftAllocationMode = 'EXPLICIT' | 'RECONCILED_INFERENCE'

export interface ProductionCaptureRow {
  key: string
  product: ProductionCatalogItem
  dayReportedKg: string
  dayPreviousBalanceKg: string
  nightReportedKg: string
  nightPreviousBalanceKg: string
  treatmentKg: string
  closingBalanceKg: string
  finishedKg: string
}

export interface ImportedBalanceNotice {
  label: string
  kg: number
}

export interface ProductionCaptureDraft {
  date: string
  source: CaptureSource
  sourceSheet: string
  shiftAllocationMode: ShiftAllocationMode
  rawMaterialKg: string
  declaredDayTotalKg: string
  declaredNightTotalKg: string
  declaredFinishedTotalKg: string
  reproductorAllocationKg: string
  nucaWashConfirmed: boolean
  nucaWashReference: string
  rows: readonly ProductionCaptureRow[]
  importedBalances: readonly ImportedBalanceNotice[]
}

export interface CaptureBuildResult {
  productionDay: ProductionDay
  calculation: ProductionDayCalculation
  inputErrors: readonly string[]
}

function parseQuantity(value: string, label: string, errors: string[]): Kg100 {
  const normalized = value.trim().replace(',', '.')
  const quantity = normalized === '' ? 0 : Number(normalized)

  if (!Number.isFinite(quantity) || quantity < 0) {
    errors.push(`${label} debe ser una cantidad válida mayor o igual a cero.`)
    return kg100(0)
  }

  try {
    return kg(quantity)
  } catch {
    errors.push(`${label} admite como máximo dos decimales.`)
    return kg100(0)
  }
}

function formatDisplayName(date: string): string {
  const [, month, day] = date.split('-')
  const weekday = formatIsoDate(date).split(',')[0] ?? formatIsoDate(date)
  return `${weekday} ${day}/${month}/${date.slice(0, 4)}`
}

function getInferredReports(
  rows: readonly ProductionCaptureRow[],
  declaredDayKg100: Kg100,
  quantityFor: (value: string, label: string) => Kg100,
): ReadonlyMap<string, Readonly<Record<ShiftCode, Kg100>>> {
  let remainingDay = declaredDayKg100
  const allocation = new Map<string, Readonly<Record<ShiftCode, Kg100>>>()

  for (const row of rows) {
    const finished = quantityFor(row.finishedKg, `${row.product.productName}: producto terminado`)
    const treatment = quantityFor(row.treatmentKg, `${row.product.productName}: tratamiento`)
    const closingBalance = quantityFor(row.closingBalanceKg, `${row.product.productName}: saldo final`)
    const previousDay = quantityFor(row.dayPreviousBalanceKg, `${row.product.productName}: saldo anterior Día`)
    const previousNight = quantityFor(row.nightPreviousBalanceKg, `${row.product.productName}: saldo anterior Noche`)
    const physicalTotal = kg100(
      Math.max(
        finished - treatment - closingBalance + previousDay + previousNight,
        0,
      ),
    )
    const day = kg100(Math.min(physicalTotal, Math.max(remainingDay, 0)))
    const night = kg100(physicalTotal - day)
    remainingDay = kg100(remainingDay - day)
    allocation.set(row.key, { DAY: day, NIGHT: night })
  }

  return allocation
}

interface MutableBalancePosition {
  originDayId: string
  familyId: string
  productId: string
  pendingKg100: Kg100
}

function buildReceivedBalanceLots(
  dayId: string,
  rows: readonly ProductionCaptureRow[],
  previousDays: readonly ProductionDay[],
  subsequentLots: readonly BalanceLot[],
  quantityFor: (value: string, label: string) => Kg100,
): readonly BalanceLot[] {
  const positions: MutableBalancePosition[] = calculateOutstandingBalances(
    previousDays,
    subsequentLots,
  )
    .filter((position) => position.pendingKg100 > 0)
    .map((position) => ({
      originDayId: position.originDayId,
      familyId: position.familyId,
      productId: position.productId,
      pendingKg100: position.pendingKg100,
    }))
  const lots: BalanceLot[] = []

  for (const row of rows) {
    for (const shift of ['DAY', 'NIGHT'] as const) {
      let remaining = quantityFor(
        shift === 'DAY'
          ? row.dayPreviousBalanceKg
          : row.nightPreviousBalanceKg,
        `${row.product.productName}: saldo anterior ${shift === 'DAY' ? 'Día' : 'Noche'}`,
      )

      for (const position of positions) {
        if (
          remaining <= 0 ||
          position.productId !== row.product.productId ||
          position.familyId !== row.product.familyId ||
          position.pendingKg100 <= 0
        ) {
          continue
        }

        const used = kg100(Math.min(remaining, position.pendingKg100))
        const existingLot = lots.find(
          (lot) =>
            lot.originDayId === position.originDayId &&
            lot.productId === position.productId,
        )
        const use = {
          id: `balance-use-${dayId}-${position.originDayId}-${position.productId}-${shift}`,
          targetDayId: dayId,
          shift,
          kg100: used,
        } as const

        if (existingLot) {
          const index = lots.indexOf(existingLot)
          lots[index] = { ...existingLot, uses: [...existingLot.uses, use] }
        } else {
          lots.push({
            id: `balance-lot-${dayId}-${position.originDayId}-${position.productId}`,
            originDayId: position.originDayId,
            familyId: position.familyId,
            productId: position.productId,
            originalKg100: position.pendingKg100,
            uses: [use],
          })
        }

        position.pendingKg100 = kg100(position.pendingKg100 - used)
        remaining = kg100(remaining - used)
      }

      if (remaining > 0) {
        lots.push({
          id: `balance-lot-${dayId}-unassigned-${row.product.productId}-${shift}`,
          originDayId: `unassigned-origin-${row.product.productId}`,
          familyId: row.product.familyId,
          productId: row.product.productId,
          originalKg100: kg100(0),
          uses: [
            {
              id: `balance-use-${dayId}-unassigned-${row.product.productId}-${shift}`,
              targetDayId: dayId,
              shift,
              kg100: remaining,
            },
          ],
        })
      }
    }
  }

  return lots
}

export function createEmptyCaptureDraft(date: string): ProductionCaptureDraft {
  return {
    date,
    source: 'MANUAL',
    sourceSheet: 'CAPTURA WEB',
    shiftAllocationMode: 'EXPLICIT',
    rawMaterialKg: '',
    declaredDayTotalKg: '',
    declaredNightTotalKg: '',
    declaredFinishedTotalKg: '',
    reproductorAllocationKg: '',
    nucaWashConfirmed: false,
    nucaWashReference: '',
    rows: [],
    importedBalances: [],
  }
}

export function createCaptureDraftFromDay(
  productionDay: ProductionDay,
): ProductionCaptureDraft {
  const calculation = calculateProductionDay(productionDay)

  return {
    date: productionDay.date,
    source:
      productionDay.lines.at(0)?.source.sheet === 'CAPTURA WEB'
        ? 'MANUAL'
        : 'EXCEL',
    sourceSheet: productionDay.lines.at(0)?.source.sheet ?? 'CAPTURA WEB',
    shiftAllocationMode:
      productionDay.lines.at(0)?.shiftBreakdownConfidence === 'EXPLICIT'
        ? 'EXPLICIT'
        : 'RECONCILED_INFERENCE',
    rawMaterialKg: String(toKilograms(productionDay.declaredRawMaterialKg100)),
    declaredDayTotalKg: String(
      toKilograms(productionDay.declaredShiftTotalsKg100.DAY),
    ),
    declaredNightTotalKg: String(
      toKilograms(productionDay.declaredShiftTotalsKg100.NIGHT),
    ),
    declaredFinishedTotalKg: String(
      toKilograms(productionDay.declaredFinishedTotalKg100),
    ),
    reproductorAllocationKg: String(
      toKilograms(
        productionDay.rawMaterialAllocationOverridesKg100.REPRODUCTOR ??
          kg100(0),
      ),
    ),
    nucaWashConfirmed: productionDay.nucaWashAuthorization !== null,
    nucaWashReference: productionDay.nucaWashAuthorization?.reference ?? '',
    rows: productionDay.lines.map((line, index) => {
      const product = calculation.products[index]!
      return {
        key: `${line.productId}-${index}`,
        product: {
          familyId: line.familyId,
          familyName: line.familyName,
          productId: line.productId,
          productName: line.productName,
          summaryGroupId: line.summaryGroupId,
        },
        dayReportedKg: String(toKilograms(line.shifts.DAY.reportedKg100)),
        dayPreviousBalanceKg: String(
          toKilograms(product.day.previousBalanceProcessedKg100),
        ),
        nightReportedKg: String(toKilograms(line.shifts.NIGHT.reportedKg100)),
        nightPreviousBalanceKg: String(
          toKilograms(product.night.previousBalanceProcessedKg100),
        ),
        treatmentKg: String(toKilograms(line.treatmentKg100)),
        closingBalanceKg: String(toKilograms(line.newClosingBalanceKg100)),
        finishedKg: String(toKilograms(line.declaredFinishedKg100)),
      }
    }),
    importedBalances: [],
  }
}

export function buildProductionDayFromCapture(
  draft: ProductionCaptureDraft,
  allProductionDays: readonly ProductionDay[],
  subsequentLots: readonly BalanceLot[],
  status: ProductionDayStatus = 'DRAFT',
): CaptureBuildResult {
  const errors: string[] = []
  const quantityFor = (value: string, label: string) =>
    parseQuantity(value, label, errors)
  const rawMaterial = quantityFor(draft.rawMaterialKg, 'Materia prima')
  const declaredDay = quantityFor(draft.declaredDayTotalKg, 'Total del turno Día')
  const declaredNight = quantityFor(
    draft.declaredNightTotalKg,
    'Total del turno Noche',
  )
  const declaredFinished = quantityFor(
    draft.declaredFinishedTotalKg,
    'Total de producto terminado',
  )
  const reproductorAllocation = quantityFor(
    draft.reproductorAllocationKg,
    'Asignación de materia prima a Reproductor',
  )

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
    errors.push('Selecciona una fecha válida para la jornada.')
  }
  if (draft.rows.length === 0) {
    errors.push('Agrega al menos un producto con movimiento.')
  }

  const duplicateProducts = new Set<string>()
  const seenProducts = new Set<string>()
  for (const row of draft.rows) {
    if (seenProducts.has(row.product.productId)) {
      duplicateProducts.add(row.product.productName)
    }
    seenProducts.add(row.product.productId)
  }
  if (duplicateProducts.size > 0) {
    errors.push(`Hay productos duplicados: ${[...duplicateProducts].join(', ')}.`)
  }

  const dayId = `production-day-${draft.date}`
  const previousDays = allProductionDays.filter((day) => day.date < draft.date)
  const receivedBalanceLots = buildReceivedBalanceLots(
    dayId,
    draft.rows,
    previousDays,
    subsequentLots,
    quantityFor,
  )
  const inferredReports =
    draft.shiftAllocationMode === 'RECONCILED_INFERENCE'
      ? getInferredReports(draft.rows, declaredDay, quantityFor)
      : new Map<string, Readonly<Record<ShiftCode, Kg100>>>()

  const lines = draft.rows.map((row, index) => {
    const inferred = inferredReports.get(row.key)
    return {
      familyId: row.product.familyId,
      familyName: row.product.familyName,
      productId: row.product.productId,
      productName: row.product.productName,
      summaryGroupId: row.product.summaryGroupId,
      source: {
        sheet: draft.sourceSheet,
        cell: draft.source === 'EXCEL' ? `B${index + 1}` : `WEB-${index + 1}`,
      },
      shiftBreakdownConfidence:
        draft.shiftAllocationMode === 'EXPLICIT'
          ? ('EXPLICIT' as const)
          : ('RECONCILED_INFERENCE' as const),
      shifts: {
        DAY: {
          reportedKg100:
            inferred?.DAY ??
            quantityFor(
              row.dayReportedKg,
              `${row.product.productName}: reporte Día`,
            ),
          adjustments: [],
        },
        NIGHT: {
          reportedKg100:
            inferred?.NIGHT ??
            quantityFor(
              row.nightReportedKg,
              `${row.product.productName}: reporte Noche`,
            ),
          adjustments: [],
        },
      },
      treatmentKg100: quantityFor(
        row.treatmentKg,
        `${row.product.productName}: tratamiento`,
      ),
      newClosingBalanceKg100: quantityFor(
        row.closingBalanceKg,
        `${row.product.productName}: saldo final`,
      ),
      declaredFinishedKg100: quantityFor(
        row.finishedKg,
        `${row.product.productName}: producto terminado`,
      ),
    }
  })

  const productionDay: ProductionDay = {
    id: dayId,
    date: draft.date,
    displayName: formatDisplayName(draft.date),
    status,
    rawMaterialEntries: [
      {
        id: `raw-material-${draft.date}-1`,
        kg100: rawMaterial,
        shift: null,
      },
    ],
    declaredRawMaterialKg100: rawMaterial,
    declaredShiftTotalsKg100: { DAY: declaredDay, NIGHT: declaredNight },
    declaredFinishedTotalKg100: declaredFinished,
    lines,
    receivedBalanceLots,
    nucaWashAuthorization: draft.nucaWashConfirmed
      ? {
          kind: 'USER_CONFIRMED_ORDER',
          reference: draft.nucaWashReference.trim() || null,
          reason: 'Pedido de lavado confirmado durante la captura web.',
        }
      : null,
    performanceReferenceBasisPoints: 8_000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100:
      reproductorAllocation > 0 ? { REPRODUCTOR: reproductorAllocation } : {},
  }
  const calculation = calculateProductionDay(productionDay)

  return {
    productionDay,
    calculation,
    inputErrors: [...new Set(errors)],
  }
}

export function sumImportedBalances(
  balances: readonly ImportedBalanceNotice[],
): Kg100 {
  return sumKg100(balances.map((balance) => kg(balance.kg)))
}
