import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductionDataProvider } from '../../production/state/ProductionDataContext'
import { OperationalPerformancePage } from './OperationalPerformancePage'

describe('OperationalPerformancePage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')
  })

  afterEach(() => vi.useRealTimers())

  it('keeps physical kilos read-only and reuses the shift capture for Packing', () => {
    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/rendimiento?view=PACKING']}>
          <OperationalPerformancePage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Rendimiento operativo' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Fuente de kilos: Reporte Día/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Fuente de kilos: Reporte Noche/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('N° Envasadores').length).toBeGreaterThan(0)
    expect(screen.queryByLabelText('Producto procesado')).not.toBeInTheDocument()
    expect(screen.getAllByText('NO CONFIGURADO').length).toBeGreaterThan(0)
  })

  it('shows the explicit no-data state and switches to Freezing independently', () => {
    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/rendimiento']}>
          <OperationalPerformancePage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(screen.getByText('SIN INFORMACIÓN DE RENDIMIENTO')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Congelamiento' }))
    expect(
      screen.getByRole('heading', { name: 'Sin jornadas de Congelamiento' }),
    ).toBeInTheDocument()
  })
})
