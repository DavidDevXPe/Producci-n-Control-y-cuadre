import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { ProductionDaysPage } from './ProductionDaysPage'

describe('production days page', () => {
  it('lists the four real squared journeys without inventing Sunday', () => {
    render(
      <MemoryRouter>
        <ProductionDaysPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('4 de 7 días de la semana')).toBeInTheDocument()
    expect(screen.getByText('Bajo referencia (<80%)')).toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO')).toHaveLength(4)
    expect(screen.getAllByRole('link', { name: /Ver detalle/i })).toHaveLength(4)
    expect(screen.getByText('Último cierre disponible')).toBeInTheDocument()
    expect(screen.getByText('SÁBADO')).toBeInTheDocument()
    expect(screen.queryByText('DOMINGO')).not.toBeInTheDocument()
  })

  it('aligns the eight operational columns on one explicit desktop grid', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const table = screen.getByRole('table', {
      name: 'Jornadas de producción registradas',
    })
    const headers = within(table).getAllByRole('columnheader')

    expect(headers.map((header) => header.textContent)).toEqual([
      'Jornada',
      'Materia prima',
      'Producto terminado',
      'Saldo final',
      'Diferencia',
      'Cuadre',
      'Aprovechamiento',
      'Acción',
    ])
    expect(table).toHaveClass('table-fixed', 'min-w-[64rem]')
    expect(
      [...table.querySelectorAll('col')].map((column) => column.className),
    ).toEqual([
      'w-[15%]',
      'w-[12%]',
      'w-[14%]',
      'w-[10%]',
      'w-[9%]',
      'w-[11%]',
      'w-[18%]',
      'w-[11%]',
    ])
    headers.forEach((header) => {
      expect(header).toHaveClass('px-3', 'text-center', 'align-middle')
    })

    const latestRow = screen.getByText('LUNES').closest('tr')
    expect(latestRow).not.toBeNull()
    const journeyCell = within(latestRow!).getByRole('rowheader')
    const cells = within(latestRow!).getAllByRole('cell')

    expect(journeyCell).toHaveClass('px-3', 'text-center', 'align-middle')
    expect(journeyCell).not.toHaveClass('border-l-4')
    expect(journeyCell.firstElementChild).toHaveClass(
      'w-full',
      'items-center',
      'text-center',
    )
    cells.forEach((cell) => {
      expect(cell).toHaveClass('px-3', 'text-center', 'align-middle')
    })

    expect(screen.getByText('615,239.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
      'text-center',
    )
    expect(screen.getByText('492,763.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
    )
    expect(screen.getByText('60,450.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
    )
    expect(screen.getByText('0.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
    )

    expect(within(latestRow!).getByText('CUADRADO').closest('td')?.firstElementChild).toHaveClass(
      'w-full',
      'justify-center',
    )

    const utilization = within(latestRow!).getByLabelText(/^Aprovechamiento /)
    expect(utilization).toHaveClass(
      'w-full',
      'items-center',
      'justify-center',
      'xl:flex-row',
    )
    expect(
      within(latestRow!).getByRole('link', { name: /Ver detalle/i })
        .parentElement,
    ).toHaveClass('flex', 'w-full', 'justify-center')
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
