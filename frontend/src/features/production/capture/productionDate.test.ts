import { describe, expect, it } from 'vitest'
import { normalizeProductionDate } from './productionDate'

describe('normalizeProductionDate', () => {
  it('normalizes display and ISO formats to the same canonical value', () => {
    expect(normalizeProductionDate('14/09/2026')).toBe('2026-09-14')
    expect(normalizeProductionDate('2026-09-14')).toBe('2026-09-14')
    expect(normalizeProductionDate('2026/09/14')).toBe('2026-09-14')
  })
})
