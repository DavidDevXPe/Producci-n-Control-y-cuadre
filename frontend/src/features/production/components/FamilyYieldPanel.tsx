import { AlertTriangle, Calculator, CheckCircle2 } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type {
  FamilyYieldProjection,
  ProductionBusinessSummary,
} from '../model/businessRules'

interface FamilyYieldPanelProps {
  summary: ProductionBusinessSummary
  showTunnel?: boolean
}

function formatPercent(value: number | null) {
  return value === null
    ? 'No disponible'
    : `${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
}

function yieldStatus(metric: FamilyYieldProjection) {
  switch (metric.status) {
    case 'INTEGRITY_ERROR':
      return { tone: 'danger' as const, label: 'ERROR DE INTEGRIDAD' }
    case 'BELOW_TARGET':
      return { tone: 'warning' as const, label: 'BAJO OBJETIVO' }
    case 'COMPLIES':
      return { tone: 'success' as const, label: 'CUMPLE' }
    default:
      return { tone: 'neutral' as const, label: 'SIN OBJETIVO' }
  }
}

export function FamilyYieldPanel({
  summary,
  showTunnel = false,
}: FamilyYieldPanelProps) {
  return (
    <SectionCard
      title="Rendimiento técnico y aprovechamiento MP"
      description={`Evolución por Reportes${showTunnel ? ', Túnel' : ''}, Tratamiento y saldo; el aprovechamiento siempre usa la MP total.`}
      action={<Calculator className="size-5 text-brand-700" aria-hidden="true" />}
    >
      <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
        {summary.families.map((metric) => {
          const status = yieldStatus(metric)

          return (
            <article
              key={metric.key}
              className="rounded-xl border border-slate-200 bg-slate-50/55 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">{metric.label}</h3>
                  <p className="mt-0.5 text-[0.6875rem] text-slate-500">
                    MP de referencia: {formatCentiKg(metric.rawMaterialKg100)}
                  </p>
                </div>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Después de Reportes</dt>
                  <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                    {formatPercent(metric.reportYieldPercent)}
                  </dd>
                </div>
                {showTunnel ? (
                  <>
                    <div>
                      <dt className="text-slate-500">Túnel incorporado</dt>
                      <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                        {formatCentiKg(metric.tunnelKg100)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Después de Túnel</dt>
                      <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                        {formatPercent(metric.afterTunnelYieldPercent)}
                      </dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt className="text-slate-500">Producción antes de saldo</dt>
                  <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                    {formatCentiKg(metric.productionBeforeClosingKg100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tratamiento incluido</dt>
                  <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                    {formatCentiKg(metric.treatmentKg100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Rend. técnico antes de saldo</dt>
                  <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                    {formatPercent(metric.yieldBeforePercent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Objetivo técnico</dt>
                  <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                    {metric.targetPercent === null
                      ? 'Sin objetivo configurado'
                      : `≥ ${metric.targetPercent.toFixed(0)}%`}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Saldo ingresado</dt>
                  <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                    {formatCentiKg(metric.closingBalanceKg100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Rendimiento técnico</dt>
                  <dd className="number-tabular mt-0.5 text-base font-extrabold text-slate-950">
                    {formatPercent(metric.projectedYieldPercent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Aprovechamiento MP</dt>
                  <dd className="number-tabular mt-0.5 text-base font-extrabold text-brand-800">
                    {formatPercent(metric.utilizationPercent)}
                  </dd>
                </div>
                {metric.targetPercent !== null ? (
                  <div>
                    <dt className="text-slate-500">Kg faltantes para objetivo</dt>
                    <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                      {formatCentiKg(metric.missingToTargetKg100)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-slate-500">Capacidad hasta 100%</dt>
                  <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                    {formatCentiKg(metric.capacityToOneHundredKg100)}
                  </dd>
                </div>
              </dl>

              {metric.status === 'INTEGRITY_ERROR' ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-900">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>
                    Con este saldo, {metric.label} alcanzaría{' '}
                    {formatPercent(metric.projectedYieldPercent)}. Exceso detectado:{' '}
                    {formatCentiKg(metric.excessKg100)}.
                  </p>
                </div>
              ) : metric.status === 'COMPLIES' ? (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Objetivo alcanzado
                </p>
              ) : null}

              {metric.key === 'REJO_REPRODUCTOR' ? (
                <div className="mt-3 grid gap-1 border-t border-slate-200 pt-3 text-[0.6875rem] leading-5 text-slate-500 sm:grid-cols-2">
                  <p>
                    Rejo: <strong>{formatPercent(summary.rejoReproductor.sharedYieldPercent)}</strong> ·
                    MP {formatCentiKg(summary.rejoReproductor.rejoRawMaterialKg100)}
                  </p>
                  <p>
                    Reproductor: <strong>{formatPercent(summary.rejoReproductor.sharedYieldPercent)}</strong> ·
                    MP {formatCentiKg(summary.rejoReproductor.reproductorRawMaterialKg100)}
                  </p>
                </div>
              ) : null}
              {metric.key === 'MANTO' ? (
                <div className="mt-3 border-t border-slate-200 pt-3 text-[0.6875rem] leading-5 text-slate-500">
                  <p>
                    Rendimiento técnico Manto: <strong>80%</strong> · PT Manto:{' '}
                    {formatCentiKg(summary.tubeMpBalance.ptMantoKg100)} · MP
                    estimada: {formatCentiKg(summary.tubeMpBalance.mpMantoEstimatedKg100)}
                  </p>
                  {summary.tubeMpBalance.mpMantoExcessKg100 > 0 ? (
                    <p className="mt-1 font-bold text-rose-700">
                      Error: la MP estimada de Manto excede la MP Tubo en{' '}
                      {formatCentiKg(summary.tubeMpBalance.mpMantoExcessKg100)}.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {metric.key === 'NUCA' && summary.nucaBikiniReferenceKg100 !== null ? (
                <p className="mt-3 border-t border-slate-200 pt-3 text-[0.6875rem] leading-5 text-slate-500">
                  Referencia teórica informativa Nuca Bikini (7%):{' '}
                  {formatCentiKg(summary.nucaBikiniReferenceKg100)}. No bloquea el cierre.
                </p>
              ) : null}
            </article>
          )
        })}
      </div>
      <div className="border-t border-slate-200 bg-slate-50/55 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Aprovechamiento MP por grupo
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Producto terminado del grupo ÷ materia prima total.
            </p>
          </div>
          <p className="number-tabular text-sm font-bold text-brand-800">
            General: {formatPercent(summary.overallUtilization.percent)}
          </p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summary.groupUtilizations.map((group) => (
            <div
              key={group.groupId}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {group.label}
                </p>
                <p className="number-tabular mt-0.5 text-[0.6875rem] text-slate-500">
                  {formatCentiKg(group.finishedKg100)}
                </p>
              </div>
              <p className="number-tabular whitespace-nowrap text-xs font-extrabold text-brand-800">
                {formatPercent(group.percent)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs leading-5 text-slate-600 sm:px-5">
        Registre únicamente saldo real. Los kg faltantes son una referencia para alcanzar el objetivo.
      </p>
    </SectionCard>
  )
}

export default FamilyYieldPanel
