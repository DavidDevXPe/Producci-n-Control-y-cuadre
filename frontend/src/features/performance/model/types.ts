import type {
  Kg100,
  ProductionProcess,
  ShiftCode,
} from '../../production/model/types'

export type PerformanceBenchmarkStatus =
  | 'NOT_CONFIGURED'
  | 'BELOW_TARGET'
  | 'NEAR_TARGET'
  | 'AT_OR_ABOVE_TARGET'

export interface PerformanceRecordInput {
  readonly id: string
  readonly productionDayId: string
  readonly date: string
  readonly weekNumber: number
  readonly process: ProductionProcess
  readonly shift: ShiftCode
  readonly supervisor: string
  readonly workerCount: number
  readonly startTime: string
  readonly endTime: string
  readonly deadHours: number
  readonly createdAt: string
  readonly updatedAt: string
}

export interface PerformanceRecord extends PerformanceRecordInput {
  readonly scheduledHours: number | null
  readonly effectiveHours: number | null
  readonly processedKg100: Kg100
  readonly personHours: number | null
  readonly kgPerHour: number | null
  readonly kgPerWorkerHour: number | null
  readonly benchmark: number | null
  readonly benchmarkCompliance: number | null
  readonly potentialKg100: Kg100 | null
  readonly productivityGapKg100: Kg100 | null
  readonly benchmarkStatus: PerformanceBenchmarkStatus
  readonly isComplete: boolean
  readonly validationMessage: string | null
}

export interface PerformanceAggregate {
  readonly processedKg100: Kg100
  readonly effectiveHours: number
  readonly personHours: number
  readonly kgPerHour: number | null
  readonly kgPerWorkerHour: number | null
  readonly benchmark: number | null
  readonly benchmarkCompliance: number | null
  readonly potentialKg100: Kg100 | null
  readonly productivityGapKg100: Kg100 | null
  readonly benchmarkStatus: PerformanceBenchmarkStatus
  readonly recordCount: number
  readonly completeRecordCount: number
}

export interface PerformanceBenchmarkConfig {
  readonly process: ProductionProcess
  readonly shift?: ShiftCode
  /** Kilograms per worker-hour. */
  readonly kgPerWorkerHour: number
}
