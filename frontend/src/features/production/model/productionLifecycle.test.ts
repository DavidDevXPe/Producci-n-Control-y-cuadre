import { describe, expect, it } from 'vitest'
import {
  buildProductionDayFromCapture,
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
} from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import { getProductionDayOperationalState } from './productionLifecycle'

function tuesdayDraft(): ProductionCaptureDraft {
  const product = PRODUCTION_CATALOG_ITEMS.find(
    (candidate) => candidate.productId === 'recorte-crudo-manto-japones',
  )
  if (!product) throw new Error('Missing Tuesday regression product.')

  return {
    ...createEmptyCaptureDraft('2026-09-08', 'PACKING'),
    rawMaterialKg: '630410',
    declaredDayTotalKg: '250000',
    declaredNightTotalKg: '207234.8',
    rows: [
      {
        key: 'tuesday-regression-product',
        product,
        dayReportedKg: '250000',
        dayPreviousBalanceKg: '0',
        nightReportedKg: '207234.8',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '65000',
        finishedKg: '',
      },
    ],
  }
}

describe('production day lifecycle', () => {
  it('keeps mathematical balance separate from the editable lifecycle', () => {
    const built = buildProductionDayFromCapture(tuesdayDraft(), [], [])
    const state = getProductionDayOperationalState(built.productionDay)

    expect(built.calculation.declaredFinishedKg100).toBe(52_223_480)
    expect(built.calculation.newClosingBalanceKg100).toBe(6_500_000)
    expect(built.calculation.differenceKg100).toBe(0)
    expect(built.calculation.performance.percent).toBeCloseTo(82.84, 2)
    expect(state.lifecycle).toBe('DRAFT')
    expect(state.isBalanced).toBe(true)
    expect(state.canClose).toBe(true)
    expect(state.state).toBe('READY_TO_CLOSE')
    expect(built.productionDay.status).toBe('DRAFT')
  })

  it('changes to closed only after an explicit persisted status change', () => {
    const draft = buildProductionDayFromCapture(tuesdayDraft(), [], [])
      .productionDay
    const closed = { ...draft, status: 'CLOSED' as const }

    expect(getProductionDayOperationalState(draft).state).toBe('READY_TO_CLOSE')
    expect(getProductionDayOperationalState(closed)).toMatchObject({
      lifecycle: 'CLOSED',
      state: 'CLOSED_BALANCED',
      isBalanced: true,
      canClose: false,
    })
  })

  it('reports an incomplete draft as review even when its zeroes coincide', () => {
    const built = buildProductionDayFromCapture(
      createEmptyCaptureDraft('2026-09-08', 'PACKING'),
      [],
      [],
    )
    const state = getProductionDayOperationalState(built.productionDay)

    expect(state.lifecycle).toBe('DRAFT')
    expect(state.isBalanced).toBe(false)
    expect(state.canClose).toBe(false)
    expect(state.state).toBe('DRAFT_REVIEW')
  })
})
