import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type UIEvent,
} from 'react'

interface DataTableScrollProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  label: string
  hint?: string
}

export function DataTableScroll({
  children,
  label,
  hint = 'Desplaza horizontalmente para consultar todas las columnas.',
  className = '',
  onScroll,
  ...props
}: DataTableScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({
    isOverflowing: false,
    canScrollLeft: false,
    canScrollRight: false,
  })

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const maximumScroll = container.scrollWidth - container.clientWidth
    const nextState = {
      isOverflowing: maximumScroll > 1,
      canScrollLeft: container.scrollLeft > 1,
      canScrollRight: container.scrollLeft < maximumScroll - 1,
    }

    setScrollState((current) =>
      current.isOverflowing === nextState.isOverflowing &&
      current.canScrollLeft === nextState.canScrollLeft &&
      current.canScrollRight === nextState.canScrollRight
        ? current
        : nextState,
    )
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollState()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScrollState)
      return () => window.removeEventListener('resize', updateScrollState)
    }

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(container)
    if (container.firstElementChild) observer.observe(container.firstElementChild)

    return () => observer.disconnect()
  }, [children, updateScrollState])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    updateScrollState()
    onScroll?.(event)
  }

  return (
    <>
      <div className="relative min-w-0">
        <div
          {...props}
          ref={scrollContainerRef}
          role="region"
          aria-label={label}
          tabIndex={0}
          onScroll={handleScroll}
          className={`data-scroll scrollbar-subtle overflow-x-auto focus-visible:outline-offset-[-2px] ${className}`}
        >
          {children}
        </div>
        {scrollState.canScrollLeft ? (
          <span
            className="pointer-events-none absolute inset-y-0 left-0 z-40 w-3 bg-gradient-to-r from-slate-950/12 to-transparent dark:from-black/35"
            aria-hidden="true"
          />
        ) : null}
        {scrollState.canScrollRight ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-0 z-40 w-3 bg-gradient-to-l from-slate-950/12 to-transparent dark:from-black/35"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {scrollState.isOverflowing ? (
        <p className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[0.6875rem] text-slate-500">
          {hint}
        </p>
      ) : null}
    </>
  )
}

export default DataTableScroll
