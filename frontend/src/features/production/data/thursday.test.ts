import { describe, expect, it } from 'vitest'
import { WEEK_36_2026_PERIOD, WEEK_36_2026_PRODUCTION_DAYS } from './week36'
import { THURSDAY_PRODUCTION_DAY } from './thursday'
import { calculateProductionDay, calculateWeeklySummary, kg100 } from '../model/calculations'

describe('Thursday production source', () => {
  it('reconciles the closed Thursday sheet without changing domain rules', () => {
    const calculation = calculateProductionDay(THURSDAY_PRODUCTION_DAY)

    expect(calculation.integrityIssues).toEqual([])
    expect({
      differenceKg100: calculation.differenceKg100,
      dayDetailDifferenceKg100: calculation.day.detailDifferenceKg100,
      nightDetailDifferenceKg100: calculation.night.detailDifferenceKg100,
      productDifferences: calculation.products
        .filter((product) => product.differenceKg100 !== 0)
        .map((product) => ({
          productId: product.productId,
          differenceKg100: product.differenceKg100,
        })),
    }).toEqual({
      differenceKg100: kg100(0),
      dayDetailDifferenceKg100: kg100(0),
      nightDetailDifferenceKg100: kg100(0),
      productDifferences: [],
    })
    expect(calculation.status).toBe('BALANCED')
    expect(calculation.declaredFinishedKg100).toBe(kg100(31_597_750))
    expect(calculation.newClosingBalanceKg100).toBe(kg100(2_377_000))
    expect(calculation.processedPreviousBalanceKg100).toBe(kg100(4_029_830))
    expect(calculation.pendingPreviousBalanceKg100).toBe(kg100(0))
    expect(calculation.differenceKg100).toBe(kg100(0))
    expect(calculation.performance.percent).toBeCloseTo(77.04588457899862)
  })

  it('keeps the Wednesday and Thursday weekly summary consistent', () => {
    const summary = calculateWeeklySummary(
      WEEK_36_2026_PRODUCTION_DAYS,
      WEEK_36_2026_PERIOD,
    )

    expect(summary.integrityIssues).toEqual([])
    expect(summary.status).toBe('VALID')
    expect(summary.rawMaterialKg100).toBe(kg100(73_355_600))
    expect(summary.declaredFinishedKg100).toBe(kg100(55_979_550))
    expect(summary.detailFinishedKg100).toBe(kg100(55_979_550))
    expect(summary.differenceKg100).toBe(kg100(0))
    expect(summary.productTotals).toHaveLength(28)
  })
})
