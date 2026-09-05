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

      <section aria-label="Indicadores principales" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          description="13 productos pendientes"
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

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard
          title="Última jornada registrada"
          description="Miércoles es la fuente operativa validada para este MVP."
          contentClassName="p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <CalendarCheck2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-slate-950">
                    {formatIsoDate(WEDNESDAY_PRODUCTION_DAY.date)}
                  </h2>
                  <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
                    {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                  </StatusBadge>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  Día {formatCentiKg(dayCalculation.day.ownProductionKg100)} · Noche{' '}
                  {formatCentiKg(dayCalculation.night.ownProductionKg100)} · Tratamiento{' '}
                  {formatCentiKg(dayCalculation.treatmentKg100)}
                </p>
              </div>
            </div>
            <ActionLink
              to={`/jornadas/${WEDNESDAY_PRODUCTION_DAY.date}`}
              variant="secondary"
              size="sm"
            >
              Abrir detalle
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

      <section className="grid gap-3 md:grid-cols-3" aria-label="Accesos operativos">
        {[
          {
            to: '/jornadas',
            icon: CalendarCheck2,
            title: 'Jornadas',
            text: 'Consulta estados, rendimientos y diferencias diarias.',
          },
          {
            to: '/saldos',
            icon: Waves,
            title: 'Saldos',
            text: 'Rastrea el producto pendiente desde su jornada de origen.',
          },
          {
            to: '/resumen',
            icon: CheckCircle2,
            title: 'Resumen semanal',
            text: 'Valida jornadas contra el consolidado por producto.',
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-panel hover:border-brand-200 hover:bg-brand-50/30"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-900 group-hover:text-brand-800">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                  {item.text}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden="true" />
            </Link>
          )
        })}
      </section>
    </div>
  )
}
