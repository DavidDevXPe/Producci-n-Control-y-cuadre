import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DataTableScroll } from './DataTableScroll'

function emulateHorizontalOverflow(region: HTMLElement) {
  Object.defineProperties(region, {
    clientWidth: { configurable: true, value: 320 },
    scrollWidth: { configurable: true, value: 1408 },
    scrollLeft: { configurable: true, value: 0, writable: true },
  })
  fireEvent(window, new Event('resize'))
}

describe('DataTableScroll', () => {
  it('can hide edge indicators without disabling the horizontal scroll region', () => {
    render(
      <DataTableScroll label="Tabla responsive" showEdgeIndicators={false}>
        <table />
      </DataTableScroll>,
    )

    const region = screen.getByRole('region', { name: 'Tabla responsive' })
    emulateHorizontalOverflow(region)

    expect(region).toHaveClass('overflow-x-auto')
    expect(region.parentElement?.querySelectorAll(':scope > span')).toHaveLength(0)
    expect(
      screen.getByText(
        'Desplaza horizontalmente para consultar todas las columnas.',
      ),
    ).toBeInTheDocument()
  })
})
