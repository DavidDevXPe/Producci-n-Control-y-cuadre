import { createWorker } from 'tesseract.js'
import {
  createUnconfirmedCatalogItem,
  type ProductionCatalogItem,
} from './productionCatalog'
import { matchProduct, type ProductMatchKind } from './productMatcher'
import { normalizeProductionDate } from './productionDate'
import type {
  ProductionCaptureDraft,
  ProductionCaptureRow,
} from './productionCapture'

export interface ParsedProductionScreenshotRow {
  product: ProductionCatalogItem
  aroQuantity: number
  adjustment: number
  rowTotal: number | null
  totalKg: number
  totalKgSource: 'ROW_TOTAL_KG' | 'ARO_FALLBACK'
  confidence: number
  date: string | null
  dateStatus: 'TARGET_DATE' | 'DATE_CONFIRMED' | 'DATE_LIKELY' | 'DATE_UNCERTAIN' | 'OTHER_DATE_CONFIRMED'
  originalDate?: string | null
  sourceText: string
  matchKind: ProductMatchKind
}

export interface ParsedProductionScreenshot {
  rows: readonly ParsedProductionScreenshotRow[]
  date: string | null
  totalAros: number | null
  totalKg: number | null
  warnings: readonly string[]
  newProducts: readonly ProductionCatalogItem[]
  possibleMatches: readonly { sourceText: string; product: ProductionCatalogItem; date: string | null; totalKg: number }[]
  sourceGrandTotalKg: number | null
  reconstructedGrandTotalKg: number
  selectedDateTotalKg: number
  otherDateRows: readonly ParsedProductionScreenshotRow[]
  targetDate: string | null
}

function parseNumber(value: string): number | null {
  const compact = value.replace(/\s/g, '')
  const lastComma = compact.lastIndexOf(',')
  const lastDot = compact.lastIndexOf('.')
  const normalized =
    lastComma >= 0 && lastDot >= 0
      ? lastComma > lastDot
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(/,/g, '')
      : compact.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeOcrText(value: string): string {
  return value
    .replace(/[|]/g, 'I')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractDate(text: string): string | null {
  const match = text.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/)
  if (match) return `${match[1]}-${match[2]!.padStart(2, '0')}-${match[3]!.padStart(2, '0')}`
  const shortDate = text.match(/(\d{1,2})[/-](\d{1,2})[/-](20\d{2})/)
  if (!shortDate) return null
  return `${shortDate[3]}-${shortDate[2]!.padStart(2, '0')}-${shortDate[1]!.padStart(2, '0')}`
}

function numbersFromLine(line: string): number[] {
  return (line.match(/\d[\d.,]*/g) ?? [])
    .map(parseNumber)
    .filter((value): value is number => value !== null)
}

function productNameFromLine(line: string): string {
  return line
    .replace(/20\d{2}[-/]\d{1,2}[-/]\d{1,2}/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function productNameBeforeDate(line: string): string {
  const dateIndex = line.search(/20\d{2}[-/]\d{1,2}[-/]\d{1,2}/)
  return productNameFromLine(dateIndex >= 0 ? line.slice(0, dateIndex) : line)
}

function tableNumbers(line: string): number[] {
  const numbers = numbersFromLine(line)
  return numbers.length >= 4 ? numbers.slice(-4) : numbers
}

function parseRows(
  text: string,
  newProducts: ProductionCatalogItem[],
  possibleMatches: { sourceText: string; product: ProductionCatalogItem; date: string | null; totalKg: number }[],
): ParsedProductionScreenshotRow[] {
  return text.split(/\r?\n/).flatMap((rawLine) => {
    const line = normalizeOcrText(rawLine)
    if (!line || /producto|horario|cantidad|total general|ajuste/i.test(line)) return []
    const dateIndex = line.search(/20\d{2}[-/]\d{1,2}[-/]\d{1,2}/)
    const numericPart = dateIndex >= 0 ? line.slice(dateIndex + 10) : line
    const numbers = tableNumbers(numericPart)
    const productName = productNameBeforeDate(line)
    if (numbers.length < 2 || productName.length < 5) return []

    const aroQuantity = numbers[0]!
    const adjustment = numbers.length >= 3 ? numbers[1]! : 0
    const rowTotal = numbers[2] ?? null
    const totalKg = numbers[3] ?? rowTotal ?? Math.round(aroQuantity * 10 * 100) / 100
    const match = matchProduct(productName)
    const product = match.product ?? createUnconfirmedCatalogItem(productName)
    if (match.kind === 'NEW_PRODUCT') newProducts.push(product)
    const date = extractDate(line)
    if (match.kind === 'LIKELY_MATCH' && match.product && !possibleMatches.some((candidate) => candidate.sourceText === productName)) {
      possibleMatches.push({ sourceText: productName, product: match.product, date, totalKg })
    }
    return [{ product, aroQuantity, adjustment, rowTotal, totalKg, totalKgSource: numbers.length >= 4 ? 'ROW_TOTAL_KG' : 'ARO_FALLBACK', confidence: numbers.length >= 4 ? 0.8 : 0.35, date, dateStatus: date ? 'DATE_CONFIRMED' : 'DATE_UNCERTAIN', sourceText: line, matchKind: match.kind }]
  })
}

export interface OcrWord {
  text: string
  bbox: { x0: number; x1: number; y0: number; y1: number }
}

export interface OcrLine {
  text: string
  words: OcrWord[]
}

function groupOcrLinesByY(lines: readonly OcrLine[]): OcrLine[] {
  const grouped: { y: number; words: OcrWord[] }[] = []
  for (const line of [...lines].sort((first, second) => (first.words[0]?.bbox.y0 ?? 0) - (second.words[0]?.bbox.y0 ?? 0))) {
    const y = line.words.reduce((sum, word) => sum + word.bbox.y0, 0) / Math.max(line.words.length, 1)
    const current = grouped.at(-1)
    if (current && Math.abs(current.y - y) <= 14) {
      current.words.push(...line.words)
      current.y = (current.y + y) / 2
    } else {
      grouped.push({ y, words: [...line.words] })
    }
  }
  return grouped.map((group) => ({
    text: group.words.map((word) => word.text).join(' '),
    words: group.words,
  }))
}

function detectColumnBoundaries(lines: readonly OcrLine[], imageWidth: number): readonly number[] {
  const headerLines = lines.filter((line) => /producto|descripci|horario|cantidad|aros|ajuste|total|kg/i.test(line.text))
  const findX = (pattern: RegExp) => headerLines.flatMap((line) => line.words).find((word) => pattern.test(normalizeOcrText(word.text)))?.bbox.x0
  const schedule = findX(/horario/i)
  const aro = findX(/aros|cantidad/i)
  const adjustment = findX(/ajuste/i)
  const totals = headerLines.flatMap((line) => line.words).filter((word) => /total/i.test(normalizeOcrText(word.text))).sort((first, second) => first.bbox.x0 - second.bbox.x0)
  const total = totals[0]?.bbox.x0
  const totalKg = totals.length > 1 ? totals.at(-1)?.bbox.x0 : findX(/^kg$/i)
  if (schedule !== undefined && aro !== undefined && adjustment !== undefined && total !== undefined && totalKg !== undefined) {
    return [0, schedule, aro, adjustment, total, totalKg, imageWidth]
  }
  return [0, imageWidth * 0.56, imageWidth * 0.67, imageWidth * 0.78, imageWidth * 0.85, imageWidth * 0.92, imageWidth]
}

export function reconstructTableRows(
  lines: readonly OcrLine[],
  imageWidth: number,
  newProducts: ProductionCatalogItem[],
  possibleMatches: { sourceText: string; product: ProductionCatalogItem; date: string | null; totalKg: number }[],
): ParsedProductionScreenshotRow[] {
  const groupedLines = groupOcrLinesByY(lines)
  const boundaries = detectColumnBoundaries(groupedLines, imageWidth)
  const productColumnEnd = boundaries[1]!
  const dateColumnEnd = boundaries[2]!
  const aroColumnEnd = boundaries[3]!
  const adjustmentColumnEnd = boundaries[4]!
  const totalColumnEnd = boundaries[5]!
  const totalKgColumnEnd = boundaries[5]!
  const imageEnd = boundaries[6]!

  return groupedLines.flatMap((line) => {
    const words = line.words.filter((word) => word.text.trim() !== '')
    if (
      words.length === 0 ||
      /producto|horario|cantidad|total general|ajuste/i.test(line.text)
    ) {
      return []
    }

    const productName = words
      .filter((word) => word.bbox.x0 < productColumnEnd)
      .sort((first, second) => first.bbox.x0 - second.bbox.x0)
      .map((word) => word.text)
      .join(' ')
      .trim()
    if (productName.length < 5) return []

    const dateWord = words.find((word) => word.bbox.x0 >= productColumnEnd && word.bbox.x0 < dateColumnEnd && /20\d{2}[-/]\d{1,2}[-/]\d{1,2}/.test(word.text))
    const date = dateWord ? extractDate(dateWord.text) : null
    const valueIn = (start: number, end: number) => {
      const word = words.find((candidate) => candidate.bbox.x0 >= start && candidate.bbox.x0 < end && parseNumber(candidate.text) !== null)
      return word ? parseNumber(word.text) : null
    }
    const aroQuantity = valueIn(dateColumnEnd, aroColumnEnd)
    const adjustment = valueIn(aroColumnEnd, adjustmentColumnEnd) ?? 0
    const rowTotal = valueIn(adjustmentColumnEnd, totalColumnEnd)
    const rawTotalKg = valueIn(totalKgColumnEnd, imageEnd + 1)
    if (aroQuantity === null && rawTotalKg === null) return []
    const totalKg = rawTotalKg ?? rowTotal ?? Math.round((aroQuantity ?? 0) * 10 * 100) / 100
    const match = matchProduct(productName)
    const product = match.product ?? createUnconfirmedCatalogItem(productName)
    if (match.kind === 'NEW_PRODUCT' && !newProducts.some((candidate) => candidate.productId === product.productId)) {
      newProducts.push(product)
    }
    if (match.kind === 'LIKELY_MATCH' && match.product && !possibleMatches.some((candidate) => candidate.sourceText === productName)) {
      possibleMatches.push({ sourceText: productName, product: match.product, date, totalKg })
    }
    return [{
      product,
      aroQuantity: aroQuantity ?? 0,
      adjustment,
      rowTotal,
      totalKg,
      totalKgSource: rawTotalKg !== null ? 'ROW_TOTAL_KG' : 'ARO_FALLBACK',
      confidence: rawTotalKg !== null ? 0.95 : 0.35,
      date,
      dateStatus: date ? 'DATE_CONFIRMED' : 'DATE_UNCERTAIN',
      sourceText: line.text,
      matchKind: match.kind,
    }]
  })
}

export async function extractProductionScreenshot(file: Blob, options: { targetDate?: string } = {}): Promise<ParsedProductionScreenshot> {
  const worker = await createWorker('spa')
  try {
    const image = await createImageBitmap(file)
    const scale = Math.max(2, Math.min(3, 2400 / image.width))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo preparar la imagen para OCR.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = false
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    image.close()
    const result = await worker.recognize(canvas)
    const text = result.data.text
    const newProducts: ProductionCatalogItem[] = []
    const possibleMatches: { sourceText: string; product: ProductionCatalogItem; date: string | null; totalKg: number }[] = []
    const rowsByColumns = reconstructTableRows(
      result.data.blocks?.flatMap((block) =>
        block.paragraphs.flatMap((paragraph) => paragraph.lines),
      ) ?? [],
      canvas.width,
      newProducts,
      possibleMatches,
    )
    const rawRows = rowsByColumns.length > 0 ? rowsByColumns : parseRows(text, newProducts, possibleMatches)
    const targetDate = normalizeProductionDate(options.targetDate) ?? normalizeProductionDate(extractDate(text))
    const classified = classifyRowsByDate(rawRows, targetDate)
    const rows = classified.rows
    const otherDateRows = classified.otherDateRows
    const footerNumbers = text
      .split(/\r?\n/)
      .filter((line) => /total general|total \(aros/i.test(line))
      .flatMap(numbersFromLine)
    const numbers = footerNumbers
    const detectedTotalKg = numbers.length > 0 ? numbers.at(-1)! : null
    const rowsTotalKg = rows.reduce((sum, row) => sum + row.totalKg, 0)
    const selectedDateTotalKg = rows.filter((row) => row.dateStatus === 'TARGET_DATE').reduce((sum, row) => sum + row.totalKg, 0)
    const warnings = [...(rows.length === 0 ? ['No se pudo obtener suficiente información de esta captura.'] : [])]
    if (detectedTotalKg !== null && Math.abs(rowsTotalKg - detectedTotalKg) > 0.01) {
      warnings.push(`El detalle detectado suma ${rowsTotalKg.toLocaleString('es-PE')} kg, pero el total de la captura indica ${detectedTotalKg.toLocaleString('es-PE')} kg. Revisa las filas antes de guardar.`)
    }
    const otherDateTotalKg = otherDateRows.reduce((sum, row) => sum + row.totalKg, 0)
    if (detectedTotalKg !== null && otherDateTotalKg > 0) {
      warnings.push(`El total completo de la captura es ${detectedTotalKg.toLocaleString('es-PE')} kg e incluye ${otherDateTotalKg.toLocaleString('es-PE')} kg de otras fechas.`)
    }
    if (rows.some((row) => row.totalKgSource === 'ARO_FALLBACK')) {
      warnings.push('Una o más filas no tienen TOTAL KG confiable y requieren revisión manual.')
    }
    return {
      rows,
      date: extractDate(text),
      totalAros: numbers[0] ?? null,
      totalKg: detectedTotalKg,
      newProducts,
      possibleMatches,
      sourceGrandTotalKg: detectedTotalKg,
      reconstructedGrandTotalKg: rowsTotalKg,
      selectedDateTotalKg,
      otherDateRows,
      targetDate,
      warnings,
    }
  } finally {
    await worker.terminate()
  }
}

function rowFromScreenshot(
  row: ParsedProductionScreenshotRow,
  index: number,
  shift: 'DAY' | 'NIGHT',
): ProductionCaptureRow {
  return {
    key: `screenshot-${row.product.productId}-${index}`,
    product: row.product,
    dayReportedKg: shift === 'DAY' ? String(row.totalKg) : '0',
    dayPreviousBalanceKg: '0',
    nightReportedKg: shift === 'NIGHT' ? String(row.totalKg) : '0',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '0',
    finishedKg: '',
  }
}

export function mergeScreenshotIntoDraft(
  draft: ProductionCaptureDraft,
  parsed: ParsedProductionScreenshot,
  shift: 'DAY' | 'NIGHT',
): ProductionCaptureDraft {
  const targetDate = normalizeProductionDate(parsed.targetDate ?? parsed.date)
  const selectedRows = parsed.rows.filter(
    (row) =>
      row.dateStatus === 'TARGET_DATE' ||
      (targetDate !== null && normalizeProductionDate(row.date) === targetDate),
  )
  const rows = [...draft.rows]
  for (const [index, parsedRow] of selectedRows.entries()) {
    const existing = rows.find((row) => row.product.productId === parsedRow.product.productId)
    if (!existing) {
      rows.push(rowFromScreenshot(parsedRow, index, shift))
      continue
    }
    const currentValue = shift === 'DAY' ? existing.dayReportedKg : existing.nightReportedKg
    const value = String(Number(currentValue || 0) + parsedRow.totalKg)
    const next = shift === 'DAY'
      ? { ...existing, dayReportedKg: value }
      : { ...existing, nightReportedKg: value }
    rows[rows.indexOf(existing)] = next
  }

  const totalKg = selectedRows.reduce((sum, row) => sum + row.totalKg, 0)
  return {
    ...draft,
    source: 'SCREENSHOT',
    sourceSheet: draft.sourceSheet === 'CAPTURA WEB' ? 'CAPTURA IMAGEN' : draft.sourceSheet,
    shiftAllocationMode: 'EXPLICIT',
    date: parsed.date ?? draft.date,
    declaredDayTotalKg: shift === 'DAY' ? String(totalKg) : draft.declaredDayTotalKg || '0',
    declaredNightTotalKg: shift === 'NIGHT' ? String(totalKg) : draft.declaredNightTotalKg || '0',
    rows,
  }
}

export function replaceScreenshotShift(
  draft: ProductionCaptureDraft,
  shift: 'DAY' | 'NIGHT',
): ProductionCaptureDraft {
  return {
    ...draft,
    ...(shift === 'DAY'
      ? { declaredDayTotalKg: '0' }
      : { declaredNightTotalKg: '0' }),
    rows: draft.rows.map((row) =>
      shift === 'DAY'
        ? { ...row, dayReportedKg: '0' }
        : { ...row, nightReportedKg: '0' },
    ),
  }
}

function classifyRowsByDate(
  rows: readonly ParsedProductionScreenshotRow[],
  targetDate: string | null,
): { rows: ParsedProductionScreenshotRow[]; otherDateRows: ParsedProductionScreenshotRow[] } {
  const normalizedTarget = normalizeProductionDate(targetDate)
  const dateCounts = new Map<string, number>()
  for (const row of rows) {
    const normalized = normalizeProductionDate(row.date)
    if (normalized) dateCounts.set(normalized, (dateCounts.get(normalized) ?? 0) + 1)
  }
  const dominantDate = [...dateCounts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] ?? null
  const effectiveTarget = normalizedTarget ?? dominantDate
  const classified = rows.map((row) => {
    const normalizedRowDate = normalizeProductionDate(row.date)
    if (!normalizedRowDate) return { ...row, dateStatus: 'DATE_UNCERTAIN' as const }
    if (effectiveTarget && normalizedRowDate === effectiveTarget) {
      return { ...row, date: normalizedRowDate, dateStatus: 'TARGET_DATE' as const }
    }
    const targetParts = effectiveTarget?.split('-')
    const rowParts = normalizedRowDate.split('-')
    if (targetParts && rowParts[1] === targetParts[1] && rowParts[2] === targetParts[2]) {
      return { ...row, originalDate: row.date, date: effectiveTarget, dateStatus: 'DATE_UNCERTAIN' as const }
    }
    return { ...row, date: normalizedRowDate, dateStatus: 'OTHER_DATE_CONFIRMED' as const }
  })
  return {
    rows: classified,
    otherDateRows: classified.filter((row) => row.dateStatus === 'OTHER_DATE_CONFIRMED'),
  }
}