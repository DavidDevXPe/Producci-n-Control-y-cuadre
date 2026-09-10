import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ProductionDataProvider,
  useProductionData,
} from './ProductionDataContext'

function ActiveWeekProbe() {
  const { activeWeekNumber } = useProductionData()
  return <span>Semana {activeWeekNumber}</span>
}

describe('ProductionDataProvider operational week recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces an obsolete invalid week with the current operational week', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '0')

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Semana 42')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('trabunda-active-operational-week-v1'),
    ).toBe('42')
  })
})
