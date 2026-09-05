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

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

function formatPeriodDate(value: string): string {
  const [, month, day] = value.split('-')
  return `${day} ${monthAbbreviations[Number(month) - 1]}`
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

export function formatOperationalWeek(period: IsoDateRange): string {
  return `Semana ${getIsoWeekNumber(period.startDate)}`
}

export function formatOperationalPeriod(period: IsoDateRange): string {
  return `${formatPeriodDate(period.startDate)} — ${formatPeriodDate(period.endDate)}`
}
