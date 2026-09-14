import { Snowflake } from 'lucide-react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import type { FreezingAvailabilityPosition } from '../model/freezing'

interface FreezingBalancesPanelProps {
  positions: readonly FreezingAvailabilityPosition[]
}

export function FreezingBalancesPanel({ positions }: FreezingBalancesPanelProps) {
  return (
    <SectionCard
      title="Producto pendiente de congelar"
      description="Cada posición conserva la jornada de Envasado que originó el producto."
      action={<StatusBadge tone="info">{positions.length} LOTES</StatusBadge>}
    >
      <DataTableScroll label="Disponibilidad de Congelamiento por producto y origen">
        <table className="erp-table w-full min-w-[58rem] table-fixed border-collapse text-left">
          <caption className="sr-only">
            Producto envasado, congelado y pendiente por jornada de origen
          </caption>
          <colgroup>
            <col className="w-[39%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th className="px-4 py-2.5">Producto</th>
              <th className="px-3 py-2.5 text-center">Origen Envasado</th>
              <th className="px-3 py-2.5 text-center">Envasado</th>
              <th className="px-3 py-2.5 text-center">Congelado</th>
              <th className="px-3 py-2.5 text-center text-sky-800">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr
                key={`${position.originDayId}|${position.productId}`}
                className="border-b border-slate-100 bg-white hover:bg-sky-50/40"
              >
                <th scope="row" className="px-4 py-3">
                  <span className="block text-[0.625rem] font-bold uppercase tracking-[0.06em] text-sky-700">
                    {position.familyName}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold leading-4 text-slate-800">
                    {position.productName}
                  </span>
                </th>
                <td className="number-tabular px-3 py-3 text-center text-xs text-slate-600">
                  {formatIsoDate(position.originDate)}
                </td>
                <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-slate-800">
                  {formatCentiKg(position.generatedKg100)}
                </td>
                <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-slate-700">
                  {formatCentiKg(position.processedTotalKg100)}
                </td>
                <td className="number-tabular px-3 py-3 text-center text-xs font-bold text-sky-800">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Snowflake className="size-3.5" aria-hidden="true" />
                    {formatCentiKg(position.pendingKg100)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}
