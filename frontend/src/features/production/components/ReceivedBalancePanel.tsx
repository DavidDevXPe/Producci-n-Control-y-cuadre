import { ArrowDownToLine, CheckCircle2, PackageOpen } from 'lucide-react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { calculateBalancePosition } from '../model/calculations'
import type {
  BalanceLot,
  ProductionDay,
  ProductionDayCalculation,
} from '../model/types'

interface ReceivedBalancePanelProps {
  productionDay: ProductionDay
  calculation: ProductionDayCalculation
}

function currentDayLot(lot: BalanceLot, dayId: string): BalanceLot {
  return {
    ...lot,
    uses: lot.uses.filter((use) => use.targetDayId === dayId),
  }
}

export function ReceivedBalancePanel({
  productionDay,
  calculation,
}: ReceivedBalancePanelProps) {
  const productById = new Map(
    productionDay.lines.map((line) => [line.productId, line] as const),
  )
  const lots = productionDay.receivedBalanceLots.map((lot) => ({
    lot,
    position: calculateBalancePosition(currentDayLot(lot, productionDay.id)),
  }))

  return (
    <SectionCard
      title="Saldo recibido de jornadas anteriores"
      description="Cada consumo se vincula al producto, la jornada de origen y el turno que lo procesó."
      action={
        <StatusBadge tone={lots.length > 0 ? 'info' : 'neutral'}>
          {formatCentiKg(calculation.receivedPreviousBalanceKg100)}
        </StatusBadge>
      }
    >
      {lots.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-10 text-center sm:px-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <PackageOpen className="size-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-bold text-slate-900">
            Sin saldo anterior recibido
          </h3>
          <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500">
            En esta jornada no hay lotes anteriores que deban descontarse de los
            reportes físicos de Día o Noche.
          </p>
        </div>
      ) : (
        <>
          <dl className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            {[
              ['Saldo recibido', calculation.receivedPreviousBalanceKg100],
              ['Procesado Día', calculation.day.previousBalanceProcessedKg100],
              ['Procesado Noche', calculation.night.previousBalanceProcessedKg100],
              ['Pendiente', calculation.pendingPreviousBalanceKg100],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <dt className="text-xs font-bold text-slate-500">{String(label)}</dt>
                <dd className="number-tabular mt-1 text-sm font-bold text-slate-950">
                  {formatCentiKg(value as number)}
                </dd>
              </div>
            ))}
          </dl>

          <DataTableScroll label="Saldo anterior recibido y procesado por turno">
            <table className="erp-table w-full min-w-[54rem] border-collapse text-left">
              <caption className="sr-only">Saldo anterior recibido y procesado por turno</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  <th scope="col" className="px-4 py-2.5 sm:px-5">Origen y producto</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Recibido</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Día</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Noche</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Pendiente</th>
                  <th scope="col" className="px-4 py-2.5 text-right sm:px-5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lots.map(({ lot, position }) => {
                  const product = productById.get(lot.productId)
                  return (
                    <tr key={lot.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                      <th scope="row" className="max-w-xl px-4 py-2.5 sm:px-5">
                        <span className="block text-[0.6875rem] font-bold uppercase tracking-wide text-brand-700">
                          Origen: {lot.originDayId}
                        </span>
                        <span
                          className="mt-1 line-clamp-2 text-xs font-medium leading-4 text-slate-700"
                          title={product?.productName ?? lot.productId}
                        >
                          {product?.productName ?? lot.productId}
                        </span>
                      </th>
                      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-slate-700">{formatCentiKg(position.originalKg100)}</td>
                      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs text-slate-600">{formatCentiKg(position.processedDayKg100)}</td>
                      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs text-slate-600">{formatCentiKg(position.processedNightKg100)}</td>
                      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-brand-900">{formatCentiKg(position.pendingKg100)}</td>
                      <td className="px-4 py-2.5 text-right sm:px-5">
                        <StatusBadge tone={position.isValid ? 'success' : 'danger'}>
                          {position.isValid ? 'TRAZABLE' : 'SOBRECONSUMO'}
                        </StatusBadge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTableScroll>

          <div className="flex items-start gap-3 border-t border-slate-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900 sm:px-5">
            {calculation.pendingPreviousBalanceKg100 === 0 ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <ArrowDownToLine className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <p>
              La producción propia se obtiene descontando únicamente el saldo que
              cada turno procesó, nunca el saldo total de forma automática.
            </p>
          </div>
        </>
      )}
    </SectionCard>
  )
}

