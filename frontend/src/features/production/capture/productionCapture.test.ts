import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import {
  buildProductionDayFromCapture,
  createEmptyCaptureDraft,
  type ProductionCaptureRow,
} from './productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from './productionCatalog'

function row(overrides: Partial<ProductionCaptureRow> = {}): ProductionCaptureRow {
  return {
    key: 'row-1',
    product: PRODUCTION_CATALOG_ITEMS.find(
      (product) => product.productId === 'aleta-cruda-codificada',
    )!,
    dayReportedKg: '50',
    dayPreviousBalanceKg: '0',
    nightReportedKg: '30',
    nightPreviousBalanceKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '20',
    finishedKg: '100',
    ...overrides,
  }
}

describe('production capture', () => {
  it('builds a balanced manual day without changing domain calculations', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-07'),
      rawMaterialKg: '125',
      declaredDayTotalKg: '50',
      declaredNightTotalKg: '30',
      declaredFinishedTotalKg: '100',
      rows: [row()],
    }
    const result = buildProductionDayFromCapture(draft, [], [], 'CLOSED')

    expect(result.inputErrors).toEqual([])
    expect(result.productionDay.status).toBe('CLOSED')
    expect(result.calculation.status).toBe('BALANCED')
    expect(result.calculation.differenceKg100).toBe(kg100(0))
    expect(result.calculation.newClosingBalanceKg100).toBe(kg100(2_000))
  })

  it('flags previous balance that has no traceable origin', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-07'),
      rawMaterialKg: '125',
      declaredDayTotalKg: '51',
      declaredNightTotalKg: '30',
      declaredFinishedTotalKg: '100',
      rows: [row({ dayReportedKg: '51', dayPreviousBalanceKg: '1' })],
    }
    const result = buildProductionDayFromCapture(draft, [], [])

    expect(
      result.calculation.integrityIssues.map((issue) => issue.code),
    ).toContain('BALANCE_OVERUSED')
    expect(result.calculation.status).toBe('UNBALANCED')
  })

  it('reconciles product shifts for an imported sheet while retaining confidence', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-08'),
      source: 'EXCEL' as const,
      sourceSheet: 'MARTES',
      shiftAllocationMode: 'RECONCILED_INFERENCE' as const,
      rawMaterialKg: '125',
      declaredDayTotalKg: '50',
      declaredNightTotalKg: '30',
      declaredFinishedTotalKg: '100',
      rows: [row({ dayReportedKg: '', nightReportedKg: '' })],
    }
    const result = buildProductionDayFromCapture(draft, [], [])

    expect(result.calculation.status).toBe('BALANCED')
    expect(result.productionDay.lines[0]?.shiftBreakdownConfidence).toBe(
      'RECONCILED_INFERENCE',
    )
    expect(result.calculation.day.declaredReportedKg100).toBe(kg100(5_000))
    expect(result.calculation.night.declaredReportedKg100).toBe(kg100(3_000))
  })
})
