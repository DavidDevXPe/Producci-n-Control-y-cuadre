import { describe, expect, it } from 'vitest'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  calculateWeeklySummary,
  kg100,
  sumKg100,
} from '../model/calculations'
import {
  WEEK_36_2026_PERIOD,
  WEEK_36_2026_PRODUCTION_DAYS,
  WEEK_36_2026_REPRODUCTOR_ALLOCATION_KG100,
  WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
} from './week36'

const expectedDays = [
  {
    date: '2026-09-02',
    rawMaterialKg100: 32_344_000,
    finishedKg100: 24_381_800,
    dayReportedKg100: 6_768_000,
    nightReportedKg100: 11_433_000,
    dayOwnKg100: 6_768_000,
    nightOwnKg100: 11_433_000,
    treatmentKg100: 2_150_970,
    balanceKg100: 4_029_830,
    processedPreviousKg100: 0,
    pendingPreviousKg100: 0,
  },
  {
    date: '2026-09-03',
    rawMaterialKg100: 41_011_600,
    finishedKg100: 31_597_750,
    dayReportedKg100: 16_230_000,
    nightReportedKg100: 16_361_000,
    dayOwnKg100: 12_200_170,
    nightOwnKg100: 16_361_000,
    treatmentKg100: 659_580,
    balanceKg100: 2_377_000,
    processedPreviousKg100: 4_029_830,
    pendingPreviousKg100: 0,
  },
  {
    date: '2026-09-04',
    rawMaterialKg100: 52_221_300,
    finishedKg100: 40_585_140,
    dayReportedKg100: 18_896_000,
    nightReportedKg100: 22_090_000,
    dayOwnKg100: 16_519_000,
    nightOwnKg100: 22_090_000,
    treatmentKg100: 894_140,
    balanceKg100: 1_082_000,
    processedPreviousKg100: 2_377_000,
    pendingPreviousKg100: 0,
  },
  {
    date: '2026-09-05',
    rawMaterialKg100: 48_847_600,
    finishedKg100: 45_698_300,
    dayReportedKg100: 19_644_000,
    nightReportedKg100: 21_980_000,
    dayOwnKg100: 18_562_000,
    nightOwnKg100: 21_980_000,
    treatmentKg100: 690_300,
    balanceKg100: 4_466_000,
    processedPreviousKg100: 1_082_000,
    pendingPreviousKg100: 0,
  },
] as const

describe('week 36 production source', () => {
  it('reconciles every registered day against its independent controls', () => {
    expect(
      WEEK_36_2026_PRODUCTION_DAYS.map((day) => {
        const calculation = calculateProductionDay(day)

        return {
          date: day.date,
          rawMaterialKg100: day.declaredRawMaterialKg100,
          finishedKg100: calculation.declaredFinishedKg100,
          dayReportedKg100: calculation.day.declaredReportedKg100,
          nightReportedKg100: calculation.night.declaredReportedKg100,
          dayOwnKg100: calculation.day.ownProductionKg100,
          nightOwnKg100: calculation.night.ownProductionKg100,
          treatmentKg100: calculation.treatmentKg100,
          balanceKg100: calculation.newClosingBalanceKg100,
          processedPreviousKg100: calculation.processedPreviousBalanceKg100,
          pendingPreviousKg100: calculation.pendingPreviousBalanceKg100,
          dayDifferenceKg100: calculation.day.detailDifferenceKg100,
          nightDifferenceKg100: calculation.night.detailDifferenceKg100,
          differenceKg100: calculation.differenceKg100,
          productDifferences: calculation.products.filter(
            (product) => product.differenceKg100 !== 0,
          ),
          integrityIssues: calculation.integrityIssues,
          status: calculation.status,
        }
      }),
    ).toEqual(
      expectedDays.map((day) => ({
        ...day,
        dayDifferenceKg100: kg100(0),
        nightDifferenceKg100: kg100(0),
        differenceKg100: kg100(0),
        productDifferences: [],
        integrityIssues: [],
        status: 'BALANCED',
      })),
    )
  })

  it('matches the Excel weekly summary by totals and product families', () => {
    const summary = calculateWeeklySummary(
      WEEK_36_2026_PRODUCTION_DAYS,
      WEEK_36_2026_PERIOD,
    )
    const groupTotals = Object.fromEntries(
      summary.groupTotals.map((group) => [
        group.summaryGroupId,
        group.totalKg100,
      ]),
    )

    expect(summary.integrityIssues).toEqual([])
    expect(summary.status).toBe('VALID')
    expect(summary.rawMaterialKg100).toBe(kg100(174_424_500))
    expect(summary.declaredFinishedKg100).toBe(kg100(142_262_990))
    expect(summary.detailFinishedKg100).toBe(kg100(142_262_990))
    expect(summary.differenceKg100).toBe(kg100(0))
    expect(summary.performance.percent).toBeCloseTo(81.5613574927834)
    expect(WEEK_36_2026_REPRODUCTOR_ALLOCATION_KG100).toBe(kg100(4_987_167))
    expect(groupTotals).toMatchObject({
      ALETA: kg100(32_050_000),
      MANTO: kg100(46_897_000),
      ANILLAS: kg100(11_905_170),
      BOTON: kg100(319_220),
      RECORTE_CRUDO: kg100(9_120_000),
      RECORTE_COCIDO: kg100(2_075_000),
      REJOS: kg100(21_120_600),
      REPRODUCTOR: kg100(4_974_000),
      NUCA_BIKINI: kg100(13_802_000),
    })
    expect(summary.productTotalsById).toEqual({
      'aleta-cruda-codificada': kg100(32_050_000),
      'manto-japones-crudo': kg100(25_139_000),
      'manto-estandar-crudo-2-4': kg100(21_758_000),
      'anillas-espana-segunda-mixta': kg100(138_000),
      'anillas-espana-p-sm-sp-st-mixta': kg100(29_000),
      'anillas-espana-p-cm-sp-st-mixta': kg100(221_000),
      'anillas-espana-polar-mixta': kg100(11_385_000),
      'anillas-block-tratamiento-usa-sm-cp-st': kg100(55_000),
      'anillas-block-tratamiento-usa-cm-sp-st': kg100(62_000),
      'anillas-iqf-tratamiento-usa-sm-cp-st': kg100(15_170),
      'boton-espana-sm-sp-tratamiento': kg100(97_000),
      'boton-usa-sm-cp-tratamiento': kg100(9_220),
      'boton-usa-cm-sp-tratamiento': kg100(213_000),
      'recorte-crudo-manto-japones': kg100(1_488_000),
      'recorte-crudo-aleta': kg100(126_000),
      'recorte-crudo-anillas-sm-sp-st': kg100(6_924_000),
      'recortes-crudos-labios': kg100(582_000),
      'recorte-cocido-pb': kg100(868_000),
      'membranas-cocidas': kg100(1_207_000),
      'rejo-baa-500-1000': kg100(58_000),
      'rejo-baa-1-2': kg100(9_847_000),
      'rejo-baa-2-3': kg100(171_000),
      'rejo-bailarina-0-500': kg100(12_000),
      'rejo-bailarina-500-1000': kg100(7_027_000),
      'rejos-seccionados-1-2-corona-tratamiento': kg100(2_462_800),
      'rejos-seccionados-1-2-media-tratamiento': kg100(1_385_700),
      'rejos-seccionados-1-2-terminal-tratamiento': kg100(152_600),
      'rejos-reproductor-tratamiento': kg100(4_500),
      'reproductor-50-70': kg100(1_089_000),
      'reproductor-70-up': kg100(3_885_000),
      'nuca-semilimpia-codificada': kg100(4_566_000),
      'nuca-bikini-100-300': kg100(37_000),
      'nuca-bikini-300-500': kg100(1_352_000),
      'nuca-bikini-500-700': kg100(4_176_000),
      'nuca-bikini-700-up': kg100(3_671_000),
    })
  })

  it('keeps every unconsumed balance open across later journeys', () => {
    const positions = calculateOutstandingBalances(
      WEEK_36_2026_PRODUCTION_DAYS,
      WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
    )
    const pendingPositions = positions.filter(
      (position) => position.pendingKg100 > 0,
    )
    const pendingByOrigin = Object.fromEntries(
      WEEK_36_2026_PRODUCTION_DAYS.map((day) => [
        day.id,
        sumKg100(
          pendingPositions
            .filter((position) => position.originDayId === day.id)
            .map((position) => position.pendingKg100),
        ),
      ]),
    )

    expect(
      sumKg100(pendingPositions.map((position) => position.pendingKg100)),
    ).toBe(kg100(0))
    expect(pendingByOrigin).toEqual({
      'production-day-2026-09-02': kg100(0),
      'production-day-2026-09-03': kg100(0),
      'production-day-2026-09-04': kg100(0),
      'production-day-2026-09-05': kg100(0),
    })
    expect(
      positions.find(
        (position) =>
          position.originDayId === 'production-day-2026-09-03' &&
          position.productId === 'recorte-crudo-aleta',
      ),
    ).toMatchObject({
      generatedKg100: kg100(44_000),
      processedDayKg100: kg100(44_000),
      processedNightKg100: kg100(0),
      pendingKg100: kg100(0),
    })
    expect(
      sumKg100(
        WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS.map(
          (lot) => lot.originalKg100,
        ),
      ),
    ).toBe(kg100(4_466_000))
  })
})
