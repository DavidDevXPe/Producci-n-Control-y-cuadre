const kgFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const weekdayFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  timeZone: 'UTC',
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

export function formatCentiKg(value: number): string {
  return `${kgFormatter.format(value / 100)} kg`
}

export function formatCentiKgValue(value: number): string {
  return kgFormatter.format(value / 100)
}

export function formatCentiKgCompact(value: number): string {
  return `${integerFormatter.format(Math.round(value / 100))} kg`
}

export function formatRatioAsPercent(value: number | null): string {
  return value === null ? 'No disponible' : `${percentFormatter.format(value * 100)}%`
}

export function formatIsoDate(value: string): string {
  const formatted = dateFormatter.format(new Date(`${value}T00:00:00Z`))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatIsoWeekday(value: string): string {
  return weekdayFormatter
    .format(new Date(`${value}T00:00:00Z`))
    .toLocaleUpperCase('es-PE')
}

export function formatIsoDateCompact(value: string): string {
  const [year, month, day] = value.split('-')
  const monthLabel = monthAbbreviations[Number(month) - 1]

  return `${day} ${monthLabel} ${year}`
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value)
}

