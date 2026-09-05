import {
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarCheck2,
  CheckCircle2,
  Cog,
  Gauge,
  Moon,
  PackageCheck,
  Scale,
  Sun,
  Waves,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatCentiKg,
  formatCentiKgValue,
  formatIsoDate,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import {
  WEEK_36_2026_PERIOD,
  WEEK_36_2026_PRODUCTION_DAYS,
} from '../data/week36'
import { calculateProductionDay, calculateWeeklySummary } from '../model/calculations'

const industrialBackgroundUrl = `${import.meta.env.BASE_URL}brand/trabunda-industrial-bg.png`
const productionDays = WEEK_36_2026_PRODUCTION_DAYS
const calculatedDays = productionDays.map((day) => ({
  day,
  calculation: calculateProductionDay(day),
}))
const latestDay = productionDays.at(-1)!
const latestCalculation = calculateProductionDay(latestDay)
const weekSummary = calculateWeeklySummary(productionDays, WEEK_36_2026_PERIOD)

const weeklyProductionRows = calculatedDays.map(({ day, calculation }) => ({
  day,
  calculation,
  chartTotal:
    calculation.day.ownProductionKg100 +
    calculation.night.ownProductionKg100 +
    calculation.treatmentKg100,
}))
const maximumChartTotal = Math.max(
  ...weeklyProductionRows.map((row) => row.chartTotal),
  1,
)

function segmentWidth(value: number): string {
  return `${(value / maximumChartTotal) * 100}%`
}

export function DashboardPage() {
  usePageTitle('Dashboard')
  const isBalanced = latestCalculation.status === 'BALANCED'
  const isWeekValid = weekSummary.status === 'VALID'
  const isPerformanceOnReference =
    latestCalculation.performance.status === 'AT_OR_ABOVE_REFERENCE'
  const pendingProductCount = latestCalculation.products.filter(
    (product) => product.newClosingBalanceKg100 > 0,
  ).length
  const performancePercent = Math.max(
    0,
    Math.min((latestCalculation.performance.ratio ?? 0) * 100, 100),
  )

  return (
    <div className="space-y-3">
      <section className="relative isolate overflow-hidden" aria-label="Resumen operativo">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[55%] overflow-hidden dark:lg:block"
          aria-hidden="true"
        >
          <img
            src={industrialBackgroundUrl}
            alt=""
            className="dashboard-industrial-asset absolute inset-0 size-full object-cover object-right opacity-0"
          />
          <span className="dashboard-industrial-overlay absolute inset-0" />
        </div>

        <div className="space-y-3">
          <div className="border-l-[3px] border-brand-500 pl-4">
            <PageHeader
              eyebrow="Vista operativa"
              title="Control de producción"
              description="Seguimiento del último cierre disponible y consistencia de la semana en curso."
              actions={
                <>
                  <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
                    {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                  </StatusBadge>
                  <ActionLink
                    to={`/jornadas/${latestDay.date}`}
                    variant="secondary"
                    size="sm"
                  >
                    Ver jornada
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ActionLink>
                </>
              }
            />
          </div>

          <section
            aria-label="Indicadores principales"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="Producto terminado"
              value={formatCentiKgValue(latestCalculation.declaredFinishedKg100)}
              unit="kg"
              icon={<PackageCheck className="size-5" />}
              tone="brand"
              description={formatIsoDate(latestDay.date)}
            />
            <MetricCard
              label="Saldo final"
              value={formatCentiKgValue(latestCalculation.newClosingBalanceKg100)}
              unit="kg"
              icon={<Boxes className="size-5" />}
              description={`${pendingProductCount} productos pendientes`}
            />
            <MetricCard
              label="Diferencia de cuadre"
              value={formatCentiKgValue(latestCalculation.differenceKg100)}
              unit="kg"
              icon={<Scale className="size-5" />}
              tone={isBalanced ? 'success' : 'danger'}
              description={
                isBalanced
                  ? 'CUADRADO · Detalle y total coinciden'
                  : 'NO CUADRADO · Requiere revisión'
              }
            />
            <MetricCard
              label="Rendimiento"
              value={formatRatioAsPercent(latestCalculation.performance.ratio)}
              icon={<Gauge className="size-5" />}
              tone={isPerformanceOnReference ? 'success' : 'warning'}
              description={
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span>Referencia operativa: 80%</span>
                    {!isPerformanceOnReference ? (
                      <span className="font-semibold text-amber-800">Bajo referencia</span>
                    ) : null}
                  </div>
                  <div
                    className="relative h-1.5 overflow-visible rounded-full bg-slate-100"
                    aria-label={`Rendimiento ${formatRatioAsPercent(latestCalculation.performance.ratio)}; referencia 80%`}
                    role="img"
                  >
                    <span
                      className={`block h-full rounded-full ${
                        isPerformanceOnReference ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${performancePercent}%` }}
                    />
                    <span className="absolute -top-1 bottom-[-0.25rem] left-[80%] w-px bg-slate-400" />
                  </div>
                </div>
              }
            />
          </section>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.65fr_1fr]">
        <SectionCard
          title="Última jornada registrada"
          description={formatIsoDate(latestDay.date)}
          action={
            <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
              {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
            </StatusBadge>
          }
          contentClassName="p-3.5 sm:p-4"
        >
          <dl className="grid divide-y divide-slate-200 rounded-lg bg-slate-50 ring-1 ring-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              {
                label: 'Día',
                value: latestCalculation.day.ownProductionKg100,
                icon: Sun,
                iconClassName: 'bg-amber-50 text-amber-800',
              },
              {
                label: 'Noche',
                value: latestCalculation.night.ownProductionKg100,
                icon: Moon,
                iconClassName: 'bg-brand-50 text-brand-800',
              },
              {
                label: 'Tratamiento',
                value: latestCalculation.treatmentKg100,
                icon: Cog,
                iconClassName: 'bg-slate-100 text-slate-600',
              },
            ].map(({ label, value, icon: Icon, iconClassName }) => (
              <div key={label} className="flex min-w-0 items-center gap-3 px-3 py-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${iconClassName}`}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                    {label}
                  </dt>
                  <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-bold text-slate-950">
                    {formatCentiKg(value)}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <div className="mt-1.5 flex justify-end">
            <ActionLink
              to={`/jornadas/${latestDay.date}`}
              variant="ghost"
              size="sm"
            >
              Ver detalle
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          </div>
        </SectionCard>

        <SectionCard
          title="Validación semanal"
          description="Comparación por dos caminos independientes."
          contentClassName="p-3.5 sm:p-4"
        >
          <div className="flex items-start gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                isWeekValid
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}
              aria-hidden="true"
            >
              <CheckCircle2 className="size-5" />
            </span>
            <div className="min-w-0">
              <StatusBadge tone={isWeekValid ? 'success' : 'danger'}>
                {isWeekValid ? 'INFORMACIÓN CONSISTENTE' : 'REVISAR INFORMACIÓN'}
              </StatusBadge>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Diferencia semanal
              </p>
              <p className="number-tabular mt-0.5 text-xl font-bold text-slate-950">
                {formatCentiKg(weekSummary.differenceKg100)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isWeekValid
                  ? 'Los totales por jornada y por producto coinciden.'
                  : 'La comparación independiente detectó diferencias pendientes.'}
              </p>
            </div>
          </div>
          <ActionLink to="/resumen" variant="ghost" size="sm" className="mt-2 -ml-3">
            Revisar resumen de la semana
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </SectionCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Estado de las jornadas"
          description="Jornadas reales registradas en la semana."
        >
          <DataTableScroll label="Estado de las jornadas reales de la semana 36">
            <table className="erp-table w-full min-w-[48rem] border-collapse text-left">
              <caption className="sr-only">Estado operativo de miércoles y jueves</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <th scope="col" className="px-4 py-2">Día</th>
                  <th scope="col" className="px-3 py-2">Fecha</th>
                  <th scope="col" className="px-3 py-2">Estado</th>
                  <th scope="col" className="px-3 py-2 text-right">Producto terminado</th>
                  <th scope="col" className="px-3 py-2 text-right">Saldo</th>
                  <th scope="col" className="px-3 py-2 text-right">Rend.</th>
                  <th scope="col" className="px-4 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {calculatedDays.map(({ day, calculation }) => {
                  const dayIsBalanced = calculation.status === 'BALANCED'
                  const dayIsOnReference =
                    calculation.performance.status === 'AT_OR_ABOVE_REFERENCE'
                  const isLatest = day.date === latestDay.date

                  return (
                    <tr
                      key={day.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/80 ${
                        isLatest ? 'bg-brand-50/35' : 'bg-white'
                      }`}
                    >
                      <th scope="row" className="px-4 py-2.5 text-xs font-semibold text-slate-900">
                        {formatIsoWeekday(day.date)}
                      </th>
                      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                        {formatIsoDateCompact(day.date)}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge tone={dayIsBalanced ? 'success' : 'danger'}>
                          {dayIsBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                        </StatusBadge>
                      </td>
                      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs font-bold text-slate-950">
                        {formatCentiKg(calculation.declaredFinishedKg100)}
                      </td>
                      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs text-slate-700">
                        {formatCentiKg(calculation.newClosingBalanceKg100)}
                      </td>
                      <td
                        className={`number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs font-bold ${
                          dayIsOnReference ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        {formatRatioAsPercent(calculation.performance.ratio)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ActionLink
                          to={`/jornadas/${day.date}`}
                          variant="ghost"
                          size="sm"
                        >
                          Ver
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </ActionLink>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTableScroll>
        </SectionCard>

        <SectionCard
          title="Producción de la semana (kg)"
          description="Día, Noche y Tratamiento por jornada registrada."
          contentClassName="p-4"
        >
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-slate-500">
            {[
              ['Día', 'bg-brand-500'],
              ['Noche', 'bg-brand-800'],
              ['Tratamiento', 'bg-slate-400'],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>

          <div className="space-y-4">
            {weeklyProductionRows.map(({ day, calculation, chartTotal }) => (
              <div
                key={day.id}
                role="img"
                aria-label={`${formatIsoWeekday(day.date)}: Día ${formatCentiKg(calculation.day.ownProductionKg100)}, Noche ${formatCentiKg(calculation.night.ownProductionKg100)}, Tratamiento ${formatCentiKg(calculation.treatmentKg100)}`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">
                    {formatIsoWeekday(day.date)}
                  </span>
                  <span className="number-tabular text-[0.6875rem] font-semibold text-slate-500">
                    {formatCentiKg(chartTotal)}
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-sm bg-slate-100">
                  <span
                    className="h-full bg-brand-500"
                    style={{ width: segmentWidth(calculation.day.ownProductionKg100) }}
                  />
                  <span
                    className="h-full bg-brand-800"
                    style={{ width: segmentWidth(calculation.night.ownProductionKg100) }}
                  />
                  <span
                    className="h-full bg-slate-400"
                    style={{ width: segmentWidth(calculation.treatmentKg100) }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-[0.6875rem] leading-5 text-slate-500">
            Se muestran solamente los cierres reales de miércoles y jueves.
          </p>
        </SectionCard>
      </div>

      <section
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-panel sm:flex sm:items-center sm:gap-4"
        aria-labelledby="quick-access-title"
      >
        <div className="flex shrink-0 items-center gap-2 sm:w-40">
          <BarChart3 className="size-4 text-brand-700" aria-hidden="true" />
          <h2
            id="quick-access-title"
            className="text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-slate-500"
          >
            Accesos rápidos
          </h2>
        </div>
        <nav
          className="mt-2 grid min-w-0 flex-1 sm:mt-0 sm:grid-cols-3"
          aria-label="Accesos operativos"
        >
          {[
            {
              to: '/jornadas',
              icon: CalendarCheck2,
              title: 'Jornadas',
              description: 'Registrar y validar jornadas',
            },
            {
              to: '/saldos',
              icon: Waves,
              title: 'Saldos',
              description: 'Revisar saldos por producto',
            },
            {
              to: '/resumen',
              icon: CheckCircle2,
              title: 'Resumen semanal',
              description: 'Ver consolidado de la semana',
            },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex min-h-12 min-w-0 items-center gap-2.5 px-3 py-1.5 text-slate-700 hover:bg-brand-50 hover:text-brand-800 ${
                  index > 0
                    ? 'border-t border-slate-100 sm:border-l sm:border-t-0'
                    : ''
                }`}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-slate-500">
                    {item.description}
                  </span>
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden="true" />
              </Link>
            )
          })}
        </nav>
      </section>
    </div>
  )
}

export default DashboardPage
