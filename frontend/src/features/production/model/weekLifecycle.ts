import { calculateProductionDay } from './calculations'
import type { ProductionDay, WeeklySummaryPeriod } from './types'

export interface WeekClosureBlocker {
  readonly dayId: string
  readonly date: string
  readonly displayName: string
  readonly message: string
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function getMissingWeekDays(
  period: WeeklySummaryPeriod,
  productionDays: readonly ProductionDay[],
): readonly string[] {
  const registeredDates = new Set(productionDays.map((day) => day.date))
  return Array.from({ length: 7 }, (_, index) => addDays(period.startDate, index))
    .filter((date) => !registeredDates.has(date))
}

export function getWeekClosureBlockers(
  productionDays: readonly ProductionDay[],
): readonly WeekClosureBlocker[] {
  return productionDays.flatMap((day) => {
    if (day.status !== 'CLOSED') {
      return [{
        dayId: day.id,
        date: day.date,
        displayName: day.displayName,
        message: `${day.displayName} todavía está en estado ${day.status}.`,
      }]
    }

    const calculation = calculateProductionDay(day)
    if (calculation.status === 'BALANCED' && calculation.integrityIssues.length === 0) {
      return []
    }

    return [{
      dayId: day.id,
      date: day.date,
      displayName: day.displayName,
      message: `${day.displayName} requiere revisión: el cuadre o la integridad no son válidos.`,
    }]
  })
}

export function isWeekAutomaticallyClosed(
  period: WeeklySummaryPeriod,
  productionDays: readonly ProductionDay[],
): boolean {
  const registeredDates = new Set(
    productionDays
      .filter((day) => day.date >= period.startDate && day.date <= period.endDate)
      .map((day) => day.date),
  )

  return registeredDates.size === 7 && getWeekClosureBlockers(productionDays).length === 0
}
