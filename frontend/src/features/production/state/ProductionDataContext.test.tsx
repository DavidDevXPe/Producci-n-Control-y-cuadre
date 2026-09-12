import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { MONDAY_WEEK_42_PRODUCTION_DAY } from '../data/mondayWeek42'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'

import {
  ProductionDataProvider,
  useProductionData,
} from './ProductionDataContext'

function ActiveWeekProbe() {
  const {
    activeWeek,
    activeWeekNumber,
    availableWeekNumbers,
    allProductionDays,
    findProductionDay,
    isUserManagedDay,
  } =
    useProductionData()
  const monday = findProductionDay('2026-09-07')
  return (
    <>
      <span>Semana {activeWeekNumber}</span>
      <span>{activeWeek.isHistorical ? 'Solo lectura' : 'Editable'}</span>
      <span data-testid="available-weeks">{availableWeekNumbers.join(',')}</span>
      <span data-testid="active-days">
        {activeWeek.productionDays.map((day) => day.date).join(',')}
      </span>
      <span data-testid="all-day-count">{allProductionDays.length}</span>
      <span data-testid="monday-origin">
        {isUserManagedDay('2026-09-07') ? 'local' : 'permanente'}
      </span>
      <span data-testid="monday-status">{monday?.status}</span>
    </>
  )
}

const editableDay = {
  ...WEDNESDAY_PRODUCTION_DAY,
  id: 'production-day-2026-09-08',
  date: '2026-09-08',
  displayName: 'Martes 08/09/2026',
  status: 'DRAFT' as const,
}

function PersistenceProbe() {
  const { upsertProductionDay } = useProductionData()
  const [message, setMessage] = useState('')

  const save = (allowReplace = false) => {
    try {
      upsertProductionDay(editableDay, { allowReplace })
      setMessage('guardado')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'error')
    }
  }

  return (
    <>
      <button type="button" onClick={() => save(false)}>Crear</button>
      <button type="button" onClick={() => save(true)}>Reemplazar</button>
      <span role="status">{message}</span>
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

  it('loads the closed Monday permanently without depending on local storage', () => {
    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('active-days')).toHaveTextContent('2026-09-07')
    expect(screen.getByTestId('all-day-count')).toHaveTextContent('5')
    expect(screen.getByTestId('monday-origin')).toHaveTextContent('permanente')
    expect(screen.getByTestId('monday-status')).toHaveTextContent('CLOSED')
  })

  it('ignores an obsolete local copy of the permanently saved Monday', () => {
    window.localStorage.setItem(
      'trabunda-production-days-v1',
      JSON.stringify([
        {
          ...MONDAY_WEEK_42_PRODUCTION_DAY,
          status: 'DRAFT',
          declaredFinishedTotalKg100: 1,
        },
      ]),
    )

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('active-days')).toHaveTextContent('2026-09-07')
    expect(screen.getByTestId('all-day-count')).toHaveTextContent('5')
    expect(screen.getByTestId('monday-origin')).toHaveTextContent('permanente')
    expect(screen.getByTestId('monday-status')).toHaveTextContent('CLOSED')
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

  it('does not silently overwrite another journey with the same date', () => {
    render(
      <ProductionDataProvider>
        <PersistenceProbe />
      </ProductionDataProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
    expect(screen.getByRole('status')).toHaveTextContent('guardado')
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Ya existe una jornada para esta fecha.',
    )
    const stored = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v1') ?? '[]',
    )
    expect(stored).toHaveLength(1)
  })

  it('rejects replacement of a closed journey', () => {
    window.localStorage.setItem(
      'trabunda-production-days-v1',
      JSON.stringify([{ ...editableDay, status: 'CLOSED' }]),
    )
    render(
      <ProductionDataProvider>
        <PersistenceProbe />
      </ProductionDataProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reemplazar' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Una jornada cerrada es de solo lectura',
    )
  })
})
