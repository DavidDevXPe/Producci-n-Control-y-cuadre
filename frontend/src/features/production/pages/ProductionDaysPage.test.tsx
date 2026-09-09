import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductionDaysPage } from './ProductionDaysPage'

describe('production days page', () => {
  it('lists the four real squared journeys without inventing Sunday', () => {
    render(
      <MemoryRouter>
        <ProductionDaysPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('4 de 7 días de la semana')).toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO')).toHaveLength(4)
    expect(screen.getAllByRole('link', { name: /Ver detalle/i })).toHaveLength(4)
    expect(screen.getByText('Último cierre disponible')).toBeInTheDocument()
    expect(screen.getByText('SÁBADO')).toBeInTheDocument()
    expect(screen.queryByText('DOMINGO')).not.toBeInTheDocument()
  })
})
