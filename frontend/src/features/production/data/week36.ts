import { kg100 } from '../model/calculations'
import type { ProductionDay, WeeklySummaryPeriod } from '../model/types'
import { FRIDAY_PRODUCTION_DAY } from './friday'
import { SATURDAY_PRODUCTION_DAY } from './saturday'
import { SUNDAY_PROCESSED_SATURDAY_BALANCE_LOTS } from './sundayBalance'
import { THURSDAY_PRODUCTION_DAY } from './thursday'
import { WEDNESDAY_PRODUCTION_DAY } from './wednesday'

export const WEEK_36_2026_PERIOD: WeeklySummaryPeriod = {
  startDate: '2026-08-31',
  endDate: '2026-09-06',
}

/** Operational numbering used by Trabunda; it is intentionally not ISO week 36. */
export const WEEK_41_2026_OPERATIONAL_NUMBER = 41

/** Explicit allocation documented by RESUMEN!C88. */
export const WEEK_36_2026_REPRODUCTOR_ALLOCATION_KG100 = kg100(4_987_167)

export const WEEK_36_2026_PRODUCTION_DAYS: readonly ProductionDay[] = [
  WEDNESDAY_PRODUCTION_DAY,
  THURSDAY_PRODUCTION_DAY,
  FRIDAY_PRODUCTION_DAY,
  SATURDAY_PRODUCTION_DAY,
]

export const WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS =
  SUNDAY_PROCESSED_SATURDAY_BALANCE_LOTS

export const WEEK_36_2026_CALENDAR_DAYS = [
  { label: 'Lunes', date: '31/08/2026', isoDate: '2026-08-31' },
  { label: 'Martes', date: '01/09/2026', isoDate: '2026-09-01' },
  { label: 'Miércoles', date: '02/09/2026', isoDate: '2026-09-02' },
  { label: 'Jueves', date: '03/09/2026', isoDate: '2026-09-03' },
  { label: 'Viernes', date: '04/09/2026', isoDate: '2026-09-04' },
  { label: 'Sábado', date: '05/09/2026', isoDate: '2026-09-05' },
  { label: 'Domingo', date: '06/09/2026', isoDate: '2026-09-06' },
] as const
