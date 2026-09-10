import { describe, expect, it } from 'vitest'

import { getYieldStatus } from './yieldStatus'

describe('getYieldStatus', () => {
  it.each([
    [69.99, 'critical', 'CRÍTICO', 'red'],
    [70, 'low', 'BAJO', 'orange'],
    [74.99, 'low', 'BAJO', 'orange'],
    [75, 'acceptable', 'ACEPTABLE', 'yellow'],
    [79.99, 'acceptable', 'ACEPTABLE', 'yellow'],
    [80, 'good', 'BUENO / OBJETIVO', 'green'],
    [85, 'good', 'BUENO / OBJETIVO', 'green'],
    [85.01, 'very_good', 'MUY BUENO', 'green'],
    [90, 'very_good', 'MUY BUENO', 'green'],
    [90.01, 'review', 'REVISAR', 'blue'],
    [93.55, 'review', 'REVISAR', 'blue'],
  ] as const)(
    'classifies %s%% as %s',
    (percent, status, label, colorVariant) => {
      expect(getYieldStatus(percent)).toMatchObject({
        status,
        label,
        colorVariant,
      })
    },
  )

  it('returns no aplica when the percentage is unavailable', () => {
    expect(getYieldStatus(null)).toMatchObject({
      status: 'not_applicable',
      label: 'NO APLICA',
      colorVariant: 'neutral',
    })
  })

  it('explains why a performance above 90% requires review', () => {
    expect(getYieldStatus(93.55).interpretation).toBe(
      'No necesariamente es malo, pero puede indicar arrastre de saldos o MP asignada de otro día',
    )
  })
})
