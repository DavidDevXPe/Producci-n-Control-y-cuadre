import { Calculator, CircleAlert } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { TubeMpBalance } from '../model/tubeMpBalance'
import type { Kg100 } from '../model/types'

interface TubeMpBalancePanelProps {
  balance: TubeMpBalance
}

export function TubeMpBalancePanel({ balance }: TubeMpBalancePanelProps) {
  if (
    balance.mpTotalKg100 === 0 ||
    (balance.ptMantoKg100 === 0 && balance.ptAnillasKg100 === 0)
  ) {
    return null
  }

  const hasIntegrityError =
    balance.mpMantoExcessKg100 > 0 ||
    balance.mpMainAnillasExcessKg100 > 0 ||
    balance.unclassifiedAnillasKg100 > 0

  return (
    <SectionCard
      title="Balance MP Tubo"
      description="Reconstrucción técnica de la bolsa Tubo, sin asignar una segunda materia prima a sus coproductos."
      action={
        <StatusBadge tone={hasIntegrityError ? 'danger' : 'success'}>
          {hasIntegrityError ? 'REVISAR INTEGRIDAD' : 'BALANCE TUBO 0.00 KG'}
        </StatusBadge>
      }
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <MetricCard
          label="MP Tubo"
          value={formatCentiKg(balance.mpTubeKg100)}
        />
        <MetricCard
          label="MP utilizada Manto"
          value={formatCentiKg(balance.mpMantoEstimatedKg100)}
          description="PT Manto ÷ 80%"
        />
        <MetricCard
          label="MP proceso Anillas"
          value={formatCentiKg(balance.mpAnillaProcessKg100)}
          description="MP Tubo − MP Manto"
        />
        <MetricCard
          label="Diferencia balance Tubo"
          value={formatCentiKg(balance.tubeDifferenceKg100)}
          tone={balance.tubeDifferenceKg100 === 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="border-t border-slate-200 bg-slate-50/55 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-brand-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-950">
            Detalle técnico de Anillas
          </h3>
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {([
            ['Polar · 36%', balance.mpAnillaPolarEstimatedKg100],
            ['Generales · 42%', balance.mpAnillaGeneralEstimatedKg100],
            ['USA · 34%', balance.mpAnillaUsaEstimatedKg100],
            ['MP principal explicada', balance.mpMainAnillasEstimatedKg100],
            ['MP técnica por distribuir', balance.mpAnillasUnallocatedKg100],
          ] satisfies readonly (readonly [string, Kg100])[]).map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <dt className="text-[0.6875rem] font-semibold leading-4 text-slate-500">
                {String(label)}
              </dt>
              <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-bold text-slate-950">
                {formatCentiKg(value)}
              </dd>
            </div>
          ))}
        </dl>

        {balance.mpAnillasUnallocatedKg100 > 0 ? (
          <p className="mt-3 text-xs leading-5 text-slate-600">
            La MP técnica por distribuir pertenece al proceso global de Anillas;
            no se considera merma ni se asigna automáticamente a Botón, Recorte
            o Membranas.
          </p>
        ) : null}

        {hasIntegrityError ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-900">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              {balance.mpMantoExcessKg100 > 0 ? (
                <p>
                  Manto requiere {formatCentiKg(balance.mpMantoExcessKg100)} más
                  que la MP Tubo disponible.
                </p>
              ) : null}
              {balance.mpMainAnillasExcessKg100 > 0 ? (
                <p>
                  Las Anillas principales requieren un exceso de{' '}
                  {formatCentiKg(balance.mpMainAnillasExcessKg100)}.
                </p>
              ) : null}
              {balance.unclassifiedAnillasKg100 > 0 ? (
                <p>
                  Hay {formatCentiKg(balance.unclassifiedAnillasKg100)} sin
                  clasificación técnica Polar, General o USA.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}

export default TubeMpBalancePanel
