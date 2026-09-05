import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ProductionDayPage } from './ProductionDayPage'

function renderWednesdayPage() {
  return render(
    <MemoryRouter initialEntries={['/jornadas/2026-09-02']}>
      <Routes>
        <Route path="/jornadas/:date" element={<ProductionDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderThursdayPage() {
  return render(
    <MemoryRouter initialEntries={['/jornadas/2026-09-03']}>
      <Routes>
        <Route path="/jornadas/:date" element={<ProductionDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Wednesday production day page', () => {
  it('shows a zero difference and a balanced reconciliation', () => {
    renderWednesdayPage()

    expect(
      screen.getByRole('heading', { level: 1, name: /miércoles/i }),
    ).toBeInTheDocument()

    const reconciliationHeading = screen.getByRole('heading', {
      name: 'Cuadre de producción',
    })
    const reconciliation = reconciliationHeading.closest('section')

    expect(reconciliation).not.toBeNull()
    expect(within(reconciliation!).getByText('CUADRADO')).toBeInTheDocument()
    expect(
      within(reconciliation!).getAllByText('0.00 kg').length,
    ).toBeGreaterThan(0)
    expect(
      within(reconciliation!).getByText(
        'El saldo declarado coincide con el saldo calculado producto por producto.',
      ),
    ).toBeInTheDocument()

    const differenceCard = screen
      .getByRole('heading', { name: 'Diferencia' })
      .closest('article')

    expect(differenceCard).not.toBeNull()
    expect(within(differenceCard!).getByText('0.00 kg')).toBeInTheDocument()
    expect(screen.getByText('Sin saldo anterior recibido')).toBeInTheDocument()
  })

  it('presents 75.38% as a warning that does not invalidate the cuadre', () => {
    renderWednesdayPage()

    const performanceHeading = screen.getByRole('heading', {
      name: 'Rendimiento productivo',
    })
    const performance = performanceHeading.closest('section')

    expect(performance).not.toBeNull()
    expect(within(performance!).getByText('75.38%')).toBeInTheDocument()
    expect(
      within(performance!).getByText('BAJO REFERENCIA'),
    ).toBeInTheDocument()
    expect(
      within(performance!).getByText(/Esto no implica un descuadre/),
    ).toBeInTheDocument()
    expect(screen.queryByText('NO CUADRADO')).not.toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO').length).toBeGreaterThan(0)
  })
})

describe('Thursday production day page', () => {
  it('shows the closed Thursday production and fully processed prior balance', () => {
    renderThursdayPage()

    expect(
      screen.getByRole('heading', { level: 1, name: /jueves/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO').length).toBeGreaterThan(0)

    const receivedBalanceHeading = screen.getByRole('heading', {
      name: 'Saldo recibido de jornadas anteriores',
    })
    const receivedBalance = receivedBalanceHeading.closest('section')

    expect(receivedBalance).not.toBeNull()
    expect(
      within(receivedBalance!).getAllByText('40,298.30 kg').length,
    ).toBeGreaterThanOrEqual(2)
    expect(within(receivedBalance!).getByText('Procesado Día')).toBeInTheDocument()
    expect(
      within(receivedBalance!).getAllByText('0.00 kg').length,
    ).toBeGreaterThan(0)
  })
})
