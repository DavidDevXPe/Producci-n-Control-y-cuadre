import { describe, expect, it } from 'vitest'
import {
  buildProductionDayFromCapture,
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
  type ProductionCaptureRow,
} from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import { validateProductionClosure } from './businessRules'
import { calculateOutstandingBalances, calculateWeeklySummary, kg } from './calculations'

const product = PRODUCTION_CATALOG_ITEMS.find(
  (item) => item.summaryGroupId === 'RECORTE_CRUDO',
)!

function row(
  dayReportedKg: string,
  closingBalanceKg = '0',
): ProductionCaptureRow {
  return {
    key: `row-${dayReportedKg}-${closingBalanceKg}`,
    product,
    dayReportedKg,
    dayPreviousBalanceKg: '0',
    nightReportedKg: '0',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '0',
    closingBalanceKg,
    finishedKg: '',
  }
}

function saturdayWithBalance() {
  const draft: ProductionCaptureDraft = {
    ...createEmptyCaptureDraft('2026-09-12'),
    rawMaterialKg: '37500',
    declaredDayTotalKg: '0',
    declaredNightTotalKg: '0',
    rows: [row('0', '30000')],
  }
  return buildProductionDayFromCapture(draft, [], [], 'CLOSED').productionDay
}

function sundayUsingBalance(processedKg: string) {
  const saturday = saturdayWithBalance()
  const availableKg100 = kg(30_000)
  const draft: ProductionCaptureDraft = {
    ...createEmptyCaptureDraft('2026-09-13'),
    declaredDayTotalKg: processedKg,
    declaredNightTotalKg: '0',
    rows: [row(processedKg)],
    balanceUses: [{
      key: 'saturday-balance',
      originDayId: saturday.id,
      originDate: saturday.date,
      familyId: product.familyId,
      familyName: product.familyName,
      productId: product.productId,
      productName: product.productName,
      availableKg100,
      dayKg: processedKg,
      nightKg: '0',
    }],
  }
  const result = buildProductionDayFromCapture(
    draft,
    [saturday],
    [],
    'CLOSED',
  )

  return { saturday, draft, result }
}

describe('Sunday balance-only operation', () => {
  it('closes with MP 0, reconciled physical reports and zero own production', () => {
    const { result } = sundayUsingBalance('30000')
    const validation = validateProductionClosure(
      result.productionDay,
      result.calculation,
      { requiredDataComplete: true, inputErrors: result.inputErrors },
    )

    expect(result.productionDay.operationMode).toBe('BALANCE_ONLY')
    expect(result.productionDay.declaredRawMaterialKg100).toBe(kg(0))
    expect(result.calculation.processedPreviousBalanceKg100).toBe(kg(30_000))
    expect(result.calculation.reportOwnProductionKg100).toBe(kg(0))
    expect(result.calculation.declaredFinishedKg100).toBe(kg(0))
    expect(result.calculation.performance.percent).toBeNull()
    expect(validation.canClose).toBe(true)
    expect(validation.blockers).toEqual([])
  })

  it('does not add Sunday physical processing to weekly finished production', () => {
    const { saturday, result } = sundayUsingBalance('30000')
    const summary = calculateWeeklySummary(
      [saturday, result.productionDay],
      { startDate: '2026-09-07', endDate: '2026-09-13' },
    )

    expect(summary.declaredFinishedKg100).toBe(kg(30_000))
  })

  it('keeps a partial remainder attached to Saturday across the week boundary', () => {
    const { saturday, result: sunday } = sundayUsingBalance('25000')
    const afterSunday = calculateOutstandingBalances([
      saturday,
      sunday.productionDay,
    ])
    const remainder = afterSunday.find(
      (position) => position.originDayId === saturday.id,
    )!

    expect(remainder.pendingKg100).toBe(kg(5_000))
    expect(remainder.originDayId).toBe(saturday.id)

    const mondayDraft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-14'),
      rawMaterialKg: '0',
      declaredDayTotalKg: '5000',
      declaredNightTotalKg: '0',
      rows: [row('5000')],
      balanceUses: [{
        key: 'carried-balance',
        originDayId: remainder.originDayId,
        originDate: remainder.originDate,
        familyId: remainder.familyId,
        familyName: remainder.familyName,
        productId: remainder.productId,
        productName: remainder.productName,
        availableKg100: remainder.pendingKg100,
        dayKg: '5000',
        nightKg: '0',
      }],
    }
    const monday = buildProductionDayFromCapture(
      mondayDraft,
      [saturday, sunday.productionDay],
      [],
      'DRAFT',
    ).productionDay

    expect(monday.receivedBalanceLots[0]?.originDayId).toBe(saturday.id)
    expect(
      calculateOutstandingBalances([saturday, sunday.productionDay, monday])
        .find((position) => position.originDayId === saturday.id)
        ?.pendingKg100,
    ).toBe(kg(0))
  })

  it('blocks physical Sunday production that is not linked to an earlier balance', () => {
    const saturday = saturdayWithBalance()
    const draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-13'),
      declaredDayTotalKg: '30000',
      declaredNightTotalKg: '0',
      rows: [row('30000')],
      balanceUses: [{
        key: 'partial-link',
        originDayId: saturday.id,
        originDate: saturday.date,
        familyId: product.familyId,
        familyName: product.familyName,
        productId: product.productId,
        productName: product.productName,
        availableKg100: kg(30_000),
        dayKg: '25000',
        nightKg: '0',
      }],
    }
    const result = buildProductionDayFromCapture(draft, [saturday], [])
    const validation = validateProductionClosure(
      result.productionDay,
      result.calculation,
      { requiredDataComplete: true, inputErrors: result.inputErrors },
    )

    expect(result.calculation.reportOwnProductionKg100).toBe(kg(5_000))
    expect(validation.canClose).toBe(false)
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: 'BALANCE_ONLY_UNLINKED_PRODUCTION' }),
    )
  })

  it('rejects consuming more balance than the physical Sunday report', () => {
    const saturday = saturdayWithBalance()
    const draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-13'),
      declaredDayTotalKg: '25000',
      declaredNightTotalKg: '0',
      rows: [row('25000')],
      balanceUses: [{
        key: 'over-report',
        originDayId: saturday.id,
        originDate: saturday.date,
        familyId: product.familyId,
        familyName: product.familyName,
        productId: product.productId,
        productName: product.productName,
        availableKg100: kg(30_000),
        dayKg: '30000',
        nightKg: '0',
      }],
    }
    const result = buildProductionDayFromCapture(draft, [saturday], [])
    const validation = validateProductionClosure(
      result.productionDay,
      result.calculation,
      { requiredDataComplete: true, inputErrors: result.inputErrors },
    )

    expect(result.calculation.integrityIssues.length).toBeGreaterThan(0)
    expect(validation.canClose).toBe(false)
  })

  it('uses normal production rules when Sunday discharge is explicitly enabled', () => {
    const draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-13'),
      operationMode: 'NORMAL',
      rawMaterialKg: '100',
      declaredDayTotalKg: '80',
      declaredNightTotalKg: '0',
      rows: [row('80')],
    }
    const result = buildProductionDayFromCapture(draft, [], [])

    expect(result.productionDay.operationMode).toBe('NORMAL')
    expect(result.productionDay.declaredRawMaterialKg100).toBe(kg(100))
    expect(result.calculation.declaredFinishedKg100).toBe(kg(80))
    expect(result.calculation.performance.percent).toBe(80)
  })
})
