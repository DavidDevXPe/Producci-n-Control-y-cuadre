import type { HTMLAttributes, ReactNode } from 'react'

export type MetricCardTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

export interface MetricCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  label: string
  value: ReactNode
  unit?: string
  description?: ReactNode
  icon?: ReactNode
  tone?: MetricCardTone
}

const cardToneClasses: Record<MetricCardTone, string> = {
  neutral: 'border-l-slate-300',
  brand: 'border-l-sky-500',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-rose-500',
}

const iconToneClasses: Record<MetricCardTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
}

export function MetricCard({
  label,
  value,
  unit,
  description,
  icon,
  tone = 'neutral',
  className = '',
  ...props
}: MetricCardProps) {
  return (
    <article
      {...props}
      className={[
        'min-w-0 rounded-2xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm',
        cardToneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-5 text-slate-600">{label}</h2>
          <p className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[1.75rem]">
            <span className="break-words [font-variant-numeric:tabular-nums]">{value}</span>
            {unit ? (
              <span className="text-sm font-bold tracking-normal text-slate-500">{unit}</span>
            ) : null}
          </p>
        </div>

        {icon ? (
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconToneClasses[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>

      {description ? (
        <div className="mt-3 text-sm leading-5 text-slate-500">{description}</div>
      ) : null}
    </article>
  )
}

export default MetricCard
