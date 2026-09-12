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
  showEdgeIndicators?: boolean
  showAuxiliaryScrollbar?: boolean
  auxiliaryBottomOffset?: number
}

interface AuxiliaryScrollbarState {
  visible: boolean
  left: number
  width: number
  contentWidth: number
}

const INITIAL_AUXILIARY_STATE: AuxiliaryScrollbarState = {
  visible: false,
  left: 0,
  width: 0,
  contentWidth: 0,
}

export function DataTableScroll({
  children,
  label,
  hint = 'Desplaza horizontalmente para consultar todas las columnas.',
  showEdgeIndicators = true,
  showAuxiliaryScrollbar = false,
  auxiliaryBottomOffset = 8,
  className = '',
  onScroll,
  ...props
}: DataTableScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const auxiliaryScrollbarRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({
    isOverflowing: false,
    canScrollLeft: false,
    canScrollRight: false,
  })
  const [auxiliaryState, setAuxiliaryState] =
    useState<AuxiliaryScrollbarState>(INITIAL_AUXILIARY_STATE)

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

    if (!showAuxiliaryScrollbar) return

    const rect = container.getBoundingClientRect()
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth
    const visibleBottom = viewportHeight - auxiliaryBottomOffset
    const left = Math.max(rect.left, 0)
    const right = Math.min(rect.right, viewportWidth)
    const width = Math.max(right - left, 0)
    const auxiliaryVisible =
      nextState.isOverflowing &&
      width > 0 &&
      rect.top < visibleBottom - 24 &&
      rect.bottom > visibleBottom + 24
    const nextAuxiliaryState = {
      visible: auxiliaryVisible,
      left,
      width,
      contentWidth: container.scrollWidth,
    }

    setAuxiliaryState((current) =>
      current.visible === nextAuxiliaryState.visible &&
      current.left === nextAuxiliaryState.left &&
      current.width === nextAuxiliaryState.width &&
      current.contentWidth === nextAuxiliaryState.contentWidth
        ? current
        : nextAuxiliaryState,
    )
  }, [auxiliaryBottomOffset, showAuxiliaryScrollbar])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollState()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScrollState)
      if (showAuxiliaryScrollbar) {
        window.addEventListener('scroll', updateScrollState, { passive: true })
      }
      return () => {
        window.removeEventListener('resize', updateScrollState)
        window.removeEventListener('scroll', updateScrollState)
      }
    }

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(container)
    if (container.firstElementChild) observer.observe(container.firstElementChild)

    if (showAuxiliaryScrollbar) {
      window.addEventListener('scroll', updateScrollState, { passive: true })
      window.addEventListener('resize', updateScrollState)
    }

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [children, showAuxiliaryScrollbar, updateScrollState])

  useEffect(() => {
    const container = scrollContainerRef.current
    const auxiliary = auxiliaryScrollbarRef.current
    if (!container || !auxiliary || !auxiliaryState.visible) return
    auxiliary.scrollLeft = container.scrollLeft
  }, [auxiliaryState.contentWidth, auxiliaryState.visible])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const auxiliary = auxiliaryScrollbarRef.current
    if (
      auxiliary &&
      Math.abs(auxiliary.scrollLeft - event.currentTarget.scrollLeft) > 1
    ) {
      auxiliary.scrollLeft = event.currentTarget.scrollLeft
    }
    updateScrollState()
    onScroll?.(event)
  }

  const handleAuxiliaryScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current
    if (
      container &&
      Math.abs(container.scrollLeft - event.currentTarget.scrollLeft) > 1
    ) {
      container.scrollLeft = event.currentTarget.scrollLeft
    }
    updateScrollState()
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
        {showEdgeIndicators && scrollState.canScrollLeft ? (
          <span
            className="pointer-events-none absolute inset-y-0 left-0 z-40 w-3 bg-gradient-to-r from-slate-950/12 to-transparent dark:w-px dark:bg-slate-300/70 dark:bg-none dark:from-transparent"
            aria-hidden="true"
          />
        ) : null}
        {showEdgeIndicators && scrollState.canScrollRight ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-0 z-40 w-3 bg-gradient-to-l from-slate-950/12 to-transparent dark:w-px dark:bg-slate-300/70 dark:bg-none dark:from-transparent"
            aria-hidden="true"
          />
        ) : null}
        {showAuxiliaryScrollbar && auxiliaryState.visible ? (
          <div
            ref={auxiliaryScrollbarRef}
            role="region"
            aria-label={`Control horizontal auxiliar: ${label}`}
            tabIndex={0}
            onScroll={handleAuxiliaryScroll}
            data-auxiliary-scrollbar="true"
            className="scrollbar-subtle fixed z-[55] hidden h-4 overflow-x-auto overflow-y-hidden border-y border-slate-200 bg-slate-50/95 sm:block"
            style={{
              bottom: `calc(${auxiliaryBottomOffset}px + env(safe-area-inset-bottom))`,
              left: auxiliaryState.left,
              width: auxiliaryState.width,
            }}
          >
            <div
              className="h-px"
              style={{ width: auxiliaryState.contentWidth }}
              aria-hidden="true"
            />
          </div>
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
