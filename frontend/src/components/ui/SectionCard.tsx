import type { HTMLAttributes, ReactNode } from 'react'

interface SectionCardProps extends HTMLAttributes<HTMLElement> {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
  contentClassName = '',
  ...props
}: SectionCardProps) {
  return (
    <section
      {...props}
      className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            {title ? <h2 className="font-extrabold text-slate-900">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}
