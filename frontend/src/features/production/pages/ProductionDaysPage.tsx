import { ArrowRight, CalendarDays, CheckCircle2, Gauge } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate, formatRatioAsPercent } from '../../../utils/formatters'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'

const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

export function ProductionDaysPage() {
  usePageTitle('Jornadas de producción')
  const isBalanced = calculation.status === 'BALANCED'
  const isPerformanceOnReference =
    calculation.performance.status === 'AT_OR_ABOVE_REFERENCE'

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Producción"
        title="Jornadas de producción"
        description="Consulta el cuadre diario sin mezclarlo con el rendimiento operativo."
      />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen de jornadas">
        <MetricCard label="Jornadas registradas" value="1" icon={<CalendarDays className="size-5" />} />
        <MetricCard
          label="Cuadradas"
          value={isBalanced ? '1' : '0'}
          icon={<CheckCircle2 className="size-5" />}
          tone={isBalanced ? 'success' : 'danger'}
        />
        <MetricCard
          label="Bajo referencia"
          value={isPerformanceOnReference ? '0' : '1'}
          icon={<Gauge className="size-5" />}
          tone={isPerformanceOnReference ? 'success' : 'warning'}
        />
      </section>

      <SectionCard
        title="Semana 36"
        description="Del 31 de agosto al 6 de septiembre de 2026 · Semana parcial"
        action={<StatusBadge tone="info">1 REGISTRO</StatusBadge>}
      >
        <div className="scrollbar-subtle overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-left">
            <caption className="sr-only">Jornadas de producción registradas</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                <th scope="col" className="px-5 py-3.5 sm:px-6">Jornada</th>
                <th scope="col" className="px-3 py-3.5 text-right">Materia prima</th>
                <th scope="col" className="px-3 py-3.5 text-right">Producto terminado</th>
                <th scope="col" className="px-3 py-3.5 text-right">Saldo final</th>
                <th scope="col" className="px-3 py-3.5 text-right">Diferencia</th>
                <th scope="col" className="px-3 py-3.5">Cuadre</th>
                <th scope="col" className="px-3 py-3.5">Rendimiento</th>
                <th scope="col" className="px-5 py-3.5 sm:px-6"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50/80">
                <th scope="row" className="px-5 py-4 sm:px-6">
                  <span className="block text-sm font-extrabold text-slate-900">
                    {formatIsoDate(WEDNESDAY_PRODUCTION_DAY.date)}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-slate-500">Jornada validada</span>
                </th>
                <td className="number-tabular px-3 py-4 text-right text-sm text-slate-700">
                  {formatCentiKg(WEDNESDAY_PRODUCTION_DAY.declaredRawMaterialKg100)}
                </td>
                <td className="number-tabular px-3 py-4 text-right text-sm font-bold text-slate-900">
                  {formatCentiKg(calculation.declaredFinishedKg100)}
                </td>
                <td className="number-tabular px-3 py-4 text-right text-sm text-slate-700">
                  {formatCentiKg(calculation.newClosingBalanceKg100)}
                </td>
                <td
                  className={`number-tabular px-3 py-4 text-right text-sm font-bold ${
                    isBalanced ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCentiKg(calculation.differenceKg100)}
                </td>
                <td className="px-3 py-4">
                  <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
                    {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                  </StatusBadge>
                </td>
                <td className="px-3 py-4">
                  <StatusBadge tone={isPerformanceOnReference ? 'success' : 'warning'}>
                    {formatRatioAsPercent(calculation.performance.ratio)}
                  </StatusBadge>
                </td>
                <td className="px-5 py-4 text-right sm:px-6">
                  <Link
                    to={`/jornadas/${WEDNESDAY_PRODUCTION_DAY.date}`}
                    className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-700 hover:text-brand-900"
                  >
                    Ver detalle
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
