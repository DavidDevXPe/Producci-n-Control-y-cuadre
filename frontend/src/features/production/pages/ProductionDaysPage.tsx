import { ArrowRight, CalendarDays, CheckCircle2, FilePlus2, Gauge } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatOperationalPeriod,
  getOperationalWeekContext,
  getOperationalWeekState,
} from '../../../utils/operationalContext'
import {
  formatCentiKgValue,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { calculateProductionDay } from '../model/calculations'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

function QuantityValue({ value }: { value: number }) {
  return (
    <span className="inline-flex w-full items-baseline justify-center whitespace-nowrap text-center">
      <span>{formatCentiKgValue(value)}</span>
      <span className="ml-1 text-[0.6875rem] font-medium opacity-70">kg</span>
    </span>
  )
}

export function ProductionDaysPage() {
  usePageTitle('Jornadas de producción')
  const { activeWeek } = useProductionData()
  const activeWeekState = getOperationalWeekState(
    activeWeek,
    getOperationalWeekContext(new Date()),
  )
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
        description="Consulta el cuadre diario sin mezclarlo con el aprovechamiento operativo."
        actions={
          activeWeekState.canCreate ? (
            <ActionLink to="/jornadas/nueva" size="sm">
              <FilePlus2 className="size-4" aria-hidden="true" />
              Nueva jornada
            </ActionLink>
          ) : null
        }
      />

      <section className="grid auto-rows-fr gap-3 sm:grid-cols-3" aria-label="Resumen de jornadas">
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
          label="Bajo referencia (<80%)"
          value={belowReferenceCount}
          icon={<Gauge className="size-5" />}
          tone={belowReferenceCount === 0 ? 'success' : 'warning'}
          description="Referencia operativa: 80%"
        />
      </section>

      <SectionCard
        title={`Semana ${activeWeek.number}`}
        description={`${formatOperationalPeriod(activeWeek.period)} · ${
          activeWeekState.isClosed
            ? 'Cerrada · Solo lectura'
            : activeWeekState.isCurrent
              ? 'Actual'
              : 'Solo lectura'
        }`}
        action={
          <StatusBadge tone="info">
            {registeredDays.length}{' '}
            {registeredDays.length === 1 ? 'REGISTRO' : 'REGISTROS'}
          </StatusBadge>
        }
      >
        {registeredDays.length === 0 ? (
          <div className="flex flex-col items-start gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Aún no hay jornadas registradas</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {activeWeekState.canCreate
                  ? 'Empieza con ingreso manual o importa una hoja del Excel para revisarla.'
                  : 'Esta semana cerrada permanece disponible únicamente para consulta.'}
              </p>
            </div>
            {activeWeekState.canCreate ? (
              <ActionLink to="/jornadas/nueva">
                <FilePlus2 className="size-4" aria-hidden="true" />
                Nueva jornada
              </ActionLink>
            ) : null}
          </div>
        ) : (
        <DataTableScroll label={`Jornadas de producción registradas en la semana ${activeWeek.number}`}>
          <table className="erp-table w-full min-w-[64rem] table-fixed border-collapse text-left">
            <caption className="sr-only">Jornadas de producción registradas</caption>
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Jornada</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Materia prima</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Producto terminado</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Saldo final</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Diferencia</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Cuadre</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Aprovechamiento</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Acción</th>
              </tr>
            </thead>
            <tbody>
              {registeredDays.map(({ day, calculation }) => {
                const isBalanced = calculation.status === 'BALANCED'
                const isClosed = day.status === 'CLOSED'
                const yieldStatus = getYieldStatus(calculation.performance.percent)
                const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
                const rowAccentClass = !isClosed
                  ? 'before:bg-amber-500'
                  : isBalanced
                    ? 'before:bg-emerald-500'
                    : 'before:bg-rose-500'

                return (
                  <tr
                    key={day.id}
                    className="bg-white hover:bg-brand-50/35"
                  >
                    <th
                      scope="row"
                      className={`relative px-3 py-3 text-center align-middle before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] ${rowAccentClass}`}
                    >
                      <span className="flex w-full flex-col items-center justify-center text-center">
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
                      </span>
                    </th>
                    <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
                      <QuantityValue value={day.declaredRawMaterialKg100} />
                    </td>
                    <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-950">
                      <QuantityValue value={calculation.declaredFinishedKg100} />
                    </td>
                    <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
                      <QuantityValue value={calculation.newClosingBalanceKg100} />
                    </td>
                    <td
                      className={`number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold ${
                        isBalanced ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      <QuantityValue value={calculation.differenceKg100} />
                    </td>
                    <td className="px-3 py-3 text-center align-middle">
                      <div className="flex w-full items-center justify-center">
                        <StatusBadge tone={!isClosed ? 'warning' : isBalanced ? 'success' : 'danger'}>
                          {!isClosed ? 'BORRADOR' : isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                        </StatusBadge>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle">
                      <div
                        className="flex w-full flex-col items-center justify-center gap-1 text-center"
                        title={`${formatRatioAsPercent(calculation.performance.ratio)} · ${yieldStatus.label}: ${yieldStatus.interpretation}`}
                        aria-label={`Aprovechamiento ${formatRatioAsPercent(calculation.performance.ratio)}. Estado ${yieldStatus.label}. ${yieldStatus.interpretation}`}
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
                    <td className="px-3 py-3 text-center align-middle">
                      <div className="flex w-full items-center justify-center">
                        <ActionLink
                          to={isClosed || activeWeekState.isReadOnly ? `/jornadas/${day.date}` : `/jornadas/${day.date}/editar`}
                          variant="ghost"
                          size="sm"
                        >
                          {isClosed || activeWeekState.isReadOnly ? 'Ver detalle' : 'Continuar'}
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </ActionLink>
                      </div>
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
