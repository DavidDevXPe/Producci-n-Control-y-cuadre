import type {
  AdjustmentRecord,
  BalanceLot,
  BalancePosition,
  IntegrityIssue,
  Kg100,
  NucaBikiniReferenceResult,
  PerformanceResult,
  ProductionDay,
  ProductionDayCalculation,
  ProductionLine,
  ProductReconciliation,
  RawMaterialDistribution,
  ReferenceStatus,
  ShiftCalculation,
  ShiftCode,
  ShiftEntryCalculation,
  ShiftProductEntry,
  SummaryGroupId,
  WeeklyGroupTotal,
  WeeklyProductTotal,
  WeeklySummary,
  WeeklySummaryPeriod,
} from './types'

export const KG100_SCALE = 100
export const BASIS_POINTS_SCALE = 10_000
export const DEFAULT_PERFORMANCE_REFERENCE_BPS = 8_000
export const DEFAULT_NUCA_BIKINI_REFERENCE_BPS = 700

const ZERO_KG100 = 0 as Kg100

/** Creates a domain quantity from an already-scaled integer. */
export function kg100(value: number): Kg100 {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError('Kg100 must be a safe integer')
  }

  return value as Kg100
}

/** Converts a human-readable kilogram value to integer hundredths. */
export function kg(value: number): Kg100 {
  if (!Number.isFinite(value)) {
    throw new RangeError('Kilograms must be finite')
  }

  const scaled = value * KG100_SCALE
  const rounded = Math.round(scaled)

  if (Math.abs(scaled - rounded) > 1e-7) {
    throw new RangeError('Kilograms cannot have more than two decimal places')
  }

  return kg100(rounded)
}

export function toKilograms(value: Kg100): number {
  return value / KG100_SCALE
}

export function sumKg100(values: Iterable<Kg100>): Kg100 {
  let total = 0

  for (const value of values) {
    total += value
  }

  return kg100(total)
}

export function applyBasisPoints(value: Kg100, basisPoints: number): Kg100 {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new RangeError('Basis points must be a non-negative integer')
  }

  return kg100(Math.round((value * basisPoints) / BASIS_POINTS_SCALE))
}

function adjustmentValue(adjustment: AdjustmentRecord): Kg100 {
  return kg100(
    adjustment.direction === 'INCREASE'
      ? adjustment.kg100
      : -adjustment.kg100,
  )
}

export function calculateShiftEntry(
  entry: ShiftProductEntry,
  previousBalanceProcessedKg100: Kg100 = ZERO_KG100,
): ShiftEntryCalculation {
  const adjustmentKg100 = sumKg100(entry.adjustments.map(adjustmentValue))
  const ownProductionKg100 = kg100(
    entry.reportedKg100 +
      adjustmentKg100 -
      previousBalanceProcessedKg100,
  )

  return {
    reportedKg100: entry.reportedKg100,
    adjustmentKg100,
    previousBalanceProcessedKg100,
    ownProductionKg100,
  }
}

function balanceProcessedForProduct(
  productionDay: ProductionDay,
  line: ProductionLine,
  shift: ShiftCode,
): Kg100 {
  return sumKg100(
    productionDay.receivedBalanceLots.flatMap((lot) =>
      lot.productId === line.productId && lot.familyId === line.familyId
        ? lot.uses
            .filter(
              (use) =>
                use.targetDayId === productionDay.id && use.shift === shift,
            )
            .map((use) => use.kg100)
        : [],
    ),
  )
}

function calculateProduct(
  productionDay: ProductionDay,
  line: ProductionLine,
): ProductReconciliation {
  const day = calculateShiftEntry(
    line.shifts.DAY,
    balanceProcessedForProduct(productionDay, line, 'DAY'),
  )
  const night = calculateShiftEntry(
    line.shifts.NIGHT,
    balanceProcessedForProduct(productionDay, line, 'NIGHT'),
  )
  const expectedFinishedKg100 = sumKg100([
    day.ownProductionKg100,
    night.ownProductionKg100,
    line.treatmentKg100,
    line.newClosingBalanceKg100,
  ])

  return {
    familyId: line.familyId,
    familyName: line.familyName,
    productId: line.productId,
    productName: line.productName,
    shiftBreakdownConfidence: line.shiftBreakdownConfidence,
    day,
    night,
    treatmentKg100: line.treatmentKg100,
    newClosingBalanceKg100: line.newClosingBalanceKg100,
    expectedFinishedKg100,
    declaredFinishedKg100: line.declaredFinishedKg100,
    differenceKg100: kg100(
      expectedFinishedKg100 - line.declaredFinishedKg100,
    ),
  }
}

function calculateShift(
  shift: ShiftCode,
  products: readonly ProductReconciliation[],
  declaredReportedKg100: Kg100,
): ShiftCalculation {
  const entries = products.map((product) =>
    shift === 'DAY' ? product.day : product.night,
  )
  const reportedKg100 = sumKg100(
    entries.map((entry) => entry.reportedKg100),
  )

  return {
    reportedKg100,
    declaredReportedKg100,
    adjustmentKg100: sumKg100(
      entries.map((entry) => entry.adjustmentKg100),
    ),
    previousBalanceProcessedKg100: sumKg100(
      entries.map((entry) => entry.previousBalanceProcessedKg100),
    ),
    ownProductionKg100: sumKg100(
      entries.map((entry) => entry.ownProductionKg100),
    ),
    detailDifferenceKg100: kg100(declaredReportedKg100 - reportedKg100),
  }
}

function referenceStatus(
  numeratorKg100: Kg100,
  denominatorKg100: Kg100,
  referenceBasisPoints: number,
): ReferenceStatus {
  if (denominatorKg100 === 0) {
    return 'NOT_APPLICABLE'
  }

  return numeratorKg100 * BASIS_POINTS_SCALE >=
    denominatorKg100 * referenceBasisPoints
    ? 'AT_OR_ABOVE_REFERENCE'
    : 'BELOW_REFERENCE'
}

export function calculatePerformance(
  finishedKg100: Kg100,
  rawMaterialKg100: Kg100,
  referenceBasisPoints = DEFAULT_PERFORMANCE_REFERENCE_BPS,
): PerformanceResult {
  const ratio =
    rawMaterialKg100 === 0 ? null : finishedKg100 / rawMaterialKg100

  return {
    ratio,
    percent: ratio === null ? null : ratio * 100,
    referencePercent: referenceBasisPoints / 100,
    status: referenceStatus(
      finishedKg100,
      rawMaterialKg100,
      referenceBasisPoints,
    ),
  }
}

export function calculateNucaBikiniReference(
  rawMaterialKg100: Kg100,
  actualKg100: Kg100,
  active: boolean,
  referenceBasisPoints = DEFAULT_NUCA_BIKINI_REFERENCE_BPS,
): NucaBikiniReferenceResult {
  if (!active) {
    return {
      applicable: false,
      applicableRawMaterialKg100: ZERO_KG100,
      actualKg100,
      referenceKg100: ZERO_KG100,
      varianceKg100: ZERO_KG100,
      shareOfRawMaterialPercent: null,
      referencePercent: referenceBasisPoints / 100,
      status: 'NOT_APPLICABLE',
    }
  }

  const referenceKg100 = applyBasisPoints(
    rawMaterialKg100,
    referenceBasisPoints,
  )

  return {
    applicable: true,
    applicableRawMaterialKg100: rawMaterialKg100,
    actualKg100,
    referenceKg100,
    varianceKg100: kg100(actualKg100 - referenceKg100),
    shareOfRawMaterialPercent:
      rawMaterialKg100 === 0
        ? null
        : (actualKg100 / rawMaterialKg100) * 100,
    referencePercent: referenceBasisPoints / 100,
    status: referenceStatus(
      actualKg100,
      rawMaterialKg100,
      referenceBasisPoints,
    ),
  }
}

export function isNucaWashAuthorized(productionDay: ProductionDay): boolean {
  const authorization = productionDay.nucaWashAuthorization

  return Boolean(
    authorization &&
      authorization.reason.trim() &&
      (authorization.kind === 'USER_CONFIRMED_ORDER' ||
        authorization.reference?.trim()),
  )
}

function sameProductMetadata(
  first: ProductionLine,
  second: ProductionLine,
): boolean {
  return (
    first.familyId === second.familyId &&
    first.familyName === second.familyName &&
    first.productName === second.productName &&
    first.summaryGroupId === second.summaryGroupId
  )
}

function collectDayIntegrityIssues(
  productionDay: ProductionDay,
  products: readonly ProductReconciliation[],
  nucaBikiniKg100: Kg100,
): readonly IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const dayIssue = (
    issue: Omit<IntegrityIssue, 'scope' | 'dayId'>,
  ): IntegrityIssue => ({
    ...issue,
    scope: 'DAY',
    dayId: productionDay.id,
  })

  const rawMaterialFromEntriesKg100 = sumKg100(
    productionDay.rawMaterialEntries.map((entry) => entry.kg100),
  )
  const validateNonNegative = (
    value: Kg100,
    label: string,
    details: Pick<IntegrityIssue, 'productId' | 'balanceLotId' | 'shift'> = {},
  ) => {
    if (value < 0) {
      issues.push(
        dayIssue({
          code: 'NEGATIVE_QUANTITY',
          message: `${label} no puede ser negativo.`,
          ...details,
        }),
      )
    }
  }

  validateNonNegative(
    productionDay.declaredRawMaterialKg100,
    'La materia prima declarada',
  )
  validateNonNegative(
    productionDay.declaredFinishedTotalKg100,
    'El producto terminado declarado',
  )
  validateNonNegative(
    productionDay.declaredShiftTotalsKg100.DAY,
    'El total declarado del turno Día',
    { shift: 'DAY' },
  )
  validateNonNegative(
    productionDay.declaredShiftTotalsKg100.NIGHT,
    'El total declarado del turno Noche',
    { shift: 'NIGHT' },
  )

  if (rawMaterialFromEntriesKg100 !== productionDay.declaredRawMaterialKg100) {
    issues.push(
      dayIssue({
        code: 'RAW_MATERIAL_TOTAL_MISMATCH',
        message: `La suma de entradas de materia prima (${rawMaterialFromEntriesKg100}) no coincide con el total declarado (${productionDay.declaredRawMaterialKg100}).`,
      }),
    )
  }

  const rawMaterialEntryIds = new Set<string>()
  for (const entry of productionDay.rawMaterialEntries) {
    validateNonNegative(entry.kg100, `La entrada de materia prima ${entry.id}`)
    if (rawMaterialEntryIds.has(entry.id)) {
      issues.push(
        dayIssue({
          code: 'DUPLICATE_RAW_MATERIAL_ENTRY_ID',
          message: `La entrada de materia prima ${entry.id} está duplicada.`,
        }),
      )
    }
    rawMaterialEntryIds.add(entry.id)
  }

  const productsById = new Map<string, ProductionLine>()
  for (const line of productionDay.lines) {
    validateNonNegative(line.shifts.DAY.reportedKg100, 'El reporte del turno Día', {
      productId: line.productId,
      shift: 'DAY',
    })
    validateNonNegative(
      line.shifts.NIGHT.reportedKg100,
      'El reporte del turno Noche',
      { productId: line.productId, shift: 'NIGHT' },
    )
    validateNonNegative(line.treatmentKg100, 'El tratamiento', {
      productId: line.productId,
    })
    validateNonNegative(line.newClosingBalanceKg100, 'El saldo final', {
      productId: line.productId,
    })
    validateNonNegative(line.declaredFinishedKg100, 'El producto terminado', {
      productId: line.productId,
    })
    const first = productsById.get(line.productId)
    if (first) {
      issues.push(
        dayIssue({
          code: 'DUPLICATE_PRODUCT_ID',
          message: `El producto ${line.productId} aparece más de una vez en la jornada.`,
          productId: line.productId,
        }),
      )

      if (!sameProductMetadata(first, line)) {
        issues.push(
          dayIssue({
            code: 'PRODUCT_METADATA_MISMATCH',
            message: `El producto ${line.productId} tiene familia, nombre o grupo inconsistentes.`,
            productId: line.productId,
          }),
        )
      }
    } else {
      productsById.set(line.productId, line)
    }
  }

  const adjustmentIds = new Set<string>()
  for (const line of productionDay.lines) {
    for (const shift of ['DAY', 'NIGHT'] as const) {
      for (const adjustment of line.shifts[shift].adjustments) {
        if (
          adjustment.kg100 < 0 ||
          !adjustment.reason.trim() ||
          !adjustment.userId.trim() ||
          Number.isNaN(Date.parse(adjustment.createdAt))
        ) {
          issues.push(
            dayIssue({
              code: 'INVALID_ADJUSTMENT_METADATA',
              message: `El ajuste ${adjustment.id} requiere cantidad positiva, motivo, usuario y fecha válida.`,
              productId: line.productId,
              shift,
            }),
          )
        }
        if (adjustmentIds.has(adjustment.id)) {
          issues.push(
            dayIssue({
              code: 'DUPLICATE_ADJUSTMENT_ID',
              message: `El ajuste ${adjustment.id} está duplicado.`,
              productId: line.productId,
              shift,
            }),
          )
        }
        adjustmentIds.add(adjustment.id)
      }
    }
  }

  const balanceLotIds = new Set<string>()
  const balanceUseIds = new Set<string>()
  for (const lot of productionDay.receivedBalanceLots) {
    validateNonNegative(lot.originalKg100, `El lote de saldo ${lot.id}`, {
      balanceLotId: lot.id,
      productId: lot.productId,
    })
    if (balanceLotIds.has(lot.id)) {
      issues.push(
        dayIssue({
          code: 'DUPLICATE_BALANCE_LOT_ID',
          message: `El lote de saldo ${lot.id} está duplicado.`,
          balanceLotId: lot.id,
          productId: lot.productId,
        }),
      )
    }
    balanceLotIds.add(lot.id)

    if (lot.originDayId === productionDay.id) {
      issues.push(
        dayIssue({
          code: 'BALANCE_ORIGIN_NOT_PREVIOUS',
          message: `El lote ${lot.id} no puede recibirse desde la misma jornada.`,
          balanceLotId: lot.id,
          productId: lot.productId,
        }),
      )
    }

    const balancePosition = calculateBalancePosition(lot)
    if (!balancePosition.isValid) {
      issues.push(
        dayIssue({
          code: 'BALANCE_OVERUSED',
          message: `El lote ${lot.id} excede su cantidad original en ${balancePosition.overusedKg100} centésimas de kg.`,
          balanceLotId: lot.id,
          productId: lot.productId,
        }),
      )
    }

    for (const use of lot.uses) {
      validateNonNegative(use.kg100, `El uso de saldo ${use.id}`, {
        balanceLotId: lot.id,
        productId: lot.productId,
        shift: use.shift,
      })
      if (balanceUseIds.has(use.id)) {
        issues.push(
          dayIssue({
            code: 'DUPLICATE_BALANCE_USE_ID',
            message: `El uso de saldo ${use.id} está duplicado.`,
            balanceLotId: lot.id,
            productId: lot.productId,
            shift: use.shift,
          }),
        )
      }
      balanceUseIds.add(use.id)

      if (use.targetDayId !== productionDay.id) continue

      const sameProduct = productionDay.lines.filter(
        (line) => line.productId === lot.productId,
      )
      if (sameProduct.length === 0) {
        issues.push(
          dayIssue({
            code: 'BALANCE_PRODUCT_NOT_FOUND',
            message: `El lote ${lot.id} apunta a un producto que no existe en la jornada.`,
            balanceLotId: lot.id,
            productId: lot.productId,
            shift: use.shift,
          }),
        )
      } else if (!sameProduct.some((line) => line.familyId === lot.familyId)) {
        issues.push(
          dayIssue({
            code: 'BALANCE_FAMILY_MISMATCH',
            message: `La familia del lote ${lot.id} no coincide con la del producto ${lot.productId}.`,
            balanceLotId: lot.id,
            productId: lot.productId,
            shift: use.shift,
          }),
        )
      }
    }
  }

  for (const product of products) {
    for (const [shift, entry] of [
      ['DAY', product.day],
      ['NIGHT', product.night],
    ] as const) {
      if (entry.ownProductionKg100 < 0) {
        issues.push(
          dayIssue({
            code: 'NEGATIVE_OWN_PRODUCTION',
            message: `La producción propia de ${product.productId} en el turno ${shift} es negativa.`,
            productId: product.productId,
            shift,
          }),
        )
      }
    }
  }

  const authorization = productionDay.nucaWashAuthorization
  if (authorization !== null && !isNucaWashAuthorized(productionDay)) {
    issues.push(
      dayIssue({
        code: 'NUCA_WASH_AUTHORIZATION_MISSING',
        message: 'El lavado de Nuca no tiene un pedido documentado o una confirmación trazable del pedido.',
      }),
    )
  }

  if (authorization === null && nucaBikiniKg100 > 0) {
    issues.push(
      dayIssue({
        code: 'NUCA_PRODUCTION_WITHOUT_ACTIVE_WASH',
        message: 'Existe producción de Nuca Bikini sin un pedido de lavado confirmado.',
      }),
    )
  }

  return issues
}

export function calculateProductionDay(
  productionDay: ProductionDay,
): ProductionDayCalculation {
  const products = productionDay.lines.map((line) =>
    calculateProduct(productionDay, line),
  )
  const day = calculateShift(
    'DAY',
    products,
    productionDay.declaredShiftTotalsKg100.DAY,
  )
  const night = calculateShift(
    'NIGHT',
    products,
    productionDay.declaredShiftTotalsKg100.NIGHT,
  )
  const ownTurnProductionKg100 = sumKg100([
    day.ownProductionKg100,
    night.ownProductionKg100,
  ])
  const treatmentKg100 = sumKg100(
    products.map((product) => product.treatmentKg100),
  )
  const newClosingBalanceKg100 = sumKg100(
    products.map((product) => product.newClosingBalanceKg100),
  )
  const expectedFinishedKg100 = sumKg100([
    ownTurnProductionKg100,
    treatmentKg100,
    newClosingBalanceKg100,
  ])
  const differenceKg100 = kg100(
    expectedFinishedKg100 - productionDay.declaredFinishedTotalKg100,
  )
  const hasProductDifference = products.some(
    (product) => product.differenceKg100 !== 0,
  )
  const hasShiftDetailDifference =
    day.detailDifferenceKg100 !== 0 || night.detailDifferenceKg100 !== 0

  const nucaBikiniKg100 = sumKg100(
    productionDay.lines
      .filter((line) => line.summaryGroupId === 'NUCA_BIKINI')
      .map((line) => line.declaredFinishedKg100),
  )
  const integrityIssues = collectDayIntegrityIssues(
    productionDay,
    products,
    nucaBikiniKg100,
  )
  const receivedPreviousBalanceKg100 = sumKg100(
    productionDay.receivedBalanceLots.map((lot) => lot.originalKg100),
  )
  const processedPreviousBalanceKg100 = sumKg100([
    day.previousBalanceProcessedKg100,
    night.previousBalanceProcessedKg100,
  ])
  const pendingPreviousBalanceKg100 = kg100(
    Math.max(
      receivedPreviousBalanceKg100 - processedPreviousBalanceKg100,
      0,
    ),
  )

  return {
    day,
    night,
    ownTurnProductionKg100,
    treatmentKg100,
    newClosingBalanceKg100,
    expectedFinishedKg100,
    declaredFinishedKg100: productionDay.declaredFinishedTotalKg100,
    calculatedClosingBalanceKg100: kg100(
      productionDay.declaredFinishedTotalKg100 -
        ownTurnProductionKg100 -
        treatmentKg100,
    ),
    receivedPreviousBalanceKg100,
    processedPreviousBalanceKg100,
    pendingPreviousBalanceKg100,
    differenceKg100,
    status:
      differenceKg100 === 0 &&
      !hasProductDifference &&
      !hasShiftDetailDifference &&
      integrityIssues.length === 0
        ? 'BALANCED'
        : 'UNBALANCED',
    performance: calculatePerformance(
      productionDay.declaredFinishedTotalKg100,
      productionDay.declaredRawMaterialKg100,
      productionDay.performanceReferenceBasisPoints,
    ),
    nucaBikini: calculateNucaBikiniReference(
      productionDay.declaredRawMaterialKg100,
      nucaBikiniKg100,
      isNucaWashAuthorized(productionDay),
      productionDay.nucaBikiniReferenceBasisPoints,
    ),
    products,
    integrityIssues,
  }
}

export function calculateBalancePosition(lot: BalanceLot): BalancePosition {
  const processedDayKg100 = sumKg100(
    lot.uses
      .filter((use) => use.shift === 'DAY')
      .map((use) => use.kg100),
  )
  const processedNightKg100 = sumKg100(
    lot.uses
      .filter((use) => use.shift === 'NIGHT')
      .map((use) => use.kg100),
  )
  const processedTotalKg100 = sumKg100([
    processedDayKg100,
    processedNightKg100,
  ])
  const difference = lot.originalKg100 - processedTotalKg100

  return {
    originalKg100: lot.originalKg100,
    processedDayKg100,
    processedNightKg100,
    processedTotalKg100,
    pendingKg100: kg100(Math.max(difference, 0)),
    overusedKg100: kg100(Math.max(-difference, 0)),
    isValid: difference >= 0,
  }
}

export function calculateRawMaterialDistribution(
  rawMaterialKg100: Kg100,
): RawMaterialDistribution {
  return {
    tubeKg100: applyBasisPoints(rawMaterialKg100, 5_000),
    aletaKg100: applyBasisPoints(rawMaterialKg100, 2_000),
    rejosKg100: applyBasisPoints(rawMaterialKg100, 1_500),
    nucasKg100: applyBasisPoints(rawMaterialKg100, 1_500),
  }
}

function buildWeeklyProducts(
  days: readonly ProductionDay[],
): readonly WeeklyProductTotal[] {
  const totals = new Map<string, WeeklyProductTotal>()

  for (const day of days) {
    for (const line of day.lines) {
      const current = totals.get(line.productId)

      totals.set(
        line.productId,
        current
          ? {
              ...current,
              totalKg100: kg100(
                current.totalKg100 + line.declaredFinishedKg100,
              ),
            }
          : {
              familyId: line.familyId,
              familyName: line.familyName,
              productId: line.productId,
              productName: line.productName,
              summaryGroupId: line.summaryGroupId,
              totalKg100: line.declaredFinishedKg100,
            },
      )
    }
  }

  return [...totals.values()]
}

function buildWeeklyGroups(
  products: readonly WeeklyProductTotal[],
  rawMaterialKg100: Kg100,
): readonly WeeklyGroupTotal[] {
  const totals = new Map<SummaryGroupId, Kg100>()

  for (const product of products) {
    totals.set(
      product.summaryGroupId,
      kg100(
        (totals.get(product.summaryGroupId) ?? ZERO_KG100) +
          product.totalKg100,
      ),
    )
  }

  return [...totals.entries()].map(([summaryGroupId, totalKg100]) => ({
    summaryGroupId,
    totalKg100,
    shareOfRawMaterialPercent:
      rawMaterialKg100 === 0
        ? null
        : (totalKg100 / rawMaterialKg100) * 100,
  }))
}

function collectWeeklyIntegrityIssues(
  productionDays: readonly ProductionDay[],
  period?: WeeklySummaryPeriod,
): readonly IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const dayIds = new Set<string>()
  const dates = new Set<string>()
  const productsById = new Map<string, { line: ProductionLine; dayId: string }>()

  for (const day of productionDays) {
    if (
      period &&
      (day.date < period.startDate || day.date > period.endDate)
    ) {
      issues.push({
        code: 'WEEK_DATE_OUT_OF_RANGE',
        message: `La fecha ${day.date} no pertenece al rango semanal ${period.startDate}–${period.endDate}.`,
        scope: 'WEEK',
        dayId: day.id,
      })
    }
    if (dayIds.has(day.id)) {
      issues.push({
        code: 'DUPLICATE_PRODUCTION_DAY_ID',
        message: `La jornada ${day.id} fue incluida más de una vez en el resumen.`,
        scope: 'WEEK',
        dayId: day.id,
      })
    }
    dayIds.add(day.id)

    if (dates.has(day.date)) {
      issues.push({
        code: 'DUPLICATE_PRODUCTION_DAY_DATE',
        message: `La fecha ${day.date} fue incluida más de una vez en el resumen.`,
        scope: 'WEEK',
        dayId: day.id,
      })
    }
    dates.add(day.date)

    for (const line of day.lines) {
      const first = productsById.get(line.productId)
      if (first && !sameProductMetadata(first.line, line)) {
        issues.push({
          code: 'PRODUCT_METADATA_MISMATCH',
          message: `El producto ${line.productId} cambió de nombre, familia o grupo entre las jornadas ${first.dayId} y ${day.id}.`,
          scope: 'WEEK',
          dayId: day.id,
          productId: line.productId,
        })
      } else if (!first) {
        productsById.set(line.productId, { line, dayId: day.id })
      }
    }
  }

  return issues
}

export function calculateWeeklySummary(
  productionDays: readonly ProductionDay[],
  period?: WeeklySummaryPeriod,
): WeeklySummary {
  const days = productionDays.map(calculateProductionDay)
  const rawMaterialKg100 = sumKg100(
    productionDays.map((day) => day.declaredRawMaterialKg100),
  )
  const productTotals = buildWeeklyProducts(productionDays)
  const productTotalsById: Record<string, Kg100> = {}

  for (const product of productTotals) {
    productTotalsById[product.productId] = product.totalKg100
  }

  const detailFinishedKg100 = sumKg100(
    productTotals.map((product) => product.totalKg100),
  )
  const declaredFinishedKg100 = sumKg100(
    productionDays.map((day) => day.declaredFinishedTotalKg100),
  )
  const differenceKg100 = kg100(
    declaredFinishedKg100 - detailFinishedKg100,
  )
  const allDaysBalanced = days.every((day) => day.status === 'BALANCED')
  const integrityIssues = [
    ...days.flatMap((day) => day.integrityIssues),
    ...collectWeeklyIntegrityIssues(productionDays, period),
  ]
  const performanceReferenceBasisPoints =
    productionDays[0]?.performanceReferenceBasisPoints ??
    DEFAULT_PERFORMANCE_REFERENCE_BPS

  const activeNucaDays = productionDays.filter(isNucaWashAuthorized)
  const applicableNucaRawMaterialKg100 = sumKg100(
    activeNucaDays.map((day) => day.declaredRawMaterialKg100),
  )
  const activeNucaOutputKg100 = sumKg100(
    activeNucaDays.flatMap((day) =>
      day.lines
        .filter((line) => line.summaryGroupId === 'NUCA_BIKINI')
        .map((line) => line.declaredFinishedKg100),
    ),
  )
  const nucaReferenceBasisPoints =
    activeNucaDays[0]?.nucaBikiniReferenceBasisPoints ??
    DEFAULT_NUCA_BIKINI_REFERENCE_BPS

  return {
    rawMaterialKg100,
    distribution: calculateRawMaterialDistribution(rawMaterialKg100),
    productTotals,
    productTotalsById,
    groupTotals: buildWeeklyGroups(productTotals, rawMaterialKg100),
    detailFinishedKg100,
    declaredFinishedKg100,
    differenceKg100,
    status:
      differenceKg100 === 0 &&
      allDaysBalanced &&
      integrityIssues.length === 0
        ? 'VALID'
        : 'INVALID',
    allDaysBalanced,
    performance: calculatePerformance(
      detailFinishedKg100,
      rawMaterialKg100,
      performanceReferenceBasisPoints,
    ),
    nucaBikini: calculateNucaBikiniReference(
      applicableNucaRawMaterialKg100,
      activeNucaOutputKg100,
      activeNucaDays.length > 0,
      nucaReferenceBasisPoints,
    ),
    days,
    integrityIssues,
  }
}
