import {
  ArrowRight,
  Boxes,
  CalendarCheck2,
  CheckCircle2,
  Gauge,
  PackageCheck,
  Scale,
  Waves,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatCentiKg,
  formatIsoDate,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { WEEK_36_2026_PERIOD } from '../data/week36'
import { calculateProductionDay, calculateWeeklySummary } from '../model/calculations'

const dayCalculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
const weekSummary = calculateWeeklySummary(
  [WEDNESDAY_PRODUCTION_DAY],
  WEEK_36_2026_PERIOD,
)

export function DashboardPage() {
  usePageTitle('Dashboard')
  const isBalanced = dayCalculation.status === 'BALANCED'
  const isWeekValid = weekSummary.status === 'VALID'
  const isPerformanceOnReference =
    dayCalculation.performance.status === 'AT_OR_ABOVE_REFERENCE'
  const pendingProductCount = dayCalculation.products.filter(
    (product) => product.newClosingBalanceKg100 > 0,
  ).length

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Vista operativa"
        title="Control de producción"
        description="Seguimiento del último cierre disponible y consistencia de la semana en curso."
        actions={
          <>
            <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
              {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
            </StatusBadge>
            <ActionLink to={`/jornadas/${WEDNESDAY_PRODUCTION_DAY.date}`}>
              Ver jornada
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          </>
        }
      />

      <section aria-label="Indicadores principales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Producto terminado"
          value={formatCentiKg(dayCalculation.declaredFinishedKg100)}
          icon={<PackageCheck className="size-5" />}
          tone="brand"
          description={formatIsoDate(WEDNESDAY_PRODUCTION_DAY.date)}
        />
        <MetricCard
          label="Saldo final"
          value={formatCentiKg(dayCalculation.newClosingBalanceKg100)}
          icon={<Boxes className="size-5" />}
          description={`${pendingProductCount} productos pendientes`}
        />
        <MetricCard
          label="Diferencia de cuadre"
          value={formatCentiKg(dayCalculation.differenceKg100)}
          icon={<Scale className="size-5" />}
          tone={isBalanced ? 'success' : 'danger'}
          description={isBalanced ? 'CUADRADO · Detalle y total coinciden' : 'NO CUADRADO · Requiere revisión'}
        />
        <MetricCard
          label="Rendimiento"
          value={formatRatioAsPercent(dayCalculation.performance.ratio)}
          icon={<Gauge className="size-5" />}
          tone={isPerformanceOnReference ? 'success' : 'warning'}
          description="Referencia operativa: 80%"
        />
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard
          title="Última jornada registrada"
          description="Miércoles es la fuente operativa validada para este MVP."
          contentClassName="p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <CalendarCheck2 className="size-4.5" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold uppercase tracking-[0.04em] text-slate-950">
                {formatIsoWeekday(WEDNESDAY_PRODUCTION_DAY.date)}{' '}
                <span className="number-tabular text-slate-600">
                  {formatIsoDateCompact(WEDNESDAY_PRODUCTION_DAY.date)}
                </span>
              </h2>
            </div>
            <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
              {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
            </StatusBadge>
          </div>

          <dl className="mt-4 grid divide-y divide-slate-200 rounded-lg bg-slate-50 ring-1 ring-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              ['Día', dayCalculation.day.ownProductionKg100],
              ['Noche', dayCalculation.night.ownProductionKg100],
              ['Tratamiento', dayCalculation.treatmentKg100],
            ].map(([label, value]) => (
              <div key={String(label)} className="min-w-0 px-3 py-2.5 sm:px-4">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                  {String(label)}
                </dt>
                <dd className="number-tabular mt-1 whitespace-nowrap text-xs font-bold text-slate-900 sm:text-sm">
                  {formatCentiKg(value as number)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-2 flex justify-end">
            <ActionLink
              to={`/jornadas/${WEDNESDAY_PRODUCTION_DAY.date}`}
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
          contentClassName="p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 place-items-center rounded-lg ${
                isWeekValid
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <StatusBadge tone={isWeekValid ? 'success' : 'danger'}>
                {isWeekValid ? 'INFORMACIÓN CONSISTENTE' : 'REVISAR INFORMACIÓN'}
              </StatusBadge>
              <p className="number-tabular mt-2 text-sm font-bold text-slate-800">
                Diferencia: {formatCentiKg(weekSummary.differenceKg100)}
              </p>
            </div>
          </div>
          <ActionLink to="/resumen" variant="ghost" size="sm" className="mt-3 -ml-3">
            Revisar resumen de la semana
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </SectionCard>
      </div>

      <section
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-panel sm:flex sm:items-center sm:gap-4"
        aria-labelledby="quick-access-title"
      >
        <h2
          id="quick-access-title"
          className="shrink-0 text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-slate-500"
        >
          Accesos rápidos
        </h2>
        <nav className="mt-2 grid min-w-0 flex-1 gap-1 sm:mt-0 sm:grid-cols-3" aria-label="Accesos operativos">
          {[
            { to: '/jornadas', icon: CalendarCheck2, title: 'Jornadas' },
            { to: '/saldos', icon: Waves, title: 'Saldos' },
            { to: '/resumen', icon: CheckCircle2, title: 'Resumen semanal' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex min-h-10 min-w-0 items-center gap-2 rounded-lg px-2.5 text-sm font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-800"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <ArrowRight className="size-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden="true" />
              </Link>
            )
          })}
        </nav>
      </section>
    </div>
  )
}
