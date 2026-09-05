import { ArrowRight, CalendarDays, CheckCircle2, Gauge } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatCentiKg,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'

const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

export function ProductionDaysPage() {
  usePageTitle('Jornadas de producción')
  const isBalanced = calculation.status === 'BALANCED'
  const isPerformanceOnReference =
    calculation.performance.status === 'AT_OR_ABOVE_REFERENCE'

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Producción"
        title="Jornadas de producción"
        description="Consulta el cuadre diario sin mezclarlo con el rendimiento operativo."
      />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de jornadas">
        <MetricCard
          label="Jornadas registradas"
          value="1"
          icon={<CalendarDays className="size-5" />}
          description="1 de 7 días de la semana"
        />
        <MetricCard
          label="Cuadradas"
          value={isBalanced ? '1' : '0'}
          icon={<CheckCircle2 className="size-5" />}
          tone={isBalanced ? 'success' : 'danger'}
          description={isBalanced ? 'Sin diferencias pendientes' : 'Requiere revisión'}
        />
        <MetricCard
          label="Bajo referencia"
          value={isPerformanceOnReference ? '0' : '1'}
          icon={<Gauge className="size-5" />}
          tone={isPerformanceOnReference ? 'success' : 'warning'}
          description="Referencia operativa: 80%"
        />
      </section>

      <SectionCard
        title="Semana 36"
        description="Del 31 de agosto al 6 de septiembre de 2026 · Semana parcial"
        action={<StatusBadge tone="info">1 REGISTRO</StatusBadge>}
      >
        <DataTableScroll label="Jornadas de producción de la semana 36">
          <table className="erp-table w-full min-w-[61rem] border-collapse text-left">
            <caption className="sr-only">Jornadas de producción registradas</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                <th scope="col" className="px-4 py-2.5 sm:px-5">Jornada</th>
                <th scope="col" className="px-3 py-2.5 text-right">Materia prima</th>
                <th scope="col" className="px-3 py-2.5 text-right">Producto terminado</th>
                <th scope="col" className="px-3 py-2.5 text-right">Saldo final</th>
                <th scope="col" className="px-3 py-2.5 text-right">Diferencia</th>
                <th scope="col" className="px-3 py-2.5">Cuadre</th>
                <th scope="col" className="px-3 py-2.5">Rendimiento</th>
                <th scope="col" className="px-4 py-2.5 text-right sm:px-5"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-l-4 border-emerald-500 bg-white hover:bg-brand-50/35">
                <th scope="row" className="px-4 py-3 sm:px-5">
                  <span className="block text-xs font-bold tracking-[0.04em] text-slate-950">
                    {formatIsoWeekday(WEDNESDAY_PRODUCTION_DAY.date)}
                  </span>
                  <span className="number-tabular mt-0.5 block text-xs font-semibold text-slate-600">
                    {formatIsoDateCompact(WEDNESDAY_PRODUCTION_DAY.date)}
                  </span>
                  <span className="mt-0.5 block text-[0.625rem] font-medium text-slate-400">
                    Último cierre disponible
                  </span>
                </th>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-right text-xs font-semibold text-slate-700">
                  {formatCentiKg(WEDNESDAY_PRODUCTION_DAY.declaredRawMaterialKg100)}
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-slate-950">
                  {formatCentiKg(calculation.declaredFinishedKg100)}
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-right text-xs font-semibold text-slate-700">
                  {formatCentiKg(calculation.newClosingBalanceKg100)}
                </td>
                <td
                  className={`number-tabular whitespace-nowrap px-3 py-3 text-right text-xs font-bold ${
                    isBalanced ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCentiKg(calculation.differenceKg100)}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
                    {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                  </StatusBadge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={`number-tabular whitespace-nowrap text-xs font-bold ${
                        isPerformanceOnReference ? 'text-emerald-700' : 'text-amber-800'
                      }`}
                    >
                      {formatRatioAsPercent(calculation.performance.ratio)}
                    </span>
                    <StatusBadge tone={isPerformanceOnReference ? 'success' : 'warning'}>
                      {isPerformanceOnReference ? 'EN REFERENCIA' : 'BAJO REFERENCIA'}
                    </StatusBadge>
                  </div>
                </td>
                <td className="px-4 py-3 text-right sm:px-5">
                  <ActionLink
                    to={`/jornadas/${WEDNESDAY_PRODUCTION_DAY.date}`}
                    variant="ghost"
                    size="sm"
                  >
                    Ver detalle
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ActionLink>
                </td>
              </tr>
            </tbody>
          </table>
        </DataTableScroll>
      </SectionCard>
    </div>
  )
}
