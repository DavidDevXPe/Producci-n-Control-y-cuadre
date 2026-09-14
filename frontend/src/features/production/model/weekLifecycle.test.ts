import { describe, expect, it } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { kg100 } from './calculations'
import type { ProductionDay } from './types'
import {
  getMissingWeekDays,
  getWeekClosureBlockers,
  isWeekAutomaticallyClosed,
} from './weekLifecycle'

const period = { startDate: '2026-09-07', endDate: '2026-09-13' }

function closedDay(date: string): ProductionDay {
  return {
    ...WEDNESDAY_PRODUCTION_DAY,
    id: `production-day-${date}`,
    date,
    displayName: date,
    status: 'CLOSED',
  }
}

describe('operational week lifecycle', () => {
  it('closes automatically only when all seven registered days are closed and valid', () => {
    const sevenDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date('2026-09-07T00:00:00Z')
      date.setUTCDate(date.getUTCDate() + index)
      return closedDay(date.toISOString().slice(0, 10))
    })

    expect(isWeekAutomaticallyClosed(period, sevenDays)).toBe(true)
    expect(isWeekAutomaticallyClosed(period, sevenDays.slice(0, 3))).toBe(false)
  })

  it('allows missing days but reports a registered draft as a manual-close blocker', () => {
    const monday = closedDay('2026-09-07')
    const tuesday = {
      ...closedDay('2026-09-08'),
      status: 'DRAFT' as const,
    }

    expect(getMissingWeekDays(period, [monday, tuesday])).toHaveLength(5)
    expect(getWeekClosureBlockers([monday])).toEqual([])
    expect(getWeekClosureBlockers([monday, tuesday])).toEqual([
      expect.objectContaining({
        date: '2026-09-08',
        message: expect.stringContaining('DRAFT'),
      }),
    ])
  })

  it('blocks a registered closed day whose reconciliation is invalid', () => {
    const invalidClosedDay: ProductionDay = {
      ...closedDay('2026-09-08'),
      declaredFinishedTotalKg100: kg100(
        WEDNESDAY_PRODUCTION_DAY.declaredFinishedTotalKg100 + 1,
      ),
    }

    expect(getWeekClosureBlockers([invalidClosedDay])).toEqual([
      expect.objectContaining({
        date: '2026-09-08',
        message: expect.stringContaining('requiere revisión'),
      }),
    ])
  })
})
