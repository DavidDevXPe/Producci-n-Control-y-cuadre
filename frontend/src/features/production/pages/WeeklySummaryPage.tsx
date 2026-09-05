import {
  CheckCircle2,
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
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import {
  WEEK_36_2026_CALENDAR_DAYS,
  WEEK_36_2026_PERIOD,
  WEEK_36_2026_PRODUCTION_DAYS,
} from '../data/week36'
import { calculateProductionDay, calculateWeeklySummary, kg100 } from '../model/calculations'
import type { Kg100, SummaryGroupId, WeeklyProductTotal } from '../model/types'

const productionDays = WEEK_36_2026_PRODUCTION_DAYS
const summary = calculateWeeklySummary(productionDays, WEEK_36_2026_PERIOD)
const wednesday = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

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
  calculation: day.isoDate === WEDNESDAY_PRODUCTION_DAY.date ? wednesday : null,
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

export function WeeklySummaryPage() {
  usePageTitle('Resumen semanal')
  const isValid = summary.status === 'VALID'
  const isPerformanceOnReference =
    summary.performance.status === 'AT_OR_ABOVE_REFERENCE'
  const isNucaReferenceApplicable = summary.nucaBikini.applicable

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reportes"
        title="Resumen semanal"
        description="Semana 36 · Del 31 de agosto al 6 de septiembre de 2026. Validación acumulada con una jornada registrada."
        actions={<StatusBadge tone="info">SEMANA PARCIAL · 1 DE 7</StatusBadge>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores semanales">
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

      <SectionCard
        title="Validación de consistencia"
        description="El total diario y el detalle por producto se calculan de forma independiente."
        action={
          <StatusBadge tone={isValid ? 'success' : 'danger'}>
            {isValid ? 'INFORMACIÓN VÁLIDA' : 'REVISAR INFORMACIÓN'}
          </StatusBadge>
        }
        contentClassName="p-5 sm:p-6"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">PT por jornadas</p>
            <p className="number-tabular mt-2 text-xl font-black text-slate-950">
              {formatCentiKg(summary.declaredFinishedKg100)}
            </p>
          </div>
          <span className="hidden text-center text-xl font-light text-slate-300 md:block">−</span>
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">PT por productos</p>
            <p className="number-tabular mt-2 text-xl font-black text-slate-950">
              {formatCentiKg(summary.detailFinishedKg100)}
            </p>
          </div>
          <span className="hidden text-center text-xl font-light text-slate-300 md:block">=</span>
          <div className={`rounded-xl p-4 ring-1 ${isValid ? 'bg-emerald-50 ring-emerald-200' : 'bg-rose-50 ring-rose-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${isValid ? 'text-emerald-700' : 'text-rose-700'}`}>Diferencia</p>
            <p className={`number-tabular mt-2 text-xl font-black ${isValid ? 'text-emerald-900' : 'text-rose-900'}`}>
              {formatCentiKg(summary.differenceKg100)}
            </p>
          </div>
        </div>
        <div
          className={`mt-5 flex items-start gap-3 rounded-xl p-4 text-sm ring-1 ${
            isValid
              ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
              : 'bg-rose-50 text-rose-900 ring-rose-200'
          }`}
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {isValid
              ? 'Se incluyeron las 23 líneas con movimiento. La validación no depende de posiciones de fila y cubre los 2,306.70 kg que el resumen posicional omitía.'
              : 'Los dos caminos de validación o la integridad de una jornada requieren revisión.'}
          </p>
        </div>
        {summary.integrityIssues.length > 0 ? (
          <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-950 ring-1 ring-rose-200">
            <p className="font-extrabold">
              Validaciones pendientes ({summary.integrityIssues.length})
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-5">
              {summary.integrityIssues.map((issue, index) => (
                <li key={`${issue.code}-${issue.dayId ?? 'week'}-${index}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Producto terminado por jornada"
        description="Las jornadas no registradas permanecen visibles sin inventar cantidades."
      >
        <div className="scrollbar-subtle overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left">
            <caption className="sr-only">Producto terminado diario de la semana 36</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                <th scope="col" className="px-5 py-3.5 sm:px-6">Día</th>
                <th scope="col" className="px-3 py-3.5">Fecha</th>
                <th scope="col" className="px-3 py-3.5 text-right">Producto terminado</th>
                <th scope="col" className="px-5 py-3.5 text-right sm:px-6">Estado</th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map((day) => (
                <tr key={day.date} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-5 py-3.5 text-sm font-bold text-slate-800 sm:px-6">{day.label}</th>
                  <td className="px-3 py-3.5 text-sm text-slate-500">{day.date}</td>
                  <td className="number-tabular px-3 py-3.5 text-right text-sm font-bold text-slate-800">
                    {day.calculation ? formatCentiKg(day.calculation.declaredFinishedKg100) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right sm:px-6">
                    {day.calculation ? (
                      <StatusBadge
                        tone={
                          day.calculation.status === 'BALANCED'
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {day.calculation.status === 'BALANCED'
                          ? 'CUADRADO'
                          : 'NO CUADRADO'}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">SIN REGISTRO</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <th scope="row" colSpan={2} className="px-5 py-4 text-sm font-extrabold text-slate-950 sm:px-6">Total semanal registrado</th>
                <td className="number-tabular px-3 py-4 text-right text-sm font-black text-slate-950">{formatCentiKg(summary.declaredFinishedKg100)}</td>
                <td className="px-5 py-4 text-right sm:px-6"><StatusBadge tone="info">PARCIAL</StatusBadge></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <SectionCard
          title="Distribución de materia prima"
          description="Porcentajes de referencia conservados del resumen."
          contentClassName="grid gap-3 p-5 sm:grid-cols-2 sm:p-6"
        >
          {[
            ['Tubo', '50%', summary.distribution.tubeKg100],
            ['Aleta', '20%', summary.distribution.aletaKg100],
            ['Rejos', '15%', summary.distribution.rejosKg100],
            ['Nucas', '15%', summary.distribution.nucasKg100],
          ].map(([label, rate, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-800">{String(label)}</span>
                <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-extrabold text-brand-800">{String(rate)}</span>
              </div>
              <p className="number-tabular mt-3 text-lg font-black text-slate-950">{formatCentiKg(value as Kg100)}</p>
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
          contentClassName="p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-100 text-brand-800"><Droplets className="size-5" aria-hidden="true" /></span>
            <StatusBadge tone={isNucaReferenceApplicable ? 'info' : 'neutral'}>
              {isNucaReferenceApplicable ? 'LAVADO ACTIVO' : 'NO APLICA'}
            </StatusBadge>
          </div>
          {isNucaReferenceApplicable ? (
            <>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Referencia 7%</dt>
                  <dd className="number-tabular mt-1.5 font-extrabold text-slate-950">{formatCentiKg(summary.nucaBikini.referenceKg100)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Resultado real</dt>
                  <dd className="number-tabular mt-1.5 font-extrabold text-slate-950">{formatCentiKg(summary.nucaBikini.actualKg100)}</dd>
                </div>
              </dl>
              <p className="mt-5 rounded-xl bg-brand-50 p-3 text-sm leading-5 text-brand-950">
                Participación real: {summary.nucaBikini.shareOfRawMaterialPercent?.toFixed(2)}% de la MP.
              </p>
            </>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600 ring-1 ring-slate-200">
              La referencia del 7% solo se evalúa cuando la nuca se lava para un pedido.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Consolidado por grupo y producto"
        description="Mismas relaciones del RESUMEN, calculadas mediante identificadores estables."
      >
        <div className="scrollbar-subtle overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-left">
            <caption className="sr-only">Consolidado semanal por grupo y producto</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                <th scope="col" className="px-5 py-3.5 sm:px-6">Grupo / producto</th>
                <th scope="col" className="px-3 py-3.5 text-right">Producto</th>
                <th scope="col" className="px-3 py-3.5 text-right">Distribución MP</th>
                <th scope="col" className="px-3 py-3.5 text-right">Rendimiento</th>
                <th scope="col" className="px-5 py-3.5 text-right sm:px-6">Aprov. MP</th>
              </tr>
            </thead>
            {groupOrder.map((groupId) => {
              const total = getGroupTotal(groupId)
              const allocation = getGroupAllocation(groupId)
              const products = productsForGroup(groupId)
              return (
                <tbody key={groupId} className="border-b border-slate-200 last:border-0">
                  <tr className="bg-brand-50/55">
                    <th scope="rowgroup" className="px-5 py-3 text-sm font-extrabold text-brand-950 sm:px-6">{groupLabels[groupId]}</th>
                    <td className="number-tabular px-3 py-3 text-right text-xs font-extrabold text-slate-950">{formatCentiKg(total)}</td>
                    <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">{allocation === null ? '—' : formatCentiKg(allocation)}</td>
                    <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">{percentage(total, allocation)}</td>
                    <td className="number-tabular px-5 py-3 text-right text-xs font-bold text-slate-700 sm:px-6">{percentage(total, summary.rawMaterialKg100)}</td>
                  </tr>
                  {products.map((product) => (
                    <tr key={product.productId} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <th scope="row" className="max-w-2xl px-5 py-3 pl-10 text-xs font-semibold leading-5 text-slate-600 sm:px-6 sm:pl-12">{product.productName}</th>
                      <td className="number-tabular px-3 py-3 text-right text-xs font-semibold text-slate-700">{formatCentiKg(product.totalKg100)}</td>
                      <td colSpan={3} />
                    </tr>
                  ))}
                </tbody>
              )
            })}
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <th scope="row" className="px-5 py-4 text-sm font-black text-slate-950 sm:px-6">TOTAL PRODUCTO TERMINADO</th>
                <td className="number-tabular px-3 py-4 text-right text-sm font-black text-slate-950">{formatCentiKg(summary.detailFinishedKg100)}</td>
                <td className="px-3 py-4" />
                <td className="number-tabular px-3 py-4 text-right text-sm font-black text-slate-950">{formatRatioAsPercent(summary.performance.ratio)}</td>
                <td className="px-5 py-4 text-right sm:px-6">
                  <StatusBadge tone={isPerformanceOnReference ? 'success' : 'warning'}>
                    REF. 80%
                  </StatusBadge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
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
