import { describe, expect, it } from 'vitest'

import {
  formatLimaOperationalDate,
  formatOperationalPeriod,
  formatOperationalWeek,
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

    expect(formatOperationalWeek(period)).toBe('Semana 36')
    expect(formatOperationalPeriod(period)).toBe('31 AGO — 06 SEP')
  })
})
