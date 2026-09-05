import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'
import { PerformancePanel } from './PerformancePanel'

describe('PerformancePanel Nuca Bikini applicability', () => {
  it('does not present a 7% target when there was no washing order', () => {
    const calculation = calculateProductionDay({
      ...WEDNESDAY_PRODUCTION_DAY,
      nucaWashAuthorization: null,
    })

    render(<PerformancePanel calculation={calculation} />)

    const performanceHeading = screen.getByRole('heading', {
      name: 'Rendimiento productivo',
    })
    const performance = performanceHeading.closest('section')

    expect(performance).not.toBeNull()
    expect(within(performance!).getByText('NO APLICA')).toBeInTheDocument()
    expect(
      within(performance!).queryByText('Referencia 7%'),
    ).not.toBeInTheDocument()
    expect(
      within(performance!).queryByText('Producción real'),
    ).not.toBeInTheDocument()
  })
})
