import type { HTMLAttributes, ReactNode } from 'react'

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
  ...props
}: DataTableScrollProps) {
  return (
    <>
      <div
        {...props}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={`data-scroll scrollbar-subtle overflow-x-auto focus-visible:outline-offset-[-2px] ${className}`}
      >
        {children}
      </div>
      <p className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[0.6875rem] text-slate-500 xl:hidden">
        {hint}
      </p>
    </>
  )
}

export default DataTableScroll
