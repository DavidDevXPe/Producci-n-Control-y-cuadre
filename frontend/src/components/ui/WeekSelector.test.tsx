import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WeekSelector, type WeekSelectorOption } from './WeekSelector'

const options: readonly WeekSelectorOption[] = [
  {
    number: 41,
    periodLabel: '31 AGO — 06 SEP',
  },
  {
    number: 42,
    periodLabel: '07 SEP — 13 SEP',
    statusLabel: 'Actual · Sin registros',
  },
]

describe('WeekSelector', () => {
  it('opens, identifies the selected week and selects another option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <WeekSelector
        options={options}
        selectedWeekNumber={41}
        onChange={onChange}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 41' }),
    )

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Semana 41/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('07 SEP — 13 SEP')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: /Semana 42/ }))

    expect(onChange).toHaveBeenCalledWith(42)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <WeekSelector
        options={options}
        selectedWeekNumber={41}
        onChange={() => undefined}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 41' }),
    )
    fireEvent.pointerDown(document.body)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('supports arrow navigation, Enter selection and Escape closing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <WeekSelector
        options={options}
        selectedWeekNumber={41}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('button', {
      name: 'Seleccionar semana operativa. Semana 41',
    })

    trigger.focus()
    await user.keyboard('{ArrowDown}')
    const selectedOption = screen.getByRole('option', { name: /Semana 41/ })
    await waitFor(() => expect(selectedOption).toHaveFocus())

    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith(42)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.click(trigger)
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Semana 41/ })).toHaveFocus(),
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps disabled weeks in the dark menu without allowing selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const disabledOptions: readonly WeekSelectorOption[] = [
      ...options,
      {
        number: 43,
        periodLabel: '14 SEP — 20 SEP',
        statusLabel: 'Próxima',
        disabled: true,
      },
    ]
    render(
      <WeekSelector
        options={disabledOptions}
        selectedWeekNumber={41}
        onChange={onChange}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 41' }),
    )
    const disabledOption = screen.getByRole('option', { name: /Semana 43/ })

    expect(disabledOption).toBeDisabled()
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true')
    await user.click(disabledOption)
    expect(onChange).not.toHaveBeenCalled()
  })
})
