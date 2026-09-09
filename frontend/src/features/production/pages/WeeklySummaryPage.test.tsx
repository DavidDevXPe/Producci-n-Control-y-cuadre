import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WeeklySummaryPage } from './WeeklySummaryPage'

describe('weekly summary page', () => {
  it('validates Wednesday through Saturday against the independent product detail', () => {
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
      within(validation!).getAllByText('1,422,629.90 kg'),
    ).toHaveLength(2)
    expect(within(validation!).getByText('0.00 kg')).toBeInTheDocument()
    expect(
      within(validation!).getByText(/35 líneas de producto en 4 jornadas/),
    ).toBeInTheDocument()
  })

  it('shows the 7% Nuca Bikini reference for all closed days', () => {
    render(<WeeklySummaryPage />)

    const nucaHeading = screen.getByRole('heading', {
      name: 'Referencia Nuca Bikini',
    })
    const nucaSection = nucaHeading.closest('section')

    expect(nucaSection).not.toBeNull()
    expect(within(nucaSection!).getByText('LAVADO ACTIVO')).toBeInTheDocument()
    expect(within(nucaSection!).getByText('Referencia 7%')).toBeInTheDocument()
    expect(within(nucaSection!).getByText('122,097.15 kg')).toBeInTheDocument()
    expect(within(nucaSection!).getByText('138,020.00 kg')).toBeInTheDocument()
    expect(
      within(nucaSection!).getByText('Participación real: 7.91% de la MP.'),
    ).toBeInTheDocument()
  })
})
