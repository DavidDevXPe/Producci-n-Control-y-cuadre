import { describe, expect, it } from 'vitest'

import {
  formatLimaOperationalDate,
  formatOperationalPeriod,
  formatOperationalWeek,
  getOperationalWeekContext,
  getOperationalWeekContextByNumber,
  getOperationalWeekState,
  getLimaShiftLabel,
} from './operationalContext'

describe('operational context', () => {
  it('uses the confirmed Lima shift boundaries', () => {
    expect(getLimaShiftLabel(new Date('2026-09-05T11:59:00Z'))).toBe('Turno Noche')
    expect(getLimaShiftLabel(new Date('2026-09-05T12:00:00Z'))).toBe('Turno Día')
    expect(getLimaShiftLabel(new Date('2026-09-05T23:59:00Z'))).toBe('Turno Día')
    expect(getLimaShiftLabel(new Date('2026-09-06T00:00:00Z'))).toBe('Turno Noche')
  })

  it('formats the operational date in Lima', () => {
    expect(formatLimaOperationalDate(new Date('2026-09-06T02:00:00Z'))).toBe(
      '05 SEP 2026',
    )
  })

  it('derives the week and period labels from the configured date range', () => {
    const period = { startDate: '2026-08-31', endDate: '2026-09-06' }

    expect(formatOperationalWeek(41)).toBe('Semana 41')
    expect(formatOperationalPeriod(period)).toBe('31 AGO — 06 SEP')
  })

  it('uses Trabunda operational numbering for the new week', () => {
    const week41 = getOperationalWeekContext(
      new Date('2026-09-06T15:00:00Z'),
    )
    const week42 = getOperationalWeekContext(
      new Date('2026-09-09T15:00:00Z'),
    )

    expect(week41).toEqual({
      number: 41,
      period: { startDate: '2026-08-31', endDate: '2026-09-06' },
    })
    expect(week42).toEqual({
      number: 42,
      period: { startDate: '2026-09-07', endDate: '2026-09-13' },
    })
  })

  it('separates temporal position from the operational week status', () => {
    const currentWeek = getOperationalWeekContextByNumber(42)

    expect(
      getOperationalWeekState(
        getOperationalWeekContextByNumber(42),
        currentWeek,
      ),
    ).toEqual({
      temporalStatus: 'CURRENT',
      businessStatus: 'OPEN',
      isCurrent: true,
      isPast: false,
      isClosed: false,
      isFuture: false,
      isReadOnly: false,
      canCreate: true,
    })
    expect(
      getOperationalWeekState(
        getOperationalWeekContextByNumber(41),
        currentWeek,
      ),
    ).toMatchObject({
      isCurrent: false,
      isPast: true,
      temporalStatus: 'PAST',
      businessStatus: 'OPEN',
      isClosed: false,
      isReadOnly: false,
      canCreate: true,
    })
    expect(
      getOperationalWeekState(
        getOperationalWeekContextByNumber(41),
        currentWeek,
        'CLOSED',
      ),
    ).toMatchObject({
      isPast: true,
      businessStatus: 'CLOSED',
      isClosed: true,
      isReadOnly: true,
      canCreate: false,
    })
    expect(
      getOperationalWeekState(
        getOperationalWeekContextByNumber(43),
        currentWeek,
      ),
    ).toMatchObject({
      isCurrent: false,
      temporalStatus: 'FUTURE',
      isFuture: true,
      isReadOnly: true,
      canCreate: false,
    })
  })
})
