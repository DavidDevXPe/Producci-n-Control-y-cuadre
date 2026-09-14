import { CheckCircle2, PackageCheck, Scale, Snowflake } from 'lucide-react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { calculateFreezingComparison, type FreezingComparisonRow } from '../model/freezing'
import type { ProductionDay, WeeklySummaryPeriod } from '../model/types'

interface ProductionComparisonViewProps {
  weekNumber: number
  period: WeeklySummaryPeriod
  productionDays: readonly ProductionDay[]
  packingClosed: boolean
  freezingClosed: boolean
  selector: React.ReactNode
}

function ComparisonTable({
  title,
  rows,
}: {
  title: string
  rows: readonly FreezingComparisonRow[]
}) {
  return (
    <SectionCard title={title} description="Envasado = Congelado atribuible + Pendiente + Diferencia no explicada.">
      <DataTableScroll label={title}>
        <table className="erp-table w-full min-w-[56rem] table-fixed border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th className="w-[42%] px-4 py-2.5 text-left">{title.includes('familia') ? 'Familia' : 'Producto'}</th>
              <th className="px-3 py-2.5 text-center">Envasado</th>
              <th className="px-3 py-2.5 text-center">Congelado</th>
              <th className="px-3 py-2.5 text-center">Pendiente</th>
              <th className="px-3 py-2.5 text-center">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-800">{row.label}</th>
                <td className="number-tabular px-3 py-3 text-center text-xs">{formatCentiKg(row.packedKg100)}</td>
                <td className="number-tabular px-3 py-3 text-center text-xs">{formatCentiKg(row.frozenKg100)}</td>
                <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-amber-700">{formatCentiKg(row.pendingKg100)}</td>
                <td className={`number-tabular px-3 py-3 text-center text-xs font-bold ${row.unexplainedDifferenceKg100 === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCentiKg(row.unexplainedDifferenceKg100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}

export function ProductionComparisonView({
  weekNumber,
  period,
  productionDays,
  packingClosed,
  freezingClosed,
  selector,
}: ProductionComparisonViewProps) {
  const comparison = calculateFreezingComparison(productionDays, period)
  const cycleClosed =
    packingClosed && freezingClosed && comparison.status === 'BALANCED'

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reportes · Ciclo productivo"
        title="Envasado vs Congelamiento"
        description={`Semana ${weekNumber} · Comparación por origen productivo, no solamente por fecha física.`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={packingClosed ? 'success' : 'info'}>
              ENVASADO {packingClosed ? 'CERRADO' : 'ABIERTO'}
            </StatusBadge>
            <StatusBadge tone={freezingClosed ? 'success' : 'info'}>
              CONGELAMIENTO {freezingClosed ? 'CERRADO' : 'ABIERTO'}
            </StatusBadge>
            <StatusBadge tone={comparison.status === 'BALANCED' ? 'success' : 'danger'}>
              {cycleClosed
                ? 'CICLO CERRADO'
                : comparison.status === 'BALANCED'
                  ? 'CONCILIADO'
                  : 'REVISAR'}
            </StatusBadge>
          </div>
        }
      />
      {selector}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Comparativo entre procesos">
        <MetricCard label="Envasado semanal" value={formatCentiKg(comparison.packedKg100)} icon={<PackageCheck className="size-5" />} tone="brand" />
        <MetricCard label="Congelado atribuible" value={formatCentiKg(comparison.frozenKg100)} icon={<Snowflake className="size-5" />} />
        <MetricCard label="Pendiente de congelar" value={formatCentiKg(comparison.pendingKg100)} icon={<Scale className="size-5" />} tone="warning" />
        <MetricCard label="Diferencia no explicada" value={formatCentiKg(comparison.unexplainedDifferenceKg100)} icon={<CheckCircle2 className="size-5" />} tone={comparison.status === 'BALANCED' ? 'success' : 'danger'} />
      </section>
      <ComparisonTable title="Comparativo por familia" rows={comparison.byFamily} />
      <ComparisonTable title="Comparativo por producto" rows={comparison.byProduct} />
    </div>
  )
}
