const LIMA_TIME_ZONE = 'America/Lima'

const limaDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: LIMA_TIME_ZONE,
})

const limaHourFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  hourCycle: 'h23',
  timeZone: LIMA_TIME_ZONE,
})

const monthAbbreviations = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
] as const

interface IsoDateRange {
  startDate: string
  endDate: string
}

interface OperationalWeekAnchor {
  number: number
  startDate: string
}

export interface OperationalWeekContext {
  number: number
  period: IsoDateRange
}

export type OperationalWeekTemporalStatus = 'CURRENT' | 'PAST' | 'FUTURE'
export type OperationalWeekBusinessStatus = 'OPEN' | 'CLOSED'

export interface OperationalWeekState {
  temporalStatus: OperationalWeekTemporalStatus
  businessStatus: OperationalWeekBusinessStatus
  isCurrent: boolean
  isPast: boolean
  isClosed: boolean
  isFuture: boolean
  isReadOnly: boolean
  canCreate: boolean
}

export const TRABUNDA_OPERATIONAL_WEEK_ANCHOR = {
  number: 41,
  startDate: '2026-08-31',
} as const

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

function formatPeriodDate(value: string): string {
  const [, month, day] = value.split('-')
  return `${day} ${monthAbbreviations[Number(month) - 1]}`
}

function formatIsoDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return formatIsoDateUtc(date)
}

function getLimaIsoDate(date: Date): string {
  const parts = Object.fromEntries(
    limaDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatLimaOperationalDate(date: Date): string {
  const parts = Object.fromEntries(
    limaDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return `${parts.day} ${monthAbbreviations[Number(parts.month) - 1]} ${parts.year}`
}

export function getLimaShiftLabel(date: Date): 'Turno Día' | 'Turno Noche' {
  const localHour = Number(limaHourFormatter.format(date))
  return localHour >= 7 && localHour < 19 ? 'Turno Día' : 'Turno Noche'
}

export function getIsoWeekNumber(isoDate: string): number {
  const date = parseIsoDate(isoDate)
  const weekday = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))

  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export function formatOperationalWeek(operationalWeekNumber: number): string {
  return `Semana ${operationalWeekNumber}`
}

export function formatOperationalPeriod(period: IsoDateRange): string {
  return `${formatPeriodDate(period.startDate)} — ${formatPeriodDate(period.endDate)}`
}

/**
 * Trabunda uses an operational sequence rather than ISO week numbers.
 * Week 41 starts on 2026-08-31 and every following Monday increments it.
 */
export function getOperationalWeekContext(
  date: Date,
  anchor: OperationalWeekAnchor = TRABUNDA_OPERATIONAL_WEEK_ANCHOR,
): OperationalWeekContext {
  const localDate = parseIsoDate(getLimaIsoDate(date))
  const anchorDate = parseIsoDate(anchor.startDate)
  const elapsedDays = Math.floor(
    (localDate.getTime() - anchorDate.getTime()) / 86_400_000,
  )
  const weekOffset = Math.floor(elapsedDays / 7)
  const startDate = addUtcDays(anchor.startDate, weekOffset * 7)

  return {
    number: anchor.number + weekOffset,
    period: {
      startDate,
      endDate: addUtcDays(startDate, 6),
    },
  }
}

export function getOperationalWeekContextByNumber(
  operationalWeekNumber: number,
  anchor: OperationalWeekAnchor = TRABUNDA_OPERATIONAL_WEEK_ANCHOR,
): OperationalWeekContext {
  const weekOffset = operationalWeekNumber - anchor.number
  const startDate = addUtcDays(anchor.startDate, weekOffset * 7)

  return {
    number: operationalWeekNumber,
    period: {
      startDate,
      endDate: addUtcDays(startDate, 6),
    },
  }
}

export function getOperationalWeekContextForIsoDate(
  isoDate: string,
  anchor: OperationalWeekAnchor = TRABUNDA_OPERATIONAL_WEEK_ANCHOR,
): OperationalWeekContext {
  return getOperationalWeekContext(
    new Date(`${isoDate}T12:00:00Z`),
    anchor,
  )
}

export function getOperationalWeekState(
  week: OperationalWeekContext,
  currentWeek: OperationalWeekContext,
  businessStatus: OperationalWeekBusinessStatus = 'OPEN',
): OperationalWeekState {
  const isCurrent = week.number === currentWeek.number
  const isFuture = week.period.startDate > currentWeek.period.endDate
  const isPast = !isCurrent && !isFuture
  const temporalStatus: OperationalWeekTemporalStatus = isCurrent
    ? 'CURRENT'
    : isFuture
      ? 'FUTURE'
      : 'PAST'
  const isClosed = businessStatus === 'CLOSED'

  return {
    temporalStatus,
    businessStatus,
    isCurrent,
    isPast,
    isClosed,
    isFuture,
    isReadOnly: isClosed || isFuture,
    canCreate: !isClosed && !isFuture,
  }
}
