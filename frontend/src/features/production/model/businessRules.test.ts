import { describe, expect, it } from 'vitest'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  kg,
  kg100,
  sumKg100,
} from './calculations'
import {
  calculateReportFamilySubtotals,
  calculateProductionBusinessSummary,
  validateProductionClosure,
} from './businessRules'
import type {
  ProductionDay,
  ProductionLine,
  SummaryGroupId,
} from './types'

interface LineSeed {
  group: SummaryGroupId
  day?: number
  night?: number
  tunnelDay?: number
  tunnelNight?: number
  treatment?: number
  closing?: number
}

const productIdsByGroup: Partial<Record<SummaryGroupId, readonly string[]>> = {
  ALETA: ['aleta-cruda-codificada'],
  MANTO: ['manto-japones-crudo'],
  ANILLAS: ['anillas-espana-polar-mixta'],
  RECORTE_CRUDO: ['recorte-crudo-manto-japones'],
  REJOS: ['rejo-baa-1-2'],
  REPRODUCTOR: ['reproductor-50-70'],
  NUCA_SEMILIMPIA: ['nuca-semilimpia-codificada'],
  NUCA_BIKINI: ['nuca-bikini-300-500'],
}

function lineFor(seed: LineSeed, index: number): ProductionLine {
  const productId = productIdsByGroup[seed.group]?.[0]
  const product = PRODUCTION_CATALOG_ITEMS.find(
    (candidate) => candidate.productId === productId,
  )
  if (!product) throw new Error(`Missing test product for ${seed.group}`)

  const day = kg(seed.day ?? 0)
  const night = kg(seed.night ?? 0)
  const tunnelDay = kg(seed.tunnelDay ?? 0)
  const tunnelNight = kg(seed.tunnelNight ?? 0)
  const treatment = kg(seed.treatment ?? 0)
  const closing = kg(seed.closing ?? 0)

  return {
    ...product,
    source: { sheet: 'TEST', cell: `A${index + 1}` },
    shiftBreakdownConfidence: 'EXPLICIT',
    shifts: {
      DAY: { reportedKg100: day, adjustments: [] },
      NIGHT: { reportedKg100: night, adjustments: [] },
    },
    tunnelShifts: {
      DAY: { reportedKg100: tunnelDay, adjustments: [] },
      NIGHT: { reportedKg100: tunnelNight, adjustments: [] },
    },
    treatmentKg100: treatment,
    newClosingBalanceKg100: closing,
    declaredFinishedKg100: sumKg100([
      day,
      night,
      tunnelDay,
      tunnelNight,
      treatment,
      closing,
    ]),
  }
}

function productionDay(
  rawMaterialKg: number,
  seeds: readonly LineSeed[],
  options: {
    date?: string
    nucaBikiniOrder?: boolean
  } = {},
): ProductionDay {
  const date = options.date ?? '2026-09-07'
  const lines = seeds.map(lineFor)
  const dayTotal = sumKg100(
    lines.map((line) => line.shifts.DAY.reportedKg100),
  )
  const nightTotal = sumKg100(
    lines.map((line) => line.shifts.NIGHT.reportedKg100),
  )
  const finishedTotal = sumKg100(
    lines.map((line) => line.declaredFinishedKg100),
  )

  return {
    id: `production-day-${date}`,
    date,
    displayName: date,
    status: 'DRAFT',
    rawMaterialEntries: [
      { id: `raw-material-${date}`, kg100: kg(rawMaterialKg), shift: null },
    ],
    declaredRawMaterialKg100: kg(rawMaterialKg),
    declaredShiftTotalsKg100: { DAY: dayTotal, NIGHT: nightTotal },
    declaredFinishedTotalKg100: finishedTotal,
    lines,
    receivedBalanceLots: [],
    nucaWashAuthorization: options.nucaBikiniOrder
      ? {
          kind: 'USER_CONFIRMED_ORDER',
          reference: null,
          reason: 'Pedido confirmado para prueba.',
        }
      : null,
    performanceReferenceBasisPoints: 8_000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  }
}

function summaryFor(day: ProductionDay) {
  const calculation = calculateProductionDay(day)
  return {
    calculation,
    summary: calculateProductionBusinessSummary(day, calculation),
  }
}

function family(
  summary: ReturnType<typeof calculateProductionBusinessSummary>,
  key: 'ALETA' | 'REJO_REPRODUCTOR' | 'NUCA' | 'MANTO',
) {
  return summary.families.find((candidate) => candidate.key === key)!
}

describe('production business rules', () => {
  it('recalculates report-only Aleta subtotals and preliminary yield', () => {
    const initialDay = productionDay(500_000, [
      { group: 'ALETA', day: 47_020, night: 49_380 },
    ])
    const changedDay = productionDay(500_000, [
      { group: 'ALETA', day: 48_020, night: 49_380 },
    ])
    const initial = calculateReportFamilySubtotals(initialDay)[0]!
    const changed = calculateReportFamilySubtotals(changedDay)[0]!

    expect(initial.dayKg100).toBe(kg(47_020))
    expect(initial.nightKg100).toBe(kg(49_380))
    expect(initial.totalKg100).toBe(kg(96_400))
    expect(initial.preliminaryYieldPercent).toBeCloseTo(96.4, 8)
    expect(changed.totalKg100).toBe(kg(97_400))
    expect(changed.preliminaryYieldPercent).toBeCloseTo(97.4, 8)
  })

  it('updates Aleta from 78% to 90% when a real closing balance is entered', () => {
    const before = summaryFor(
      productionDay(100, [{ group: 'ALETA', day: 15.6 }]),
    ).summary
    const projected = summaryFor(
      productionDay(100, [{ group: 'ALETA', day: 15.6, closing: 2.4 }]),
    ).summary

    expect(family(before, 'ALETA').projectedYieldPercent).toBeCloseTo(78, 8)
    expect(family(before, 'ALETA').missingToTargetKg100).toBe(kg(2.4))
    expect(family(projected, 'ALETA').projectedYieldPercent).toBeCloseTo(90, 8)
    expect(family(projected, 'ALETA').missingToTargetKg100).toBe(kg100(0))
    expect(family(projected, 'ALETA').capacityToOneHundredKg100).toBe(kg(4.4))
    expect(family(projected, 'ALETA').status).toBe('COMPLIES')
  })

  it('allows an 88% Aleta result through an explicit warning confirmation path', () => {
    const day = productionDay(100, [
      { group: 'ALETA', day: 17.6 },
      { group: 'RECORTE_CRUDO', day: 62.4 },
    ])
    const { calculation, summary } = summaryFor(day)
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    })

    expect(summary.generalYieldPercent).toBeCloseTo(80, 8)
    expect(family(summary, 'ALETA').projectedYieldPercent).toBeCloseTo(88, 8)
    expect(validation.canClose).toBe(true)
    expect(validation.warnings).toContainEqual(
      expect.objectContaining({
        code: 'FAMILY_BELOW_TARGET',
        familyKey: 'ALETA',
      }),
    )
  })

  it('blocks Aleta above 100%', () => {
    const day = productionDay(100, [
      { group: 'ALETA', day: 20.01 },
      { group: 'RECORTE_CRUDO', day: 59.99 },
    ])
    const { calculation, summary } = summaryFor(day)
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    })

    expect(family(summary, 'ALETA').status).toBe('INTEGRITY_ERROR')
    expect(validation.canClose).toBe(false)
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: 'FAMILY_YIELD_ABOVE_MAX', familyKey: 'ALETA' }),
    )
  })

  it('uses one identical yield and automatic MP split for Rejo and Reproductor', () => {
    const { summary } = summaryFor(
      productionDay(100, [
        { group: 'REJOS', day: 10 },
        { group: 'REPRODUCTOR', day: 5 },
      ]),
    )

    expect(summary.rejoReproductor.sharedYieldPercent).toBeCloseTo(100, 8)
    expect(family(summary, 'REJO_REPRODUCTOR').projectedYieldPercent).toBe(
      summary.rejoReproductor.sharedYieldPercent,
    )
    expect(summary.rejoReproductor.rejoRawMaterialKg100).toBe(kg(10))
    expect(summary.rejoReproductor.reproductorRawMaterialKg100).toBe(kg(5))
  })

  it('treats Rejo/Reproductor below 97% as a warning, not a blocker', () => {
    const day = productionDay(100, [
      { group: 'REJOS', day: 10 },
      { group: 'REPRODUCTOR', day: 4 },
      { group: 'RECORTE_CRUDO', day: 66 },
    ])
    const { calculation, summary } = summaryFor(day)
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    })

    expect(family(summary, 'REJO_REPRODUCTOR').projectedYieldPercent).toBeCloseTo(93.333333, 5)
    expect(validation.canClose).toBe(true)
    expect(validation.warnings).toContainEqual(
      expect.objectContaining({ familyKey: 'REJO_REPRODUCTOR' }),
    )
  })

  it('evaluates Nuca semilimpia and Bikini together over the same 15%', () => {
    const { summary } = summaryFor(
      productionDay(
        100,
        [
          { group: 'NUCA_SEMILIMPIA', day: 4 },
          { group: 'NUCA_BIKINI', night: 2.75 },
        ],
        { nucaBikiniOrder: true },
      ),
    )

    expect(family(summary, 'NUCA').rawMaterialKg100).toBe(kg(15))
    expect(family(summary, 'NUCA').projectedProductionKg100).toBe(kg(6.75))
    expect(family(summary, 'NUCA').projectedYieldPercent).toBeCloseTo(45, 8)
  })

  it('includes Nuca Tunnel in the family yield and updates every stage', () => {
    const { summary } = summaryFor(
      productionDay(100, [
        { group: 'NUCA_SEMILIMPIA', day: 2.43, tunnelDay: 4.32 },
        { group: 'RECORTE_CRUDO', day: 73.25 },
      ]),
    )
    const nuca = family(summary, 'NUCA')

    expect(nuca.reportYieldPercent).toBeCloseTo(16.2, 8)
    expect(nuca.tunnelKg100).toBe(kg(4.32))
    expect(nuca.afterTunnelYieldPercent).toBeCloseTo(45, 8)
    expect(nuca.projectedYieldPercent).toBeCloseTo(45, 8)
  })

  it('shows the Bikini 7% reference as information without making it a requirement', () => {
    const day = productionDay(
      100,
      [{ group: 'RECORTE_CRUDO', day: 80 }],
      { nucaBikiniOrder: true },
    )
    const { calculation, summary } = summaryFor(day)
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    })

    expect(summary.nucaBikiniReferenceKg100).toBe(kg(7))
    expect(validation.blockers.map((item) => item.code)).not.toContain(
      'NUCA_BIKINI_REFERENCE',
    )
  })

  it('uses the provisional 42.5% Anillas rate to recalculate Manto MP', () => {
    const { summary } = summaryFor(
      productionDay(100, [
        { group: 'ANILLAS', day: 4.25 },
        { group: 'MANTO', day: 20 },
        { group: 'RECORTE_CRUDO', day: 55.75 },
      ]),
    )

    expect(summary.mantoAnillas.tubeRawMaterialKg100).toBe(kg(50))
    expect(summary.mantoAnillas.anillasRawMaterialKg100).toBe(kg(10))
    expect(summary.mantoAnillas.mantoRawMaterialKg100).toBe(kg(40))
    expect(family(summary, 'MANTO').projectedYieldPercent).toBeCloseTo(50, 8)
  })

  it('blocks a 79.99% general yield and permits 80% with exact reconciliation', () => {
    const below = productionDay(100, [
      { group: 'RECORTE_CRUDO', day: 79.99 },
    ])
    const exact = productionDay(100, [
      { group: 'RECORTE_CRUDO', day: 80 },
    ])
    const belowCalculation = calculateProductionDay(below)
    const exactCalculation = calculateProductionDay(exact)

    expect(
      validateProductionClosure(below, belowCalculation, {
        requiredDataComplete: true,
      }).blockers,
    ).toContainEqual(expect.objectContaining({ code: 'GENERAL_YIELD_BELOW_MIN' }))
    expect(
      validateProductionClosure(exact, exactCalculation, {
        requiredDataComplete: true,
      }).canClose,
    ).toBe(true)
  })

  it('recalculates after treatment changes and blocks when Aleta moves from 90% to 102%', () => {
    const atTargetDay = productionDay(100, [
      { group: 'ALETA', day: 16, closing: 2 },
      { group: 'RECORTE_CRUDO', day: 62 },
    ])
    const correctedDay = productionDay(100, [
      { group: 'ALETA', day: 16, treatment: 2.4, closing: 2 },
      { group: 'RECORTE_CRUDO', day: 62 },
    ])
    const atTarget = summaryFor(atTargetDay)
    const corrected = summaryFor(correctedDay)

    expect(family(atTarget.summary, 'ALETA').projectedYieldPercent).toBeCloseTo(90, 8)
    expect(family(corrected.summary, 'ALETA').projectedYieldPercent).toBeCloseTo(102, 8)
    expect(corrected.summary.finishedKg100).not.toBe(atTarget.summary.finishedKg100)
    expect(
      validateProductionClosure(correctedDay, corrected.calculation, {
        requiredDataComplete: true,
      }).canClose,
    ).toBe(false)
  })

  it('recalculates after Tunnel changes and blocks a family above 100%', () => {
    const day = productionDay(100, [
      { group: 'ALETA', day: 18, tunnelDay: 2.01 },
      { group: 'RECORTE_CRUDO', day: 59.99 },
    ])
    const { calculation, summary } = summaryFor(day)
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    })

    expect(family(summary, 'ALETA').afterTunnelYieldPercent).toBeCloseTo(100.05, 8)
    expect(validation.canClose).toBe(false)
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: 'FAMILY_YIELD_ABOVE_MAX', familyKey: 'ALETA' }),
    )
  })

  it('recalculates family yield when Tunnel changes after a closing balance exists', () => {
    const before = summaryFor(
      productionDay(100, [
        { group: 'ALETA', day: 15.6, closing: 2.4 },
        { group: 'RECORTE_CRUDO', day: 62 },
      ]),
    ).summary
    const after = summaryFor(
      productionDay(100, [
        { group: 'ALETA', day: 15.6, tunnelDay: 1, closing: 2.4 },
        { group: 'RECORTE_CRUDO', day: 61 },
      ]),
    ).summary

    expect(family(before, 'ALETA').projectedYieldPercent).toBeCloseTo(90, 8)
    expect(family(after, 'ALETA').projectedYieldPercent).toBeCloseTo(95, 8)
  })

  it('keeps a Tunnel-influenced family below target as a warning when it is at most 100%', () => {
    const day = productionDay(100, [
      { group: 'ALETA', day: 15, tunnelDay: 2 },
      { group: 'RECORTE_CRUDO', day: 63 },
    ])
    const { calculation, summary } = summaryFor(day)
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    })

    expect(family(summary, 'ALETA').projectedYieldPercent).toBeCloseTo(85, 8)
    expect(validation.canClose).toBe(true)
    expect(validation.warnings).toContainEqual(
      expect.objectContaining({ code: 'FAMILY_BELOW_TARGET', familyKey: 'ALETA' }),
    )
  })

  it('keeps a prior-week balance available after partial Sunday consumption', () => {
    const saturday = productionDay(
      60_000,
      [{ group: 'ALETA', closing: 44_660 }],
      { date: '2026-09-05' },
    )
    const sourceLine = saturday.lines[0]!
    const sunday = productionDay(
      60_000,
      [{ group: 'ALETA', day: 40_000 }],
      { date: '2026-09-06' },
    )
    const sundayWithUse: ProductionDay = {
      ...sunday,
      receivedBalanceLots: [
        {
          id: 'saturday-aleta-balance',
          originDayId: saturday.id,
          familyId: sourceLine.familyId,
          productId: sourceLine.productId,
          originalKg100: kg(44_660),
          uses: [
            {
              id: 'sunday-use',
              targetDayId: sunday.id,
              shift: 'DAY',
              kg100: kg(40_000),
            },
          ],
        },
      ],
    }

    const mondayBalances = calculateOutstandingBalances([
      saturday,
      sundayWithUse,
    ])

    expect(mondayBalances).toContainEqual(
      expect.objectContaining({
        originDayId: saturday.id,
        productId: sourceLine.productId,
        pendingKg100: kg(4_660),
      }),
    )
  })

  it('blocks when calculated Anillas MP exceeds the Tubo/Manto pool', () => {
    const day = productionDay(100, [
      { group: 'ANILLAS', day: 21.26 },
      { group: 'RECORTE_CRUDO', day: 58.74 },
    ])
    const { calculation, summary } = summaryFor(day)
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    })

    expect(summary.mantoAnillas.anillasRawMaterialExcessKg100).toBeGreaterThan(0)
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: 'ANILLAS_MP_EXCEEDS_TUBE' }),
    )
  })

  it('blocks compensating product-detail differences even when the final total is zero', () => {
    const balanced = productionDay(100, [
      { group: 'RECORTE_CRUDO', day: 40 },
      { group: 'ALETA', day: 20 },
    ])
    const inconsistent: ProductionDay = {
      ...balanced,
      lines: balanced.lines.map((line, index) => ({
        ...line,
        declaredFinishedKg100: kg(
          index === 0
            ? line.declaredFinishedKg100 / 100 + 1
            : line.declaredFinishedKg100 / 100 - 1,
        ),
      })),
    }
    const calculation = calculateProductionDay(inconsistent)
    const validation = validateProductionClosure(inconsistent, calculation, {
      requiredDataComplete: true,
    })

    expect(calculation.differenceKg100).toBe(kg100(0))
    expect(validation.canClose).toBe(false)
    expect(validation.blockers.map((item) => item.code)).toContain(
      'PRODUCT_RECONCILIATION_DIFFERENCE',
    )
  })
})
