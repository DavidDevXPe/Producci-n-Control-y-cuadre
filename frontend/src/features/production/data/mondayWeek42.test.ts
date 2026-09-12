import { describe, expect, it } from 'vitest'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  kg100,
  sumKg100,
} from '../model/calculations'
import {
  MONDAY_WEEK_42_LINES,
  MONDAY_WEEK_42_PRODUCTION_DAY,
} from './mondayWeek42'

describe('Monday 07/09/2026 permanent production source', () => {
  it('matches the closed workbook controls exactly', () => {
    const calculation = calculateProductionDay(MONDAY_WEEK_42_PRODUCTION_DAY)

    expect(MONDAY_WEEK_42_PRODUCTION_DAY.status).toBe('CLOSED')
    expect(MONDAY_WEEK_42_PRODUCTION_DAY.declaredRawMaterialKg100).toBe(
      kg100(61_523_900),
    )
    expect(calculation.day.declaredReportedKg100).toBe(kg100(22_347_000))
    expect(calculation.night.declaredReportedKg100).toBe(kg100(20_569_000))
    expect(calculation.tunnel.totalKg100).toBe(kg100(0))
    expect(calculation.treatmentKg100).toBe(kg100(315_300))
    expect(calculation.newClosingBalanceKg100).toBe(kg100(6_045_000))
    expect(calculation.declaredFinishedKg100).toBe(kg100(49_276_300))
    expect(calculation.expectedFinishedKg100).toBe(kg100(49_276_300))
    expect(calculation.differenceKg100).toBe(kg100(0))
    expect(calculation.status).toBe('BALANCED')
    expect(calculation.integrityIssues).toEqual([])
    expect(calculation.performance.percent).toBeCloseTo(80.09293949)
  })

  it('keeps the nine closing balance positions available for the next day', () => {
    const balances = calculateOutstandingBalances([
      MONDAY_WEEK_42_PRODUCTION_DAY,
    ])

    expect(balances).toHaveLength(9)
    expect(sumKg100(balances.map((balance) => balance.pendingKg100))).toBe(
      kg100(6_045_000),
    )
  })

  it('does not classify Rejo Bailarina semi limpio as Nuca semilimpia', () => {
    expect(
      MONDAY_WEEK_42_LINES.find(
        (line) => line.productId === 'rejo-bailarina-500-1000',
      ),
    ).toMatchObject({
      familyId: 'rejos-crudo',
      familyName: 'REJOS CRUDO',
      summaryGroupId: 'REJOS',
    })
  })
})
