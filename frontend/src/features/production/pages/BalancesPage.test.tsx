import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { BalancesPage } from './BalancesPage'

describe('balances page', () => {
  it('consolidates current and inherited pending balances by origin day', () => {
    render(<BalancesPage />)

    const summary = screen.getByRole('region', { name: 'Resumen de saldos' })
    const totalCard = within(summary)
      .getByRole('heading', { name: 'Saldo total pendiente' })
      .closest('article')

    expect(totalCard).not.toBeNull()
    expect(within(totalCard!).getByText('0.00 kg')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sin saldos pendientes' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/El saldo del sábado fue envasado completamente/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Saldo pendiente por producto' }),
    ).not.toBeInTheDocument()
  })

  it('centers balance quantities on one explicit column grid', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()

    render(
      <ProductionDataProvider>
        <BalancesPage />
      </ProductionDataProvider>,
    )

    const table = screen.getByRole('table', {
      name: 'Detalle del saldo pendiente por producto',
    })
    const headers = within(table).getAllByRole('columnheader')

    expect(table).toHaveClass('table-fixed', 'min-w-[48rem]')
    expect(
      [...table.querySelectorAll('col')].map((column) => column.className),
    ).toEqual(['w-[48%]', 'w-[13%]', 'w-[13%]', 'w-[13%]', 'w-[13%]'])
    headers.slice(1).forEach((header) => {
      expect(header).toHaveClass('px-3', 'text-center', 'align-middle')
    })

    const firstProductRow = table.querySelector<HTMLElement>(
      'tbody tr:nth-child(2)',
    )
    expect(firstProductRow).not.toBeNull()
    within(firstProductRow!).getAllByRole('cell').forEach((cell) => {
      expect(cell).toHaveClass('px-3', 'text-center', 'align-middle')
    })
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
