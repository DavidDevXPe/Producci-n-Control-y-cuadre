import { describe, expect, it } from 'vitest'
import { createEmptyCaptureDraft } from './productionCapture'
import {
  mergeScreenshotIntoDraft,
  reconstructTableRows,
  type ParsedProductionScreenshot,
} from './parseProductionScreenshot'

const screenshot: ParsedProductionScreenshot = {
  date: '2026-09-14',
  totalAros: 3053,
  totalKg: 30530,
  warnings: [],
  newProducts: [],
  possibleMatches: [],
  sourceGrandTotalKg: 30530,
  reconstructedGrandTotalKg: 30530,
  selectedDateTotalKg: 30530,
  otherDateRows: [],
  targetDate: '2026-09-14',
  rows: [
    {
      product: {
        familyId: 'aleta-cruda',
        familyName: 'ALETA CRUDA',
        productId: 'aleta-1',
        productName: 'ALETA CRUDA 1000 g - 2000 g',
        summaryGroupId: 'ALETA',
      },
      aroQuantity: 3053,
      adjustment: 0,
      rowTotal: 3053,
      totalKg: 30530,
      totalKgSource: 'ROW_TOTAL_KG',
      confidence: 0.95,
      date: '2026-09-14',
      sourceText: 'ALETA CRUDA 2026-09-14 3,053.00 0.00 30,530.00',
      matchKind: 'NEW_PRODUCT',
      dateStatus: 'DATE_CONFIRMED',
    },
  ],
}

describe('mergeScreenshotIntoDraft', () => {
  it('stores a day screenshot using the fixed ten-kilogram conversion', () => {
    const draft = mergeScreenshotIntoDraft(
      createEmptyCaptureDraft('2026-09-14', 'PACKING'),
      screenshot,
      'DAY',
    )

    expect(draft.source).toBe('SCREENSHOT')
    expect(draft.date).toBe('2026-09-14')
    expect(draft.declaredDayTotalKg).toBe('30530')
    expect(draft.rows[0]?.dayReportedKg).toBe('30530')
    expect(draft.rows[0]?.nightReportedKg).toBe('0')
  })

  it('combines the second shift into the same product row', () => {
    const first = mergeScreenshotIntoDraft(
      createEmptyCaptureDraft('2026-09-14', 'FREEZING'),
      screenshot,
      'DAY',
    )
    const second = mergeScreenshotIntoDraft(first, {
      ...screenshot,
      rows: screenshot.rows.map((row) => ({ ...row, totalKg: 1000 })),
    }, 'NIGHT')

    expect(second.rows).toHaveLength(1)
    expect(second.rows[0]?.dayReportedKg).toBe('30530')
    expect(second.rows[0]?.nightReportedKg).toBe('1000')
    expect(second.declaredNightTotalKg).toBe('1000')
  })

  it('uses only the selected date when a capture contains another date', () => {
    const next = mergeScreenshotIntoDraft(
      createEmptyCaptureDraft('2026-09-14', 'PACKING'),
      {
        ...screenshot,
        rows: [
          ...screenshot.rows,
          { ...screenshot.rows[0]!, totalKg: 880, date: '2026-09-12' },
        ],
      },
      'DAY',
    )

    expect(next.declaredDayTotalKg).toBe('30530')
    expect(next.rows).toHaveLength(1)
  })
})

describe('reconstructTableRows', () => {
  it('uses the last TOTAL KG column instead of multiplying aros', () => {
    const newProducts: never[] = []
    const possibleMatches: never[] = []
    const words = (text: string, x0: number) => ({
      text,
      bbox: { x0, x1: x0 + 20, y0: 100, y1: 120 },
    })
    const rows = reconstructTableRows(
      [{
        text: 'MANTO ESTANDAR CRUDO 2026-09-14 4711 0 4711 47110',
        words: [
          words('MANTO', 10),
          words('ESTANDAR', 80),
          words('CRUDO', 180),
          words('2026-09-14', 570),
          words('4711', 680),
          words('0', 790),
          words('4711', 860),
          words('47110', 940),
        ],
      }],
      1000,
      newProducts,
      possibleMatches,
    )

    expect(rows[0]).toMatchObject({
      aroQuantity: 4711,
      rowTotal: 4711,
      totalKg: 47110,
      totalKgSource: 'ROW_TOTAL_KG',
      date: '2026-09-14',
    })
  })
})