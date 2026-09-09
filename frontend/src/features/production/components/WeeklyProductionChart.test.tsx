import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ProductionTooltip,
  type WeeklyProductionChartDatum,
} from './WeeklyProductionChart'

describe('weekly production chart tooltip', () => {
  it('shows every Thursday series and totals only processed production', () => {
    const thursday: WeeklyProductionChartDatum = {
      id: 'production-day-2026-09-03',
      label: 'Jueves',
      dateLabel: '03 SEP 2026',
      dayKg100: 12_200_170,
      nightKg100: 16_361_000,
      treatmentKg100: 659_580,
    }
    const tooltipProps = {
      active: true,
      label: thursday.label,
      payload: [{ payload: thursday }],
    } as unknown as Parameters<typeof ProductionTooltip>[0]

    render(<ProductionTooltip {...tooltipProps} />)

    expect(screen.getByText('03 SEP 2026')).toBeInTheDocument()
    expect(screen.getByText('122,001.70 kg')).toBeInTheDocument()
    expect(screen.getByText('163,610.00 kg')).toBeInTheDocument()
    expect(screen.getByText('6,595.80 kg')).toBeInTheDocument()
    expect(screen.getByText('292,207.50 kg')).toBeInTheDocument()
    expect(screen.queryByText('315,977.50 kg')).not.toBeInTheDocument()
  })
})
