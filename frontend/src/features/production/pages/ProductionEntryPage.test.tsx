import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductionDataProvider } from '../state/ProductionDataContext'
import { ProductionEntryPage } from './ProductionEntryPage'

describe('ProductionEntryPage product selector', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('filters the product list by any family or product word', () => {
    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas/nueva']}>
          <Routes>
            <Route path="/jornadas/nueva" element={<ProductionEntryPage />} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
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

  it('blocks direct creation attempts when the selected week is closed', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '41')

    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas/nueva']}>
          <Routes>
            <Route path="/jornadas/nueva" element={<ProductionEntryPage />} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Esta semana es de solo lectura' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('searchbox', { name: 'Buscar producto' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Nueva jornada' }),
    ).not.toBeInTheDocument()
  })
})
