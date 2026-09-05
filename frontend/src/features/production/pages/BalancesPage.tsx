import { Boxes, CalendarClock, Layers3 } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'

const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

export function BalancesPage() {
  usePageTitle('Saldos de producción')
  const productCount = calculation.products.filter(
    (product) => product.newClosingBalanceKg100 > 0,
  ).length

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
          value={formatCentiKg(calculation.newClosingBalanceKg100)}
          icon={<Boxes className="size-5" />}
          tone="brand"
        />
        <MetricCard label="Productos involucrados" value={productCount} icon={<Layers3 className="size-5" />} />
        <MetricCard label="Jornadas de origen" value="1" icon={<CalendarClock className="size-5" />} />
      </section>

      <BalancePanel products={calculation.products} originDate={WEDNESDAY_PRODUCTION_DAY.date} />
    </div>
  )
}

