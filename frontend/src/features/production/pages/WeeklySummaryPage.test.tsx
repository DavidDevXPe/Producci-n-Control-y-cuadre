import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WeeklySummaryPage } from './WeeklySummaryPage'

describe('weekly summary page', () => {
  it('validates Wednesday and Thursday against the independent product detail', () => {
    render(<WeeklySummaryPage />)

    const validationHeading = screen.getByRole('heading', {
      name: 'Validación de consistencia',
    })
    const validation = validationHeading.closest('section')

    expect(validation).not.toBeNull()
    expect(
      within(validation!).getByText('INFORMACIÓN VÁLIDA'),
    ).toBeInTheDocument()
    expect(within(validation!).getByText('PT por jornadas')).toBeInTheDocument()
    expect(within(validation!).getByText('PT por productos')).toBeInTheDocument()
    expect(
      within(validation!).getAllByText('559,795.50 kg'),
    ).toHaveLength(2)
    expect(within(validation!).getByText('0.00 kg')).toBeInTheDocument()
    expect(
      within(validation!).getByText(/28 líneas con movimiento/),
    ).toBeInTheDocument()
  })

  it('shows the 7% Nuca Bikini reference for both closed days', () => {
    render(<WeeklySummaryPage />)

    const nucaHeading = screen.getByRole('heading', {
      name: 'Referencia Nuca Bikini',
    })
    const nucaSection = nucaHeading.closest('section')

    expect(nucaSection).not.toBeNull()
    expect(within(nucaSection!).getByText('LAVADO ACTIVO')).toBeInTheDocument()
    expect(within(nucaSection!).getByText('Referencia 7%')).toBeInTheDocument()
    expect(within(nucaSection!).getByText('51,348.92 kg')).toBeInTheDocument()
    expect(within(nucaSection!).getByText('51,260.00 kg')).toBeInTheDocument()
    expect(
      within(nucaSection!).getByText('Participación real: 6.99% de la MP.'),
    ).toBeInTheDocument()
  })
})
