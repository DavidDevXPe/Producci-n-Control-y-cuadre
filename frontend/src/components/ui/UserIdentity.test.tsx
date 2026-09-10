import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { localUser } from '../../config/localUser'
import { UserIdentity } from './UserIdentity'

describe('UserIdentity', () => {
  it('shows the configured local user and personalized avatar', () => {
    render(<UserIdentity user={localUser} />)

    expect(screen.getByText('David Castillo')).toBeInTheDocument()
    expect(screen.getByText('Administrativo')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Avatar de David Castillo' })).toHaveAttribute(
      'src',
      expect.stringContaining('david-castillo'),
    )
  })

  it('uses the DC fallback when the avatar cannot load', () => {
    render(<UserIdentity user={localUser} responsive />)

    fireEvent.error(
      screen.getByRole('img', { name: 'Avatar de David Castillo' }),
    )

    expect(screen.getByText('DC')).toBeInTheDocument()
    expect(screen.getByText('DC').closest('[role="img"]')).toHaveAttribute(
      'aria-label',
      'Avatar de David Castillo',
    )
  })
})
