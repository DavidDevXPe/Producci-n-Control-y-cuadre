import type { ProductionProcess, ShiftCode } from '../../production/model/types'
import type { PerformanceRecordInput } from '../model/types'

export const PERFORMANCE_STORAGE_KEY = 'trabunda-performance-records-v1'

function isShift(value: unknown): value is ShiftCode {
  return value === 'DAY' || value === 'NIGHT'
}

function isProcess(value: unknown): value is ProductionProcess {
  return value === 'PACKING' || value === 'FREEZING'
}

function isPerformanceRecordInput(value: unknown): value is PerformanceRecordInput {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PerformanceRecordInput>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.productionDayId === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date ?? '') &&
    Number.isSafeInteger(candidate.weekNumber) &&
    isProcess(candidate.process) &&
    isShift(candidate.shift) &&
    typeof candidate.supervisor === 'string' &&
    typeof candidate.workerCount === 'number' &&
    typeof candidate.startTime === 'string' &&
    typeof candidate.endTime === 'string' &&
    typeof candidate.deadHours === 'number' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

function read(storage: Storage): readonly PerformanceRecordInput[] {
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(PERFORMANCE_STORAGE_KEY) ?? '[]',
    )
    return Array.isArray(parsed) ? parsed.filter(isPerformanceRecordInput) : []
  } catch {
    return []
  }
}

function write(
  storage: Storage,
  records: readonly PerformanceRecordInput[],
): void {
  storage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(records))
}

export interface PerformanceRepository {
  getRecords(): readonly PerformanceRecordInput[]
  getByWeek(weekNumber: number): readonly PerformanceRecordInput[]
  getByDay(productionDayId: string): readonly PerformanceRecordInput[]
  getByProcess(process: ProductionProcess): readonly PerformanceRecordInput[]
  save(record: PerformanceRecordInput): readonly PerformanceRecordInput[]
  update(record: PerformanceRecordInput): readonly PerformanceRecordInput[]
}

export function createPerformanceRepository(
  storage: Storage,
): PerformanceRepository {
  const upsert = (record: PerformanceRecordInput) => {
    const records = read(storage)
    const next = [
      ...records.filter((candidate) => candidate.id !== record.id),
      record,
    ].sort(
      (first, second) =>
        first.date.localeCompare(second.date) ||
        first.process.localeCompare(second.process) ||
        first.shift.localeCompare(second.shift),
    )
    write(storage, next)
    return next
  }

  return {
    getRecords: () => read(storage),
    getByWeek: (weekNumber) =>
      read(storage).filter((record) => record.weekNumber === weekNumber),
    getByDay: (productionDayId) =>
      read(storage).filter(
        (record) => record.productionDayId === productionDayId,
      ),
    getByProcess: (process) =>
      read(storage).filter((record) => record.process === process),
    save: upsert,
    update: upsert,
  }
}

export function getBrowserPerformanceRepository(): PerformanceRepository | null {
  if (typeof window === 'undefined') return null
  return createPerformanceRepository(window.localStorage)
}
