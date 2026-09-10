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

  it('separates the 15% semilimpia and 7% Bikini references', () => {
    render(<WeeklySummaryPage />)

    const nucaHeading = screen.getByRole('heading', {
      name: 'Referencias de Nuca',
    })
    const nucaSection = nucaHeading.closest('section')

    expect(nucaSection).not.toBeNull()
    const semilimpia = within(nucaSection!).getByRole('heading', {
      name: 'Nuca semilimpia',
    }).closest('article')
    const bikini = within(nucaSection!).getByRole('heading', {
      name: 'Nuca Bikini',
    }).closest('article')

    expect(semilimpia).not.toBeNull()
    expect(within(semilimpia!).getByText('Referencia 15%')).toBeInTheDocument()
    expect(within(semilimpia!).getByText('261,636.75 kg')).toBeInTheDocument()
    expect(within(semilimpia!).getByText('45,660.00 kg')).toBeInTheDocument()

    expect(bikini).not.toBeNull()
    expect(within(bikini!).getByText('LAVADO ACTIVO')).toBeInTheDocument()
    expect(within(bikini!).getByText('Referencia 7%')).toBeInTheDocument()
    expect(within(bikini!).getByText('122,097.15 kg')).toBeInTheDocument()
    expect(within(bikini!).getByText('92,360.00 kg')).toBeInTheDocument()
    expect(
      within(nucaSection!).getByText(/no cambia el estado CUADRADO/),
    ).toBeInTheDocument()
  })
})
