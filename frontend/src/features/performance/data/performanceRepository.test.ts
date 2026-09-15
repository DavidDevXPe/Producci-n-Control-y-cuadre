import { beforeEach, describe, expect, it } from 'vitest'
import type { PerformanceRecordInput } from '../model/types'
import {
  createPerformanceRepository,
  PERFORMANCE_STORAGE_KEY,
} from './performanceRepository'

function record(
  id: string,
  overrides: Partial<PerformanceRecordInput> = {},
): PerformanceRecordInput {
  return {
    id,
    productionDayId: `day-${id}`,
    date: '2026-09-07',
    weekNumber: 42,
    process: 'PACKING',
    shift: 'DAY',
    supervisor: 'David Castillo',
    workerCount: 30,
    startTime: '07:00',
    endTime: '19:00',
    deadHours: 1,
    createdAt: '2026-09-07T20:00:00.000Z',
    updatedAt: '2026-09-07T20:00:00.000Z',
    ...overrides,
  }
}

describe('performance repository', () => {
  beforeEach(() => window.localStorage.clear())

  it('persists versioned records and filters by week, day and process', () => {
    const repository = createPerformanceRepository(window.localStorage)
    const packing = record('packing')
    const freezing = record('freezing', {
      process: 'FREEZING',
      shift: 'NIGHT',
      weekNumber: 43,
    })

    repository.save(packing)
    repository.save(freezing)

    expect(window.localStorage.getItem(PERFORMANCE_STORAGE_KEY)).not.toBeNull()
    expect(repository.getByWeek(42)).toEqual([packing])
    expect(repository.getByDay(packing.productionDayId)).toEqual([packing])
    expect(repository.getByProcess('FREEZING')).toEqual([freezing])
  })

  it('updates by stable id and safely ignores malformed persisted data', () => {
    const repository = createPerformanceRepository(window.localStorage)
    repository.save(record('packing'))
    repository.update(record('packing', { workerCount: 45 }))

    expect(repository.getRecords()).toHaveLength(1)
    expect(repository.getRecords()[0]?.workerCount).toBe(45)

    window.localStorage.setItem(PERFORMANCE_STORAGE_KEY, '{invalid')
    expect(repository.getRecords()).toEqual([])
  })
})
