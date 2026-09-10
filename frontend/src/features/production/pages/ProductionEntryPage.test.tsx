import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ProductionEntryPage } from './ProductionEntryPage'

describe('ProductionEntryPage product selector', () => {
  it('filters the product list by any family or product word', () => {
    render(
      <MemoryRouter initialEntries={['/jornadas/nueva']}>
        <Routes>
          <Route path="/jornadas/nueva" element={<ProductionEntryPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Buscar producto' }),
      { target: { value: 'aleta' } },
    )

    const productSelect = screen.getByRole('combobox', {
      name: 'Producto con movimiento',
    })
    const options = within(productSelect).getAllByRole('option').slice(1)

    expect(options.length).toBeGreaterThan(0)
    expect(
      options.every((option) => option.textContent?.toLowerCase().includes('aleta')),
    ).toBe(true)
    expect(within(productSelect).queryByText(/manto japonés/i)).not.toBeInTheDocument()
  })
})
