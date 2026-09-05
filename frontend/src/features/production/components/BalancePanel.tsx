import { ArrowRight, Boxes, Clock3 } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import type { Kg100, ProductReconciliation } from '../model/types'

interface BalancePanelProps {
  products: readonly ProductReconciliation[]
  originDate: string
}

export function BalancePanel({ products, originDate }: BalancePanelProps) {
  const balances = products.filter((product) => product.newClosingBalanceKg100 > 0)
  const total = balances.reduce(
    (sum, product) => sum + product.newClosingBalanceKg100,
    0,
  ) as Kg100

  return (
    <SectionCard
      title="Saldo final por producto"
      description="Producto pendiente que conserva esta jornada como origen."
      action={<StatusBadge tone="info">{balances.length} productos</StatusBadge>}
    >
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-100 text-brand-800">
              <Boxes className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Generado el {formatIsoDate(originDate)}
              </p>
              <p className="number-tabular mt-1 text-2xl font-black text-slate-950">
                {formatCentiKg(total)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            <Clock3 className="size-4 text-brand-600" aria-hidden="true" />
            Sin consumos posteriores registrados
          </div>
        </div>
      </div>

      <div className="scrollbar-subtle overflow-x-auto">
        <table className="w-full min-w-[50rem] border-collapse text-left">
          <caption className="sr-only">Detalle del saldo final por producto</caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
              <th scope="col" className="px-5 py-3.5 sm:px-6">Familia y producto</th>
              <th scope="col" className="px-3 py-3.5 text-right">Generado</th>
              <th scope="col" className="px-3 py-3.5 text-right">Procesado Día</th>
              <th scope="col" className="px-3 py-3.5 text-right">Procesado Noche</th>
              <th scope="col" className="px-5 py-3.5 text-right sm:px-6">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((product) => (
              <tr key={product.productId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                <th scope="row" className="max-w-xl px-5 py-3.5 sm:px-6">
                  <span className="block text-[0.6875rem] font-extrabold uppercase tracking-wide text-brand-700">
                    {product.familyName}
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-700">
                    {product.productName}
                  </span>
                </th>
                <td className="number-tabular px-3 py-3.5 text-right text-xs font-semibold text-slate-700">
                  {formatCentiKg(product.newClosingBalanceKg100)}
                </td>
                <td className="number-tabular px-3 py-3.5 text-right text-xs text-slate-400">0.00 kg</td>
                <td className="number-tabular px-3 py-3.5 text-right text-xs text-slate-400">0.00 kg</td>
                <td className="number-tabular px-5 py-3.5 text-right text-xs font-extrabold text-brand-800 sm:px-6">
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                    {formatCentiKg(product.newClosingBalanceKg100)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

