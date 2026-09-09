import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
