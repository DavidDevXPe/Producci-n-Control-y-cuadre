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
  brand: 'bg-brand-50 text-brand-700',
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
        'min-w-0 rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-panel',
        cardToneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-bold leading-5 text-slate-600">{label}</h2>
          <p className="mt-1.5 flex min-w-0 flex-nowrap items-baseline gap-x-1.5 whitespace-nowrap text-2xl font-extrabold leading-none tracking-tight text-slate-950 sm:text-[1.625rem]">
            <span className="number-tabular whitespace-nowrap">{value}</span>
            {unit ? (
              <span className="whitespace-nowrap text-xs font-bold tracking-normal text-slate-500">
                {unit}
              </span>
            ) : null}
          </p>
        </div>

        {icon ? (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconToneClasses[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>

      {description ? (
        <div className="mt-2 text-xs leading-5 text-slate-500">{description}</div>
      ) : null}
    </article>
  )
}

export default MetricCard
