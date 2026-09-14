import { Workbook, type CellValue, type Worksheet } from 'exceljs'
import type { SummaryGroupId } from '../model/types'
import {
  findCatalogItemByName,
  type ProductionCatalogItem,
} from './productionCatalog'
import type {
  ImportedBalanceNotice,
  ProductionCaptureDraft,
  ProductionCaptureRow,
} from './productionCapture'
import { isSundayIsoDate } from '../model/productionDayMode'

interface ProductRowDefinition {
  row: number
  product: ProductionCatalogItem
  finishedKg: number
  treatmentKg: number
}

export interface ParsedProductionSheet {
  sheetName: string
  date: string
  rawMaterialKg: number
  declaredDayTotalKg: number
  declaredNightTotalKg: number
  declaredFinishedTotalKg: number
  reproductorAllocationKg: number
  products: readonly ProductRowDefinition[]
  balances: readonly ImportedBalanceNotice[]
  warnings: readonly string[]
}

const weekdaySheetNames = new Set([
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'MIÉRCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'SÁBADO',
  'DOMINGO',
])

const productRows = [
  10, 11, 15, 16, 17, 18, 19, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  35, 36, 37, 38, 43, 44, 45, 46, 47, 48, 49, 53, 54, 55, 56, 60,
  61, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
  84, 85, 86, 87, 88, 92, 95, 96, 97, 98, 99, 100,
] as const

const treatmentRows = new Set([18, 29, 30, 31, 35, 36, 37, 38, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80])

function getFormulaResult(value: CellValue): unknown {
  if (value && typeof value === 'object' && 'result' in value) {
    return value.result
  }
  return value
}

function getNumber(worksheet: Worksheet, address: string): number {
  const value = getFormulaResult(worksheet.getCell(address).value)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function getText(worksheet: Worksheet, address: string): string {
  const value = getFormulaResult(worksheet.getCell(address).value)
  if (typeof value === 'string') return value.trim()
  if (value instanceof Date) return value.toISOString()
  return String(value ?? '').trim()
}

function parseSheetDate(value: string): string | null {
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72)
}

function metadataForRow(row: number, productName: string): ProductionCatalogItem {
  const catalogItem = findCatalogItemByName(productName)
  if (catalogItem) return catalogItem
  const isNucaSemilimpia = productName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('es-PE')
    .includes('SEMI LIMPI')

  const group: {
    familyId: string
    familyName: string
    summaryGroupId: SummaryGroupId
  } =
    row <= 11
      ? { familyId: 'aleta-cruda', familyName: 'ALETA CRUDA', summaryGroupId: 'ALETA' }
      : row <= 19
        ? { familyId: 'manto-crudo', familyName: 'MANTO CRUDO', summaryGroupId: 'MANTO' }
        : row <= 31
          ? { familyId: 'anillas', familyName: 'ANILLAS', summaryGroupId: 'ANILLAS' }
          : row <= 38
            ? { familyId: 'boton', familyName: 'BOTÓN', summaryGroupId: 'BOTON' }
            : row <= 49
              ? { familyId: 'recorte-crudo', familyName: 'RECORTE CRUDO', summaryGroupId: 'RECORTE_CRUDO' }
              : row <= 56
                ? { familyId: 'recorte-cocido', familyName: 'RECORTE COCIDO', summaryGroupId: 'RECORTE_COCIDO' }
                : row <= 61
                  ? { familyId: 'rejos-especial', familyName: 'REJOS ESPECIAL', summaryGroupId: 'REJOS_SPECIAL' }
                  : row <= 80
                    ? { familyId: 'rejos-crudo', familyName: 'REJOS CRUDO', summaryGroupId: 'REJOS' }
                    : row <= 88
                      ? { familyId: 'reproductor-crudo', familyName: 'REPRODUCTOR CRUDO', summaryGroupId: 'REPRODUCTOR' }
                      : row <= 92
                        ? { familyId: 'pico', familyName: 'PICO', summaryGroupId: 'PICO' }
                        : isNucaSemilimpia
                          ? { familyId: 'nuca-semilimpia', familyName: 'NUCA SEMILIMPIA', summaryGroupId: 'NUCA_SEMILIMPIA' }
                          : { familyId: 'nuca-bikini', familyName: 'NUCA BIKINI', summaryGroupId: 'NUCA_BIKINI' }

  return {
    familyId: group.familyId,
    familyName: group.familyName,
    productId: `excel-${slugify(productName)}`,
    productName,
    summaryGroupId: group.summaryGroupId,
  }
}

function parseBalances(worksheet: Worksheet): readonly ImportedBalanceNotice[] {
  const balances: ImportedBalanceNotice[] = []

  for (let row = 10; row <= 22; row += 1) {
    const label = getText(worksheet, `H${row}`)
    const kg = getNumber(worksheet, `I${row}`)
    if (!label || label.toLocaleUpperCase('es-PE') === 'TOTAL' || kg <= 0) continue
    balances.push({ label, kg })
  }

  return balances
}

function parseProductionSheet(worksheet: Worksheet): ParsedProductionSheet | null {
  const date = parseSheetDate(getText(worksheet, 'A5'))
  if (!date) return null

  const products = productRows.flatMap((row) => {
    const productName = getText(worksheet, `A${row}`)
    const finishedKg = getNumber(worksheet, `B${row}`)
    if (!productName || finishedKg <= 0) return []
    return [
      {
        row,
        product: metadataForRow(row, productName),
        finishedKg,
        treatmentKg: treatmentRows.has(row) ? finishedKg : 0,
      },
    ]
  })
  const warnings: string[] = []
  const balances = parseBalances(worksheet)

  if (products.length === 0) {
    warnings.push('La hoja no contiene productos con cantidades mayores a cero.')
  }
  if (balances.length > 0) {
    warnings.push(
      'Asigna los saldos importados al producto correcto antes de cerrar la jornada.',
    )
  }

  return {
    sheetName: worksheet.name,
    date,
    rawMaterialKg: getNumber(worksheet, 'D3'),
    declaredDayTotalKg: getNumber(worksheet, 'B107'),
    declaredNightTotalKg: getNumber(worksheet, 'C107'),
    declaredFinishedTotalKg: getNumber(worksheet, 'B104'),
    reproductorAllocationKg: getNumber(worksheet, 'C89'),
    products,
    balances,
    warnings,
  }
}

export async function parseProductionWorkbook(
  file: ArrayBuffer,
): Promise<readonly ParsedProductionSheet[]> {
  const workbook = new Workbook()
  await workbook.xlsx.load(file)

  return workbook.worksheets.flatMap((worksheet) => {
    const normalizedName = worksheet.name
      .trim()
      .toLocaleUpperCase('es-PE')
    if (!weekdaySheetNames.has(normalizedName)) return []
    const parsed = parseProductionSheet(worksheet)
    return parsed ? [parsed] : []
  })
}

export function createCaptureDraftFromImportedSheet(
  sheet: ParsedProductionSheet,
): ProductionCaptureDraft {
  const rows: readonly ProductionCaptureRow[] = sheet.products.map(
    (product, index) => ({
      key: `excel-${sheet.sheetName}-${product.row}-${index}`,
      product: product.product,
      dayReportedKg: '',
      dayPreviousBalanceKg: '0',
      nightReportedKg: '',
      nightPreviousBalanceKg: '0',
      tunnelDayKg: '0',
      tunnelNightKg: '0',
      treatmentKg: String(product.treatmentKg),
      closingBalanceKg: '0',
      finishedKg: String(product.finishedKg),
    }),
  )

  return {
    date: sheet.date,
    process: 'PACKING',
    source: 'EXCEL',
    sourceSheet: sheet.sheetName,
    shiftAllocationMode: 'RECONCILED_INFERENCE',
    operationMode:
      isSundayIsoDate(sheet.date) && sheet.rawMaterialKg === 0
        ? 'BALANCE_ONLY'
        : 'NORMAL',
    rawMaterialKg: String(sheet.rawMaterialKg),
    declaredDayTotalKg: String(sheet.declaredDayTotalKg),
    declaredNightTotalKg: String(sheet.declaredNightTotalKg),
    declaredFinishedTotalKg: String(sheet.declaredFinishedTotalKg),
    reproductorAllocationKg: String(sheet.reproductorAllocationKg),
    hasTunnelProduction: false,
    nucaWashConfirmed: false,
    nucaWashReference: '',
    rows,
    balanceUses: [],
    importedBalances: sheet.balances,
  }
}
