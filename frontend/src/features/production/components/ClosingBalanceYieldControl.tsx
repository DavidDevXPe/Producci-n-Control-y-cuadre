import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
import { useId, useState } from 'react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type {
  FamilyYieldProjection,
  FamilyYieldStatus,
  ProductionBusinessSummary,
} from '../model/businessRules'
import type { SummaryGroupId } from '../model/types'

interface ClosingBalanceYieldControlProps {
  summary: ProductionBusinessSummary
}
interface ClosingBalanceRowControlProps {
  summary: ProductionBusinessSummary
  summaryGroupId: SummaryGroupId
}

const FAMILY_FOR_GROUP: Partial<
  Record<SummaryGroupId, FamilyYieldProjection['key']>
> = {
  ALETA: 'ALETA',
  MANTO: 'MANTO',
  REJOS_SPECIAL: 'REJO_REPRODUCTOR',
  REJOS: 'REJO_REPRODUCTOR',
  REPRODUCTOR: 'REJO_REPRODUCTOR',
  NUCA_SEMILIMPIA: 'NUCA',
  NUCA_BIKINI: 'NUCA',
}

function formatPercent(value: number | null) {
  return value === null
    ? 'No disponible'
    : `${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
}

function statusMeta(status: FamilyYieldStatus | 'UNAVAILABLE') {
  switch (status) {
    case 'INTEGRITY_ERROR':
      return { label: 'ERROR DE INTEGRIDAD', tone: 'danger' as const }
    case 'BELOW_TARGET':
      return { label: 'BAJO OBJETIVO', tone: 'warning' as const }
    case 'COMPLIES':
      return { label: 'CUMPLE', tone: 'success' as const }
    case 'NO_TARGET':
      return { label: 'SIN OBJETIVO', tone: 'neutral' as const }
    default:
      return { label: 'SIN DATOS', tone: 'neutral' as const }
  }
}

function SummaryMetric({ metric }: { metric: FamilyYieldProjection }) {
  const status = statusMeta(metric.status)

  return (
    <div className="border-b border-slate-200 py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-slate-800">
          {metric.label}
        </p>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <p className="number-tabular mt-1 text-lg font-extrabold text-slate-950">
        {formatPercent(metric.projectedYieldPercent)}
      </p>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6875rem] leading-5 text-slate-500">
        <span>
          Objetivo{' '}
          <strong className="text-slate-700">
            {metric.targetPercent === null
              ? 'No aplica'
              : `≥ ${metric.targetPercent.toFixed(0)}%`}
          </strong>
        </span>
        {metric.status === 'BELOW_TARGET' ? (
          <span>
            Faltan{' '}
            <strong className="number-tabular text-amber-700">
              {formatCentiKg(metric.missingToTargetKg100)}
            </strong>
          </span>
        ) : null}
      </div>
      {metric.status === 'INTEGRITY_ERROR' ? (
        <p className="mt-2 flex items-start gap-1.5 text-[0.6875rem] leading-4 text-rose-700">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Con este saldo el resultado alcanzaría{' '}
          {formatPercent(metric.projectedYieldPercent)}. Exceso:{' '}
          {formatCentiKg(metric.excessKg100)}.
        </p>
      ) : null}
      {metric.key === 'NUCA' ? (
        <p className="mt-1 text-[0.625rem] leading-4 text-slate-500">
          Nuca Bikini 7%: referencia informativa; no bloquea el cierre.
        </p>
      ) : null}
    </div>
  )
}

export function ClosingBalanceYieldControl({
  summary,
}: ClosingBalanceYieldControlProps) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const keyFamilies = summary.families.filter((metric) =>
    ['ALETA', 'REJO_REPRODUCTOR', 'NUCA'].includes(metric.key),
  )
  const overallStatus = statusMeta(summary.overallControl.status)

  return (
    <aside className="order-first border-b border-slate-200 bg-slate-50/70 lg:order-none lg:sticky lg:top-20 lg:rounded-xl lg:border">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left lg:hidden"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-900">
          Control de rendimientos
        </span>
        <ChevronDown
          className={`size-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div id={contentId} className={`${expanded ? 'block' : 'hidden'} px-4 pb-3 lg:block lg:p-4`}>
        <div className="hidden lg:block">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-900">
            Control de rendimientos
          </p>
          <p className="mt-1 text-[0.6875rem] leading-4 text-slate-500">
            Proyección en tiempo real con el saldo ingresado.
          </p>
        </div>

        <div className="lg:mt-2">
          {keyFamilies.map((metric) => (
            <SummaryMetric key={metric.key} metric={metric} />
          ))}

          <div className="py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-slate-800">
                Aprovechamiento general
              </p>
              <StatusBadge tone={overallStatus.tone}>
                {overallStatus.label}
              </StatusBadge>
            </div>
            <p className="number-tabular mt-1 text-lg font-extrabold text-slate-950">
              {formatPercent(summary.overallUtilization.percent)}
            </p>
            <dl className="mt-1 grid gap-0.5 text-[0.6875rem] leading-5 text-slate-500">
              <div className="flex justify-between gap-3">
                <dt>Objetivo</dt>
                <dd className="number-tabular font-bold text-slate-700">
                  ≥ {summary.overallControl.targetPercent.toFixed(0)}%
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>PT mínimo</dt>
                <dd className="number-tabular font-bold text-slate-700">
                  {formatCentiKg(summary.overallControl.minimumFinishedKg100)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Faltan</dt>
                <dd className="number-tabular font-bold text-slate-700">
                  {formatCentiKg(summary.overallControl.missingToTargetKg100)}
                </dd>
              </div>
            </dl>
            {summary.overallControl.status === 'INTEGRITY_ERROR' ? (
              <p className="mt-2 flex items-start gap-1.5 text-[0.6875rem] leading-4 text-rose-700">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Con este saldo el resultado alcanzaría{' '}
                {formatPercent(summary.overallUtilization.percent)}. Exceso:{' '}
                {formatCentiKg(summary.overallControl.excessKg100)}.
              </p>
            ) : summary.overallControl.status === 'COMPLIES' ? (
              <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] font-bold text-emerald-700">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Referencia general alcanzada
              </p>
            ) : null}
          </div>
        </div>

        <p className="border-t border-slate-200 pt-3 text-[0.6875rem] leading-4 text-slate-600">
          Registra únicamente saldo real. Los kg faltantes son una referencia.
        </p>
      </div>
    </aside>
  )
}

export function ClosingBalanceRowControl({
  summary,
  summaryGroupId,
}: ClosingBalanceRowControlProps) {
  const familyKey = FAMILY_FOR_GROUP[summaryGroupId]
  const family = familyKey
    ? summary.families.find((metric) => metric.key === familyKey)
    : undefined
  const group = summary.groupClosingProjections.find(
    (metric) => metric.groupId === summaryGroupId,
  )
  const yieldBeforePercent = family?.yieldBeforePercent ?? group?.yieldBeforePercent ?? null
  const projectedYieldPercent =
    family?.projectedYieldPercent ?? group?.projectedYieldPercent ?? null
  const capacityToOneHundredKg100 =
    family?.capacityToOneHundredKg100 ??
    group?.capacityToOneHundredKg100 ??
    summary.overallControl.capacityToOneHundredKg100
  const status = family?.status ?? group?.status ?? 'NO_TARGET'
  const meta = statusMeta(status)
  const excessKg100 = family?.excessKg100 ?? group?.excessKg100

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-[0.6875rem] sm:col-span-2 sm:grid-cols-[repeat(5,minmax(0,1fr))_auto] sm:items-center">
      <div>
        <p className="text-slate-500">Rendimiento antes</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {formatPercent(yieldBeforePercent)}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Rendimiento proyectado</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {formatPercent(projectedYieldPercent)}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Objetivo</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {family?.targetPercent == null
            ? 'No aplica'
            : `≥ ${family.targetPercent.toFixed(0)}%`}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Faltan</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {family?.targetPercent == null
            ? 'No aplica'
            : formatCentiKg(family.missingToTargetKg100)}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Capacidad hasta 100%</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {formatCentiKg(capacityToOneHundredKg100)}
        </p>
      </div>
      <div className="sm:justify-self-end">
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      </div>
      {status === 'INTEGRITY_ERROR' ? (
        <p className="flex items-start gap-1.5 text-rose-700 sm:col-span-6">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Con este saldo el resultado alcanzaría {formatPercent(projectedYieldPercent)}.
          {excessKg100 !== undefined ? ` Exceso: ${formatCentiKg(excessKg100)}.` : ''}
        </p>
      ) : null}
    </div>
  )
}
