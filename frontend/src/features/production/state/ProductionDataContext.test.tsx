import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ProductionDataProvider,
  useProductionData,
} from './ProductionDataContext'

function ActiveWeekProbe() {
  const { activeWeek, activeWeekNumber, availableWeekNumbers } =
    useProductionData()
  return (
    <>
      <span>Semana {activeWeekNumber}</span>
      <span>{activeWeek.isHistorical ? 'Solo lectura' : 'Editable'}</span>
      <span data-testid="available-weeks">{availableWeekNumbers.join(',')}</span>
    </>
  )
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
    expect(screen.getByText('Editable')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('trabunda-active-operational-week-v1'),
    ).toBe('42')
  })

  it('preserves a selected previous week as historical read-only', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '41')

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Semana 41')).toBeInTheDocument()
    expect(screen.getByText('Solo lectura')).toBeInTheDocument()
  })

  it('does not expose a future week stored by an obsolete browser state', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '43')

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Semana 42')).toBeInTheDocument()
    expect(screen.getByText('Editable')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('trabunda-active-operational-week-v1'),
    ).toBe('42')
  })

  it('adds the new current week automatically after an operational rollover', () => {
    vi.setSystemTime(new Date('2026-09-13T23:59:30-05:00'))

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('available-weeks')).toHaveTextContent('42,41')

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText('Semana 42')).toBeInTheDocument()
    expect(screen.getByText('Solo lectura')).toBeInTheDocument()
    expect(screen.getByTestId('available-weeks')).toHaveTextContent('43,42,41')
  })
})
