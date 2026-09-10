import { ArrowRight, CalendarDays, CheckCircle2, FilePlus2, Gauge } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatOperationalPeriod } from '../../../utils/operationalContext'
import {
  formatCentiKg,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { calculateProductionDay } from '../model/calculations'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

export function ProductionDaysPage() {
  usePageTitle('Jornadas de producción')
  const { activeWeek } = useProductionData()
  const registeredDays = activeWeek.productionDays.map((day) => ({
    day,
    calculation: calculateProductionDay(day),
  }))
  const balancedCount = registeredDays.filter(
    ({ day, calculation }) =>
      day.status === 'CLOSED' && calculation.status === 'BALANCED',
  ).length
  const belowReferenceCount = registeredDays.filter(
    ({ calculation }) => {
      const status = getYieldStatus(calculation.performance.percent).status
      return status === 'critical' || status === 'low' || status === 'acceptable'
    },
  ).length
  const latestDay = activeWeek.productionDays.at(-1)

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Producción"
        title="Jornadas de producción"
        description="Consulta el cuadre diario sin mezclarlo con el rendimiento operativo."
        actions={
          <ActionLink to="/jornadas/nueva" size="sm">
            <FilePlus2 className="size-4" aria-hidden="true" />
            Registrar jornada
          </ActionLink>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de jornadas">
        <MetricCard
          label="Jornadas registradas"
          value={registeredDays.length}
          icon={<CalendarDays className="size-5" />}
          description={`${registeredDays.length} de 7 días de la semana`}
        />
        <MetricCard
          label="Cuadradas"
          value={balancedCount}
          icon={<CheckCircle2 className="size-5" />}
          tone={
            registeredDays.length > 0 && balancedCount === registeredDays.length
              ? 'success'
              : 'warning'
          }
          description={
            registeredDays.length > 0 && balancedCount === registeredDays.length
              ? 'Sin diferencias pendientes'
              : 'Requiere revisión'
          }
        />
        <MetricCard
          label="Bajo referencia"
          value={belowReferenceCount}
          icon={<Gauge className="size-5" />}
          tone={belowReferenceCount === 0 ? 'success' : 'warning'}
          description="Referencia operativa: 80%"
        />
      </section>

      <SectionCard
        title={`Semana ${activeWeek.number}`}
        description={`${formatOperationalPeriod(activeWeek.period)} · ${activeWeek.isHistorical ? 'Histórico de solo lectura' : 'Registro local'}`}
        action={<StatusBadge tone="info">{registeredDays.length} REGISTROS</StatusBadge>}
      >
        {registeredDays.length === 0 ? (
          <div className="flex flex-col items-start gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Aún no hay jornadas registradas</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Empieza con ingreso manual o importa una hoja del Excel para revisarla.
              </p>
            </div>
            <ActionLink to="/jornadas/nueva">
              <FilePlus2 className="size-4" aria-hidden="true" />
              Nueva jornada
            </ActionLink>
          </div>
        ) : (
        <DataTableScroll label={`Jornadas de producción registradas en la semana ${activeWeek.number}`}>
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
              {registeredDays.map(({ day, calculation }) => {
                const isBalanced = calculation.status === 'BALANCED'
                const isClosed = day.status === 'CLOSED'
                const yieldStatus = getYieldStatus(calculation.performance.percent)
                const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]

                return (
                  <tr
                    key={day.id}
                    className={`border-l-4 bg-white hover:bg-brand-50/35 ${
                      !isClosed
                        ? 'border-amber-500'
                        : isBalanced
                          ? 'border-emerald-500'
                          : 'border-rose-500'
                    }`}
                  >
                    <th scope="row" className="px-4 py-3 sm:px-5">
                      <span className="block text-xs font-bold tracking-[0.04em] text-slate-950">
                        {formatIsoWeekday(day.date)}
                      </span>
                      <span className="number-tabular mt-0.5 block text-xs font-semibold text-slate-600">
                        {formatIsoDateCompact(day.date)}
                      </span>
                      {day.date === latestDay?.date ? (
                        <span className="mt-0.5 block text-[0.625rem] font-medium text-slate-400">
                          Último cierre disponible
                        </span>
                      ) : null}
                    </th>
                    <td className="number-tabular whitespace-nowrap px-3 py-3 text-right text-xs font-semibold text-slate-700">
                      {formatCentiKg(day.declaredRawMaterialKg100)}
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
                      <StatusBadge tone={!isClosed ? 'warning' : isBalanced ? 'success' : 'danger'}>
                        {!isClosed ? 'BORRADOR' : isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3">
                      <div
                        className="flex flex-col items-start gap-1"
                        title={`${formatRatioAsPercent(calculation.performance.ratio)} · ${yieldStatus.label}: ${yieldStatus.interpretation}`}
                        aria-label={`Rendimiento ${formatRatioAsPercent(calculation.performance.ratio)}. Estado ${yieldStatus.label}. ${yieldStatus.interpretation}`}
                      >
                        <span
                          className={`number-tabular whitespace-nowrap text-xs font-bold ${yieldStyles.textClass}`}
                        >
                          {formatRatioAsPercent(calculation.performance.ratio)}
                        </span>
                        <StatusBadge
                          tone={yieldStyles.badgeTone}
                        >
                          {yieldStatus.label}
                        </StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right sm:px-5">
                      <ActionLink
                        to={isClosed ? `/jornadas/${day.date}` : `/jornadas/${day.date}/editar`}
                        variant="ghost"
                        size="sm"
                      >
                        {isClosed ? 'Ver detalle' : 'Continuar'}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </ActionLink>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTableScroll>
        )}
      </SectionCard>
    </div>
  )
}

export default ProductionDaysPage
