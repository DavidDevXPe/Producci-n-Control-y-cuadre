import type { ProductionDay, WeeklySummaryPeriod } from '../model/types'
import { THURSDAY_PRODUCTION_DAY } from './thursday'
import { WEDNESDAY_PRODUCTION_DAY } from './wednesday'

export const WEEK_36_2026_PERIOD: WeeklySummaryPeriod = {
  startDate: '2026-08-31',
  endDate: '2026-09-06',
}

export const WEEK_36_2026_PRODUCTION_DAYS: readonly ProductionDay[] = [
  WEDNESDAY_PRODUCTION_DAY,
  THURSDAY_PRODUCTION_DAY,
]

export const WEEK_36_2026_CALENDAR_DAYS = [
  { label: 'Lunes', date: '31/08/2026', isoDate: '2026-08-31' },
  { label: 'Martes', date: '01/09/2026', isoDate: '2026-09-01' },
  { label: 'Miércoles', date: '02/09/2026', isoDate: '2026-09-02' },
  { label: 'Jueves', date: '03/09/2026', isoDate: '2026-09-03' },
  { label: 'Viernes', date: '04/09/2026', isoDate: '2026-09-04' },
  { label: 'Sábado', date: '05/09/2026', isoDate: '2026-09-05' },
  { label: 'Domingo', date: '06/09/2026', isoDate: '2026-09-06' },
] as const
