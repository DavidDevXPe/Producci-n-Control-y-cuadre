import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export interface WeekSelectorOption {
  number: number
  periodLabel: string
  statusLabel?: string | undefined
  disabled?: boolean | undefined
}

interface WeekSelectorProps {
  options: readonly WeekSelectorOption[]
  selectedWeekNumber: number
  onChange: (weekNumber: number) => void
  compact?: boolean
  className?: string
}

export function WeekSelector({
  options,
  selectedWeekNumber,
  onChange,
  compact = false,
  className = '',
}: WeekSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef(new Map<number, HTMLButtonElement>())
  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const selectWeek = (option: WeekSelectorOption) => {
    if (option.disabled) return
    onChange(option.number)
    closeMenu(true)
  }

  const focusRelativeOption = (
    currentWeekNumber: number,
    direction: 1 | -1,
  ) => {
    const enabledOptions = options.filter((option) => !option.disabled)
    const currentIndex = enabledOptions.findIndex(
      (option) => option.number === currentWeekNumber,
    )
    const nextIndex =
      (currentIndex + direction + enabledOptions.length) % enabledOptions.length
    const nextOption = enabledOptions[nextIndex]
    if (nextOption) optionRefs.current.get(nextOption.number)?.focus()
  }

  useEffect(() => {
    if (!isOpen) return

    const animationFrame = window.requestAnimationFrame(() => {
      const focusTarget =
        options.find(
          (option) =>
            option.number === selectedWeekNumber && !option.disabled,
        ) ?? options.find((option) => !option.disabled)
      if (focusTarget) optionRefs.current.get(focusTarget.number)?.focus()
    })

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu()
    }

    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      document.removeEventListener('pointerdown', handleOutsidePointer)
    }
  }, [isOpen, options, selectedWeekNumber])

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex h-8 items-center justify-between gap-2 rounded-lg border border-[#2b5268] bg-[#0d2534] px-2.5 text-xs font-bold text-[#f3f8fb] shadow-sm transition-colors duration-150 hover:bg-[#123247] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#169fd0] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d2534] ${compact ? 'min-w-[4.5rem] sm:min-w-[6.5rem]' : 'min-w-[6.5rem]'}`}
        aria-label={`Seleccionar semana operativa. Semana ${selectedWeekNumber}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setIsOpen(true)
          } else if (event.key === 'Escape') {
            closeMenu()
          }
        }}
      >
        {compact ? (
          <>
            <span className="sm:hidden">S. {selectedWeekNumber}</span>
            <span className="hidden sm:inline">Semana {selectedWeekNumber}</span>
          </>
        ) : (
          <span>Semana {selectedWeekNumber}</span>
        )}
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Semanas operativas disponibles"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-[0.625rem] border border-[#2b5268] bg-[#0a1a27] p-1.5 text-left shadow-[0_12px_30px_rgb(0_0_0/0.28)]"
        >
          {options.map((option) => {
            const isSelected = option.number === selectedWeekNumber

            return (
              <button
                key={option.number}
                ref={(element) => {
                  if (element) optionRefs.current.set(option.number, element)
                  else optionRefs.current.delete(option.number)
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                disabled={option.disabled}
                className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#169fd0] ${
                  isSelected
                    ? 'bg-[#153b50] text-[#f3f8fb]'
                    : 'text-[#f3f8fb] hover:bg-[#123247]'
                } disabled:cursor-not-allowed disabled:opacity-50`}
                onClick={() => selectWeek(option)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    focusRelativeOption(
                      option.number,
                      event.key === 'ArrowDown' ? 1 : -1,
                    )
                  } else if (event.key === 'Home' || event.key === 'End') {
                    event.preventDefault()
                    const enabledOptions = options.filter((item) => !item.disabled)
                    const target = event.key === 'Home' ? enabledOptions[0] : enabledOptions.at(-1)
                    if (target) optionRefs.current.get(target.number)?.focus()
                  } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectWeek(option)
                  } else if (event.key === 'Escape') {
                    event.preventDefault()
                    closeMenu(true)
                  } else if (event.key === 'Tab') {
                    closeMenu()
                  }
                }}
              >
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
                    isSelected
                      ? 'border-[#169fd0] bg-[#169fd0] text-[#07111d]'
                      : 'border-[#2b5268] text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold">Semana {option.number}</span>
                    {option.statusLabel ? (
                      <span className="whitespace-nowrap text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#7f9bad]">
                        {option.statusLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="number-tabular mt-1 block text-[0.625rem] font-semibold tracking-[0.04em] text-[#7f9bad]">
                    {option.periodLabel}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default WeekSelector
