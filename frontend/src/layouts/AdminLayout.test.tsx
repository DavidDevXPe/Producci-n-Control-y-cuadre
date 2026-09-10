import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AdminLayout } from './AdminLayout'

describe('AdminLayout theme preference', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.add('dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('switches between dark and light and persists the choice', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<div>Contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getAllByText('David Castillo')).toHaveLength(2)
    expect(screen.getAllByText('Administrativo')).toHaveLength(2)
    expect(
      screen.getAllByRole('img', { name: 'Avatar de David Castillo' }),
    ).toHaveLength(2)
    expect(screen.queryByText('Usuario local')).not.toBeInTheDocument()
    expect(screen.queryByText('PRODUCCIÓN')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Cambiar a tema claro' })[0]!)

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark')
      expect(window.localStorage.getItem('trabunda-color-theme')).toBe('light')
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Cambiar a tema oscuro' })[0]!)

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark')
      expect(window.localStorage.getItem('trabunda-color-theme')).toBe('dark')
    })
  })
})
