import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionDayCalculation } from '../model/types'

export interface WeeklyDayRow {
  label: string
  date: string
  calculation: ProductionDayCalculation | null
}

interface WeeklyDaysTableProps {
  days: readonly WeeklyDayRow[]
  totalKg100: number
}

export function WeeklyDaysTable({ days, totalKg100 }: WeeklyDaysTableProps) {
  return (
    <SectionCard
      title="Producto terminado por jornada"
      description="Las jornadas no registradas permanecen visibles sin inventar cantidades."
    >
      <DataTableScroll label="Producto terminado por jornada de la semana 36">
        <table className="erp-table w-full min-w-[48rem] border-collapse text-left">
          <caption className="sr-only">Producto terminado diario de la semana 36</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th scope="col" className="px-4 py-2.5 sm:px-5">Día</th>
              <th scope="col" className="px-3 py-2.5">Fecha</th>
              <th scope="col" className="px-3 py-2.5 text-right">Producto terminado</th>
              <th scope="col" className="px-4 py-2.5 text-right sm:px-5">Estado</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b border-slate-100 hover:bg-slate-50/80 last:border-0">
                <th scope="row" className="px-4 py-2.5 text-xs font-bold text-slate-800 sm:px-5">
                  {day.label}
                </th>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                  {day.date}
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-slate-800">
                  {day.calculation ? formatCentiKg(day.calculation.declaredFinishedKg100) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right sm:px-5">
                  {day.calculation ? (
                    <StatusBadge
                      tone={day.calculation.status === 'BALANCED' ? 'success' : 'danger'}
                    >
                      {day.calculation.status === 'BALANCED' ? 'CUADRADO' : 'NO CUADRADO'}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">SIN REGISTRO</StatusBadge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <th scope="row" colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-950 sm:px-5">
                Total semanal registrado
              </th>
              <td className="number-tabular whitespace-nowrap px-3 py-3 text-right text-xs font-bold text-slate-950">
                {formatCentiKg(totalKg100)}
              </td>
              <td className="px-4 py-3 text-right sm:px-5">
                <StatusBadge tone="info">PARCIAL</StatusBadge>
              </td>
            </tr>
          </tfoot>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}
