import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatIsoDate } from '../../../utils/formatters'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { DashboardPage } from './DashboardPage'

vi.mock('../components/WeeklyProductionChart', () => ({
  default: () => <div data-testid="weekly-production-chart" />,
}))

describe('dashboard page', () => {
  it('uses Saturday as the latest close and lists all four registered days', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      )
    })

    const indicators = screen.getByRole('region', {
      name: 'Indicadores principales',
    })

    expect(within(indicators).getByText('456,983.00')).toBeInTheDocument()
    expect(within(indicators).getByText('44,660.00')).toBeInTheDocument()
    expect(within(indicators).getByText('93.55%')).toBeInTheDocument()
    expect(
      within(indicators).getByText('Pendiente para la siguiente jornada'),
    ).toBeInTheDocument()
    expect(within(indicators).getByText('REVISAR')).toBeInTheDocument()
    expect(screen.getByText('185,620.00 kg')).toBeInTheDocument()
    expect(screen.getByText('219,800.00 kg')).toBeInTheDocument()
    expect(screen.getByText('6,903.00 kg')).toBeInTheDocument()
    expect(screen.getByText('Producto terminado = Día + Noche + Tratamiento + Saldo')).toBeInTheDocument()
    expect(
      screen.getAllByText(formatIsoDate('2026-09-05')).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('Se muestran solamente los 4 cierres reales registrados.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver$/i })).toHaveLength(4)
    expect(await screen.findByTestId('weekly-production-chart')).toBeInTheDocument()
    expect(screen.getByText('Semana 41 · Cerrada · Solo lectura')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nueva jornada' })).not.toBeInTheDocument()
  })

  it('shows the permanently saved Monday in the editable current week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByText(
        'Último registro disponible y consistencia de la semana 42.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('492,763.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('60,450.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('80.09%').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Nueva jornada' })).not.toBeInTheDocument()
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
