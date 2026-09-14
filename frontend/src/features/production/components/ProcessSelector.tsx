import { PackageCheck, Snowflake } from 'lucide-react'
import type { ProductionProcess } from '../model/types'

export type ProductionView = ProductionProcess | 'COMPARISON'

interface ProcessSelectorProps {
  value: ProductionView
  onChange: (value: ProductionView) => void
  includeComparison?: boolean
  disabled?: boolean
}

const options = [
  { value: 'PACKING' as const, label: 'Envasado', Icon: PackageCheck },
  { value: 'FREEZING' as const, label: 'Congelamiento', Icon: Snowflake },
]

export function ProcessSelector({
  value,
  onChange,
  includeComparison = false,
  disabled = false,
}: ProcessSelectorProps) {
  const visibleOptions = includeComparison
    ? [...options, { value: 'COMPARISON' as const, label: 'Comparativo', Icon: PackageCheck }]
    : options

  return (
    <div>
      <p className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Proceso
      </p>
      <div
        className="inline-flex max-w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        role="tablist"
        aria-label="Proceso operativo"
      >
        {visibleOptions.map(({ value: optionValue, label, Icon }) => {
          const selected = value === optionValue
          return (
            <button
              key={optionValue}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => onChange(optionValue)}
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? optionValue === 'FREEZING'
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'bg-brand-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
