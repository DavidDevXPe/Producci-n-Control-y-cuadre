import { describe, expect, it } from 'vitest'
import { kg } from '../../production/model/calculations'
import type { ProductionDay, ProductionProcess, ShiftCode } from '../../production/model/types'
import {
  aggregatePerformanceRecords,
  calculateBenchmarkCompliance,
  calculateEffectiveHours,
  calculatePerformanceRecord,
  calculatePersonHours,
  calculateProductivityGap,
  calculateScheduledHours,
  getBestPerformanceShift,
} from './performanceCalculations'
import type { PerformanceRecordInput } from './types'

function productionDay(
  process: ProductionProcess = 'PACKING',
  dayKg = 180_000,
  nightKg = 90_000,
  date = '2026-09-13',
): ProductionDay {
  return {
    id: `production-day-${process.toLowerCase()}-${date}`,
    date,
    displayName: date,
    status: 'CLOSED',
    process,
    rawMaterialEntries: [],
    declaredRawMaterialKg100: kg(0),
    declaredShiftTotalsKg100: { DAY: kg(dayKg), NIGHT: kg(nightKg) },
    declaredFinishedTotalKg100: kg(0),
    lines: [],
    receivedBalanceLots: [],
    nucaWashAuthorization: null,
    performanceReferenceBasisPoints: 8_000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  }
}

function input(
  day: ProductionDay,
  shift: ShiftCode,
  overrides: Partial<PerformanceRecordInput> = {},
): PerformanceRecordInput {
  return {
    id: `performance-${day.id}-${shift}`,
    productionDayId: day.id,
    date: day.date,
    weekNumber: 42,
    process: day.process ?? 'PACKING',
    shift,
    supervisor: 'David Castillo',
    workerCount: 60,
    startTime: shift === 'DAY' ? '07:00' : '19:00',
    endTime: shift === 'DAY' ? '19:00' : '07:00',
    deadHours: 0,
    createdAt: '2026-09-13T12:00:00.000Z',
    updatedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  }
}

describe('operational performance calculations', () => {
  it('calculates twelve scheduled hours for day and cross-midnight night shifts', () => {
    expect(calculateScheduledHours('07:00', '19:00')).toBe(12)
    expect(calculateScheduledHours('19:00', '07:00')).toBe(12)
    expect(calculateScheduledHours('07:00', '07:00')).toBeNull()
  })

  it('calculates the practical 180,000 kg example without floating-point display errors', () => {
    const day = productionDay()
    const record = calculatePerformanceRecord(
      input(day, 'DAY', { deadHours: 2 }),
      day,
    )

    expect(record.scheduledHours).toBe(12)
    expect(record.effectiveHours).toBe(10)
    expect(record.personHours).toBe(600)
    expect(record.kgPerHour).toBe(18_000)
    expect(record.kgPerWorkerHour).toBe(300)
    expect(record.processedKg100).toBe(kg(180_000))
  })

  it('rejects invalid dead time and never produces NaN or Infinity', () => {
    expect(calculateEffectiveHours(12, -0.5)).toBeNull()
    expect(calculateEffectiveHours(12, 12.5)).toBeNull()
    expect(calculatePersonHours(0, 10)).toBeNull()

    const day = productionDay()
    const record = calculatePerformanceRecord(
      input(day, 'DAY', { workerCount: 0, deadHours: 12 }),
      day,
    )
    expect(record.kgPerHour).toBeNull()
    expect(record.kgPerWorkerHour).toBeNull()
    expect(record.isComplete).toBe(false)
  })

  it('keeps productivity available when no benchmark is configured', () => {
    const day = productionDay()
    const record = calculatePerformanceRecord(input(day, 'DAY'), day, [])

    expect(record.kgPerHour).toBe(15_000)
    expect(record.kgPerWorkerHour).toBe(250)
    expect(record.benchmark).toBeNull()
    expect(record.benchmarkCompliance).toBeNull()
    expect(record.benchmarkStatus).toBe('NOT_CONFIGURED')
  })

  it('calculates compliance, potential and positive or above-benchmark gaps', () => {
    const day = productionDay()
    const below = calculatePerformanceRecord(input(day, 'DAY'), day, [
      { process: 'PACKING', shift: 'DAY', kgPerWorkerHour: 300 },
    ])
    const above = calculatePerformanceRecord(input(day, 'DAY'), day, [
      { process: 'PACKING', shift: 'DAY', kgPerWorkerHour: 200 },
    ])

    expect(calculateBenchmarkCompliance(250, 300)).toBeCloseTo(83.333333, 5)
    expect(below.potentialKg100).toBe(kg(216_000))
    expect(below.productivityGapKg100).toBe(kg(36_000))
    expect(below.benchmarkStatus).toBe('BELOW_TARGET')
    expect(above.productivityGapKg100).toBe(kg(-36_000))
    expect(above.benchmarkStatus).toBe('AT_OR_ABOVE_TARGET')
    expect(calculateProductivityGap(null, kg(1))).toBeNull()
  })

  it('reads physical Day and Night reports for Packing and Freezing', () => {
    const packing = productionDay('PACKING', 180_000, 125_000)
    const freezing = productionDay('FREEZING', 45_000, 30_000)

    expect(calculatePerformanceRecord(input(packing, 'DAY'), packing).processedKg100).toBe(kg(180_000))
    expect(calculatePerformanceRecord(input(packing, 'NIGHT'), packing).processedKg100).toBe(kg(125_000))
    expect(calculatePerformanceRecord(input(freezing, 'DAY'), freezing).processedKg100).toBe(kg(45_000))
    expect(calculatePerformanceRecord(input(freezing, 'NIGHT'), freezing).processedKg100).toBe(kg(30_000))
  })

  it('uses Sunday physical throughput without changing balance ownership', () => {
    const sunday = {
      ...productionDay('PACKING', 45_000, 0),
      operationMode: 'BALANCE_ONLY' as const,
      receivedBalanceLots: [
        {
          id: 'saturday-balance',
          originDayId: 'production-day-2026-09-12',
          familyId: 'rejos-crudo',
          productId: 'rejo-baa-1-2',
          originalKg100: kg(45_000),
          uses: [],
        },
      ],
    }
    const record = calculatePerformanceRecord(
      input(sunday, 'DAY', {
        workerCount: 30,
        startTime: '07:00',
        endTime: '13:00',
      }),
      sunday,
    )

    expect(record.processedKg100).toBe(kg(45_000))
    expect(record.kgPerHour).toBe(7_500)
    expect(record.personHours).toBe(180)
    expect(record.kgPerWorkerHour).toBe(250)
    expect(sunday.receivedBalanceLots[0]?.originDayId).toBe(
      'production-day-2026-09-12',
    )
  })

  it('uses weighted weekly ratios and chooses the best shift by kg/person-hour', () => {
    const first = productionDay('PACKING', 100, 80, '2026-09-07')
    const second = productionDay('PACKING', 300, 120, '2026-09-08')
    const records = [
      calculatePerformanceRecord(
        input(first, 'DAY', { workerCount: 10, startTime: '07:00', endTime: '17:00' }),
        first,
      ),
      calculatePerformanceRecord(
        input(second, 'DAY', { workerCount: 10, startTime: '07:00', endTime: '12:00' }),
        second,
      ),
      calculatePerformanceRecord(
        input(first, 'NIGHT', { workerCount: 10, startTime: '19:00', endTime: '23:00' }),
        first,
      ),
    ]
    const aggregate = aggregatePerformanceRecords(records)

    expect(aggregate.processedKg100).toBe(kg(480))
    expect(aggregate.effectiveHours).toBe(19)
    expect(aggregate.personHours).toBe(190)
    expect(aggregate.kgPerHour).toBeCloseTo(480 / 19, 8)
    expect(aggregate.kgPerWorkerHour).toBeCloseTo(480 / 190, 8)
    expect(getBestPerformanceShift(records)).toBe('DAY')
  })

  it('recalculates processed kilos when the production report is edited', () => {
    const original = productionDay('PACKING', 180_000, 0)
    const edited = productionDay('PACKING', 190_000, 0)
    const recordInput = input(original, 'DAY')

    expect(calculatePerformanceRecord(recordInput, original).processedKg100).toBe(kg(180_000))
    expect(calculatePerformanceRecord(recordInput, edited).processedKg100).toBe(kg(190_000))
  })
})
