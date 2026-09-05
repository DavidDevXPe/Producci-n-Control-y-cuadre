import { Droplets, Gauge, Info } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatRatioAsPercent } from '../../../utils/formatters'
import type {
  NucaWashAuthorization,
  ProductionDayCalculation,
} from '../model/types'

interface PerformancePanelProps {
  calculation: ProductionDayCalculation
  washAuthorization?: NucaWashAuthorization | null
}

export function PerformancePanel({
  calculation,
  washAuthorization,
}: PerformancePanelProps) {
  const performance = calculation.performance
  const isOnReference = performance.status === 'AT_OR_ABOVE_REFERENCE'
  const isPerformanceApplicable = performance.status !== 'NOT_APPLICABLE'
  const percentage = performance.ratio === null ? 0 : performance.ratio * 100
  const clampedPercentage = Math.max(0, Math.min(percentage, 100))
  const nuca = calculation.nucaBikini

  return (
    <SectionCard
      title="Rendimiento productivo"
      description="Indicador operativo; no determina el estado del cuadre."
      action={
        <StatusBadge
          tone={isPerformanceApplicable ? (isOnReference ? 'success' : 'warning') : 'neutral'}
        >
          {isPerformanceApplicable
            ? isOnReference
              ? 'EN REFERENCIA'
              : 'BAJO REFERENCIA'
            : 'NO APLICA'}
        </StatusBadge>
      }
      className="h-full"
      contentClassName="p-4 sm:p-5"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">Resultado de la jornada</p>
          <p className="number-tabular mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {formatRatioAsPercent(performance.ratio)}
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <Gauge className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5">
        <div className="relative h-2.5 overflow-visible rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${isOnReference ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${clampedPercentage}%` }}
          />
          <span
            className="absolute -top-1 h-4.5 w-0.5 bg-slate-700"
            style={{ left: `${performance.referencePercent}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
          <span>0%</span>
          <span>Referencia {performance.referencePercent.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {isPerformanceApplicable && !isOnReference ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 p-3.5 text-sm leading-5 text-amber-950 ring-1 ring-amber-200">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Está por debajo de la referencia del 80%. Esto no implica un
            descuadre; pueden existir saldos, tratamiento o producto en proceso.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Droplets className="size-4 text-brand-700" aria-hidden="true" />
            <h3 className="text-sm font-bold text-brand-950">Nuca Bikini</h3>
          </div>
          <StatusBadge tone={nuca.applicable ? 'info' : 'neutral'}>
            {nuca.applicable ? 'LAVADO ACTIVO' : 'NO APLICA'}
          </StatusBadge>
        </div>
        {nuca.applicable ? (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Referencia 7%</dt>
                <dd className="number-tabular mt-1 font-bold text-slate-900">
                  {formatCentiKg(nuca.referenceKg100)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Producción real</dt>
                <dd className="number-tabular mt-1 font-bold text-slate-900">
                  {formatCentiKg(nuca.actualKg100)}
                </dd>
              </div>
            </dl>
            {washAuthorization ? (
              <p className="mt-3 border-t border-brand-100 pt-3 text-xs leading-5 text-brand-900">
                {washAuthorization.kind === 'CUSTOMER_ORDER'
                  ? `Pedido: ${washAuthorization.reference}`
                  : 'Pedido confirmado; número no consignado en el Excel.'}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </SectionCard>
  )
}
