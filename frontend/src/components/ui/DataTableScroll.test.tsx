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

function placeLongTableInsideViewport(region: HTMLElement) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 800,
  })
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1200,
  })
  region.getBoundingClientRect = () =>
    ({
      top: 120,
      bottom: 1480,
      left: 40,
      right: 1040,
      width: 1000,
      height: 1360,
      x: 40,
      y: 120,
      toJSON: () => ({}),
    }) as DOMRect
  fireEvent.scroll(window)
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

  it('shows a contextual auxiliary scrollbar only for an overflowing long table', () => {
    render(
      <DataTableScroll label="Detalle largo" showAuxiliaryScrollbar>
        <table />
      </DataTableScroll>,
    )

    const region = screen.getByRole('region', { name: 'Detalle largo' })
    emulateHorizontalOverflow(region)
    placeLongTableInsideViewport(region)

    const auxiliary = screen.getByRole('region', {
      name: 'Control horizontal auxiliar: Detalle largo',
    })
    expect(auxiliary).toHaveAttribute('data-auxiliary-scrollbar', 'true')
    expect(auxiliary).toHaveClass('hidden', 'sm:block')
    expect(auxiliary).toHaveStyle({ left: '40px', width: '1000px' })
  })

  it('synchronizes native and auxiliary horizontal scrolling in both directions', () => {
    render(
      <DataTableScroll label="Detalle sincronizado" showAuxiliaryScrollbar>
        <table />
      </DataTableScroll>,
    )

    const region = screen.getByRole('region', {
      name: 'Detalle sincronizado',
    })
    emulateHorizontalOverflow(region)
    placeLongTableInsideViewport(region)
    const auxiliary = screen.getByRole('region', {
      name: 'Control horizontal auxiliar: Detalle sincronizado',
    })

    auxiliary.scrollLeft = 420
    fireEvent.scroll(auxiliary)
    expect(region.scrollLeft).toBe(420)

    region.scrollLeft = 780
    fireEvent.scroll(region)
    expect(auxiliary.scrollLeft).toBe(780)
  })

  it('hides the auxiliary scrollbar when the table end enters the viewport', () => {
    render(
      <DataTableScroll label="Detalle contextual" showAuxiliaryScrollbar>
        <table />
      </DataTableScroll>,
    )

    const region = screen.getByRole('region', { name: 'Detalle contextual' })
    emulateHorizontalOverflow(region)
    placeLongTableInsideViewport(region)
    expect(
      screen.getByRole('region', {
        name: 'Control horizontal auxiliar: Detalle contextual',
      }),
    ).toBeInTheDocument()

    region.getBoundingClientRect = () =>
      ({
        top: -500,
        bottom: 700,
        left: 40,
        right: 1040,
        width: 1000,
        height: 1200,
        x: 40,
        y: -500,
        toJSON: () => ({}),
      }) as DOMRect
    fireEvent.scroll(window)

    expect(
      screen.queryByRole('region', {
        name: 'Control horizontal auxiliar: Detalle contextual',
      }),
    ).not.toBeInTheDocument()
  })

  it('removes the auxiliary scrollbar after resize eliminates overflow', () => {
    render(
      <DataTableScroll label="Detalle adaptable" showAuxiliaryScrollbar>
        <table />
      </DataTableScroll>,
    )

    const region = screen.getByRole('region', { name: 'Detalle adaptable' })
    emulateHorizontalOverflow(region)
    placeLongTableInsideViewport(region)
    expect(
      screen.getByRole('region', {
        name: 'Control horizontal auxiliar: Detalle adaptable',
      }),
    ).toBeInTheDocument()

    Object.defineProperties(region, {
      clientWidth: { configurable: true, value: 1408 },
      scrollWidth: { configurable: true, value: 1408 },
    })
    fireEvent(window, new Event('resize'))

    expect(
      screen.queryByRole('region', {
        name: 'Control horizontal auxiliar: Detalle adaptable',
      }),
    ).not.toBeInTheDocument()
  })
})
