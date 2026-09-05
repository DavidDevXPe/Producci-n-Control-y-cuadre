import {
  ClipboardCheck,
  Droplets,
  Gauge,
  PackageCheck,
  Scale,
  Waves,
} from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatCentiKg,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { WeeklyConsistencyPanel } from '../components/WeeklyConsistencyPanel'
import { WeeklyDaysTable } from '../components/WeeklyDaysTable'
import {
  WeeklyProductSummary,
  type WeeklyProductGroupRow,
} from '../components/WeeklyProductSummary'
import {
  WEEK_36_2026_CALENDAR_DAYS,
  WEEK_36_2026_PERIOD,
  WEEK_36_2026_PRODUCTION_DAYS,
} from '../data/week36'
import { calculateProductionDay, calculateWeeklySummary, kg100 } from '../model/calculations'
import type { Kg100, SummaryGroupId, WeeklyProductTotal } from '../model/types'

const productionDays = WEEK_36_2026_PRODUCTION_DAYS
const summary = calculateWeeklySummary(productionDays, WEEK_36_2026_PERIOD)
const calculationsByDate = new Map(
  productionDays.map((day) => [day.date, calculateProductionDay(day)] as const),
)

const groupOrder: readonly SummaryGroupId[] = [
  'ALETA',
  'MANTO',
  'ANILLAS',
  'BOTON',
  'RECORTE_CRUDO',
  'RECORTE_COCIDO',
  'REJOS_SPECIAL',
  'REJOS',
  'REPRODUCTOR',
  'PICO',
  'NUCA_BIKINI',
]

const groupLabels: Record<SummaryGroupId, string> = {
  ALETA: 'Aleta cruda',
  MANTO: 'Manto crudo',
  ANILLAS: 'Anillas',
  BOTON: 'Botón / tratamiento',
  RECORTE_CRUDO: 'Recorte crudo',
  RECORTE_COCIDO: 'Recorte cocido y membrana',
  REJOS_SPECIAL: 'Rejos bailarín semilimpio',
  REJOS: 'Rejos crudo',
  REPRODUCTOR: 'Reproductor crudo',
  PICO: 'Pico',
  NUCA_BIKINI: 'Nuca Bikini',
}

const weekDays = WEEK_36_2026_CALENDAR_DAYS.map((day) => ({
  ...day,
  calculation: calculationsByDate.get(day.isoDate) ?? null,
}))

function getGroupTotal(groupId: SummaryGroupId): Kg100 {
  return summary.groupTotals.find((group) => group.summaryGroupId === groupId)?.totalKg100 ?? kg100(0)
}

function getWeeklyReproductorAllocation(): Kg100 {
  return kg100(
    productionDays.reduce(
      (total, day) =>
        total + (day.rawMaterialAllocationOverridesKg100.REPRODUCTOR ?? 0),
      0,
    ),
  )
}

function getGroupAllocation(groupId: SummaryGroupId): Kg100 | null {
  const reproductor = getWeeklyReproductorAllocation()
  const allocations: Partial<Record<SummaryGroupId, Kg100 | null>> = {
    ALETA: summary.distribution.aletaKg100,
    MANTO: summary.distribution.tubeKg100,
    ANILLAS: summary.distribution.tubeKg100,
    BOTON: summary.distribution.tubeKg100,
    RECORTE_CRUDO: null,
    RECORTE_COCIDO: null,
    REJOS_SPECIAL: null,
    REJOS: kg100(summary.distribution.rejosKg100 - reproductor),
    REPRODUCTOR: reproductor,
    PICO: kg100(0),
    NUCA_BIKINI: summary.distribution.nucasKg100,
  }

  return allocations[groupId] ?? null
}

function percentage(numerator: Kg100, denominator: Kg100 | null): string {
  if (denominator === null || denominator === 0) return '—'
  return `${((numerator / denominator) * 100).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function productsForGroup(groupId: SummaryGroupId): readonly WeeklyProductTotal[] {
  return summary.productTotals.filter((product) => product.summaryGroupId === groupId)
}

const weeklyProductGroups: readonly WeeklyProductGroupRow[] = groupOrder.map((groupId) => {
  const totalKg100 = getGroupTotal(groupId)
  const allocationKg100 = getGroupAllocation(groupId)

  return {
    id: groupId,
    label: groupLabels[groupId],
    totalKg100,
    allocationLabel: allocationKg100 === null ? '—' : formatCentiKg(allocationKg100),
    performanceLabel: percentage(totalKg100, allocationKg100),
    rawMaterialShareLabel: percentage(totalKg100, summary.rawMaterialKg100),
    products: productsForGroup(groupId),
  }
})

export function WeeklySummaryPage() {
  usePageTitle('Resumen semanal')
  const isValid = summary.status === 'VALID'
  const isPerformanceOnReference =
    summary.performance.status === 'AT_OR_ABOVE_REFERENCE'
  const isNucaReferenceApplicable = summary.nucaBikini.applicable

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reportes"
        title="Resumen semanal"
        description="Semana 36 · Del 31 de agosto al 6 de septiembre de 2026. Validación acumulada con dos jornadas registradas."
        actions={<StatusBadge tone="info">SEMANA PARCIAL · 2 DE 7</StatusBadge>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores semanales">
        <MetricCard
          label="Materia prima semanal"
          value={formatCentiKg(summary.rawMaterialKg100)}
          icon={<Waves className="size-5" />}
        />
        <MetricCard
          label="Producto terminado"
          value={formatCentiKg(summary.detailFinishedKg100)}
          icon={<PackageCheck className="size-5" />}
          tone="brand"
        />
        <MetricCard
          label="Diferencia semanal"
          value={formatCentiKg(summary.differenceKg100)}
          icon={<Scale className="size-5" />}
          tone={isValid ? 'success' : 'danger'}
        />
        <MetricCard
          label="Rendimiento acumulado"
          value={formatRatioAsPercent(summary.performance.ratio)}
          icon={<Gauge className="size-5" />}
          tone={isPerformanceOnReference ? 'success' : 'warning'}
          description="Referencia operativa: 80%"
        />
      </section>

      <WeeklyConsistencyPanel summary={summary} />

      <WeeklyDaysTable
        days={weekDays}
        totalKg100={summary.declaredFinishedKg100}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_0.7fr]">
        <SectionCard
          title="Distribución de materia prima"
          description="Porcentajes de referencia conservados del resumen."
          contentClassName="grid gap-3 p-4 sm:grid-cols-2 sm:p-5"
        >
          {[
            ['Tubo', '50%', summary.distribution.tubeKg100],
            ['Aleta', '20%', summary.distribution.aletaKg100],
            ['Rejos', '15%', summary.distribution.rejosKg100],
            ['Nucas', '15%', summary.distribution.nucasKg100],
          ].map(([label, rate, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-800">{String(label)}</span>
                <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-800">{String(rate)}</span>
              </div>
              <p className="number-tabular mt-2 whitespace-nowrap text-base font-bold text-slate-950">{formatCentiKg(value as Kg100)}</p>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          title="Referencia Nuca Bikini"
          description={
            isNucaReferenceApplicable
              ? 'Aplica porque hubo lavado por pedido.'
              : 'No hubo lavado por pedido en las jornadas registradas.'
          }
          contentClassName="p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-100 text-brand-800"><Droplets className="size-5" aria-hidden="true" /></span>
            <StatusBadge tone={isNucaReferenceApplicable ? 'info' : 'neutral'}>
              {isNucaReferenceApplicable ? 'LAVADO ACTIVO' : 'NO APLICA'}
            </StatusBadge>
          </div>
          {isNucaReferenceApplicable ? (
            <>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Referencia 7%</dt>
                  <dd className="number-tabular mt-1.5 font-bold text-slate-950">{formatCentiKg(summary.nucaBikini.referenceKg100)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Resultado real</dt>
                  <dd className="number-tabular mt-1.5 font-bold text-slate-950">{formatCentiKg(summary.nucaBikini.actualKg100)}</dd>
                </div>
              </dl>
              <p className="mt-4 rounded-lg bg-brand-50 p-3 text-xs leading-5 text-brand-950">
                Participación real: {summary.nucaBikini.shareOfRawMaterialPercent?.toFixed(2)}% de la MP.
              </p>
            </>
          ) : (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
              La referencia del 7% solo se evalúa cuando la nuca se lava para un pedido.
            </p>
          )}
        </SectionCard>
      </div>

      <WeeklyProductSummary
        groups={weeklyProductGroups}
        totalFinishedKg100={summary.detailFinishedKg100}
        performanceRatio={summary.performance.ratio}
        isPerformanceOnReference={isPerformanceOnReference}
      />

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-panel">
        <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
        <p>
          La semana puede validar en cero y permanecer bajo la referencia del 80%.
          El rendimiento acumulado se calcula con los totales de MP y producto, no
          promediando porcentajes diarios.
        </p>
      </div>
    </div>
  )
}
