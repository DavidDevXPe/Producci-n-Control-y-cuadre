import { useCallback, useState } from 'react'
import {
  getBrowserPerformanceRepository,
} from '../data/performanceRepository'
import type { PerformanceRecordInput } from '../model/types'

export function usePerformanceRecords() {
  const [records, setRecords] = useState<readonly PerformanceRecordInput[]>(
    () => getBrowserPerformanceRepository()?.getRecords() ?? [],
  )

  const saveRecord = useCallback((record: PerformanceRecordInput) => {
    const repository = getBrowserPerformanceRepository()
    if (!repository) return
    setRecords(repository.save(record))
  }, [])

  return { records, saveRecord }
}
