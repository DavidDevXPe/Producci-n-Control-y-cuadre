import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ProductionTooltip,
  type WeeklyProductionChartDatum,
} from './WeeklyProductionChart'

describe('weekly production chart', () => {
  it('shows every Thursday series and totals finished production including balance', () => {
    const thursday: WeeklyProductionChartDatum = {
      id: 'production-day-2026-09-03',
      label: 'Jueves',
      dateLabel: '03 SEP 2026',
      dayKg100: 12_200_170,
      nightKg100: 16_361_000,
      treatmentKg100: 659_580,
      balanceKg100: 2_377_000,
    }
    const tooltipProps = {
      active: true,
      label: thursday.label,
      payload: [{ payload: thursday }],
    } as unknown as Parameters<typeof ProductionTooltip>[0]

    render(<ProductionTooltip {...tooltipProps} />)

    expect(screen.getByText(/03 SEP 2026/)).toBeInTheDocument()
    expect(screen.getByText('122,001.70 kg')).toBeInTheDocument()
    expect(screen.getByText('163,610.00 kg')).toBeInTheDocument()
    expect(screen.getByText('6,595.80 kg')).toBeInTheDocument()
    expect(screen.getByText('23,770.00 kg')).toBeInTheDocument()
    expect(screen.getByText('315,977.50 kg')).toBeInTheDocument()
    expect(screen.getByText('Producto terminado')).toBeInTheDocument()
    expect(screen.getByText('Día')).toBeInTheDocument()
    expect(screen.getByText('Noche')).toBeInTheDocument()
    const treatmentLabel = screen.getByText('Tratamiento')
    expect(screen.getByText('Saldo')).toBeInTheDocument()
    expect(treatmentLabel.parentElement?.querySelector('span')).toHaveStyle({
      backgroundColor: 'var(--color-production-treatment)',
    })
  })

  it('composes the validated Saturday total from all four series', () => {
    const saturday: WeeklyProductionChartDatum = {
      id: 'production-day-2026-09-05',
      label: 'Sábado',
      dateLabel: '05 SEP 2026',
      dayKg100: 18_562_000,
      nightKg100: 21_980_000,
      treatmentKg100: 690_300,
      balanceKg100: 4_466_000,
    }

    const tooltipProps = {
      active: true,
      label: saturday.label,
      payload: [{ payload: saturday }],
    } as unknown as Parameters<typeof ProductionTooltip>[0]

    render(<ProductionTooltip {...tooltipProps} />)

    expect(screen.getByText('185,620.00 kg')).toBeInTheDocument()
    expect(screen.getByText('219,800.00 kg')).toBeInTheDocument()
    expect(screen.getByText('6,903.00 kg')).toBeInTheDocument()
    expect(screen.getByText('44,660.00 kg')).toBeInTheDocument()
    expect(screen.getByText('456,983.00 kg')).toBeInTheDocument()
  })
})
