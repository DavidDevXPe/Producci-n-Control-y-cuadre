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

  it('adapts the fixed action bar to the theme, viewport, and capture state', () => {
    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas/nueva']}>
          <Routes>
            <Route path="/jornadas/nueva" element={<ProductionEntryPage />} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const incompleteTitle = screen.getByText(
      'Completa los datos requeridos para validar la jornada.',
    )
    const actionBar = incompleteTitle.closest('[role="status"]')?.parentElement
      ?.parentElement
    const page = screen.getByRole('heading', { name: 'Nueva jornada' }).closest(
      '.space-y-5',
    )

    expect(
      screen.getByText('Puedes guardar un borrador válido y continuar después.'),
    ).toBeInTheDocument()
    expect(actionBar).toHaveClass(
      'dark:border-[#2b5268]',
      'dark:bg-[#0a1a27]',
    )
    expect(page).toHaveClass(
      'pb-[calc(var(--entry-action-bar-height)+1rem)]',
      '[--entry-action-bar-height:8.75rem]',
      'sm:[--entry-action-bar-height:4.25rem]',
      'xl:[--entry-action-bar-height:var(--sidebar-footer-height)]',
    )
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeDisabled()

    const generalData = screen
      .getByRole('heading', { name: 'Datos generales' })
      .closest('section')
    const generalInputs = within(generalData!).getAllByRole('spinbutton')

    fireEvent.change(generalInputs[0]!, { target: { value: '100' } })
    fireEvent.change(generalInputs[1]!, { target: { value: '100' } })
    fireEvent.change(generalInputs[2]!, { target: { value: '0' } })
    fireEvent.change(generalInputs[3]!, { target: { value: '90' } })

    const productSelect = screen.getByRole('combobox', {
      name: 'Producto con movimiento',
    })
    const firstProduct = within(productSelect).getAllByRole(
      'option',
    )[1] as HTMLOptionElement

    fireEvent.change(productSelect, { target: { value: firstProduct.value } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))

    const captureInputs = within(
      screen.getByRole('region', { name: 'Captura por producto y turno' }),
    ).getAllByRole('spinbutton')

    fireEvent.change(captureInputs[0]!, { target: { value: '100' } })
    fireEvent.change(captureInputs[2]!, { target: { value: '0' } })
    fireEvent.change(captureInputs[6]!, { target: { value: '90' } })

    expect(
      screen.getByText('La jornada todavía requiere revisión.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Revisa el cuadre y las validaciones pendientes antes de cerrar.',
      ),
    ).toBeInTheDocument()

    fireEvent.change(generalInputs[3]!, { target: { value: '100' } })
    fireEvent.change(captureInputs[6]!, { target: { value: '100' } })

    expect(screen.getByText('La jornada está lista para cerrar.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'El cuadre es correcto y no existen diferencias pendientes.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeEnabled()
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
