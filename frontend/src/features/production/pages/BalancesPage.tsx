import { Boxes, CalendarClock, CheckCircle2, Layers3 } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import {
  WEEK_36_2026_PRODUCTION_DAYS,
  WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
} from '../data/week36'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  sumKg100,
} from '../model/calculations'

const productionDays = WEEK_36_2026_PRODUCTION_DAYS
const outstandingPositions = calculateOutstandingBalances(
  productionDays,
  WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
).filter((position) => position.pendingKg100 > 0)
const outstandingByOrigin = productionDays.flatMap((day) => {
  const positions = outstandingPositions.filter(
    (position) => position.originDayId === day.id,
  )

  return positions.length > 0
    ? [{ day, calculation: calculateProductionDay(day), positions }]
    : []
})
const totalPendingKg100 = sumKg100(
  outstandingPositions.map((position) => position.pendingKg100),
)
const pendingProductCount = new Set(
  outstandingPositions.map((position) => position.productId),
).size

export function BalancesPage() {
  usePageTitle('Saldos de producción')
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Producción"
        title="Saldos"
        description="Producto pendiente identificado por familia, producto y jornada de origen."
      />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de saldos">
        <MetricCard
          label="Saldo total pendiente"
          value={formatCentiKg(totalPendingKg100)}
          icon={<Boxes className="size-5" />}
          tone="brand"
        />
        <MetricCard label="Productos pendientes" value={pendingProductCount} icon={<Layers3 className="size-5" />} />
        <MetricCard label="Jornadas de origen" value={outstandingByOrigin.length} icon={<CalendarClock className="size-5" />} />
      </section>

      {outstandingByOrigin.map(({ day, calculation, positions }) => (
        <BalancePanel
          key={day.id}
          products={calculation.products}
          originDate={day.date}
          positions={positions}
          view="outstanding"
        />
      ))}

      {outstandingByOrigin.length === 0 ? (
        <SectionCard contentClassName="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-bold text-slate-950">
              Sin saldos pendientes
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
              Los saldos generados de miércoles a sábado cuentan con un consumo
              posterior registrado. El saldo del sábado fue envasado completamente
              el domingo.
            </p>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}

export default BalancesPage
