import { ChevronDown, ChevronRight, Info, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { Kg100, ProductReconciliation } from '../model/types'

interface ProductionBreakdownProps {
  products: readonly ProductReconciliation[]
}

interface ProductGroup {
  familyId: string
  familyName: string
  products: readonly ProductReconciliation[]
}

function sumField(
  products: readonly ProductReconciliation[],
  selector: (product: ProductReconciliation) => number,
): Kg100 {
  return products.reduce((total, product) => total + selector(product), 0) as Kg100
}

export function ProductionBreakdown({ products }: ProductionBreakdownProps) {
  const groups = useMemo<readonly ProductGroup[]>(() => {
    const grouped = new Map<string, ProductGroup>()

    for (const product of products) {
      const current = grouped.get(product.familyId)
      grouped.set(product.familyId, {
        familyId: product.familyId,
        familyName: product.familyName,
        products: current ? [...current.products, product] : [product],
      })
    }

    return [...grouped.values()]
  }, [products])

  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    () => new Set(groups.map((group) => group.familyId)),
  )
  const [query, setQuery] = useState('')
  const hasReconciledShiftBreakdown = products.some(
    (product) => product.shiftBreakdownConfidence === 'RECONCILED_INFERENCE',
  )
  const normalizedQuery = query.trim().toLocaleLowerCase('es')

  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          products: normalizedQuery
            ? group.products.filter(
                (product) =>
                  product.productName.toLocaleLowerCase('es').includes(normalizedQuery) ||
                  product.familyName.toLocaleLowerCase('es').includes(normalizedQuery),
              )
            : group.products,
        }))
        .filter((group) => group.products.length > 0),
    [groups, normalizedQuery],
  )

  const toggleFamily = (familyId: string) => {
    setExpandedFamilies((current) => {
      const next = new Set(current)
      if (next.has(familyId)) next.delete(familyId)
      else next.add(familyId)
      return next
    })
  }

  return (
    <SectionCard
      title="Detalle por familia y producto"
      description={`${products.length} productos con movimiento en la jornada.`}
      action={
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Buscar familia o producto</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white"
          />
        </label>
      }
    >
      {hasReconciledShiftBreakdown ? (
        <div className="flex items-start gap-3 border-b border-slate-200 bg-sky-50 px-5 py-4 text-sm leading-5 text-sky-950 sm:px-6">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Los totales de Día y Noche son explícitos. El reparto por producto fue
            reconstruido para conciliar esos totales porque los sumandos de la hoja
            MIÉRCOLES no identifican el turno.
          </p>
        </div>
      ) : null}
      <div className="scrollbar-subtle overflow-x-auto">
        <table className="w-full min-w-[92rem] border-collapse text-left">
          <caption className="sr-only">
            Producción del miércoles agrupada por familia y producto
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
              <th scope="col" rowSpan={2} className="px-5 py-3.5 align-bottom sm:px-6">
                Familia / producto
              </th>
              <th scope="colgroup" colSpan={3} className="border-l border-slate-200 px-3 py-2 text-center">
                Turno Día
              </th>
              <th scope="colgroup" colSpan={3} className="border-l border-slate-200 px-3 py-2 text-center">
                Turno Noche
              </th>
              <th scope="colgroup" colSpan={5} className="border-l border-slate-200 px-3 py-2 text-center">
                Cuadre
              </th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-slate-500">
              <th scope="col" className="border-l border-slate-200 px-3 py-2.5 text-right">Reportado</th>
              <th scope="col" className="px-3 py-2.5 text-right">Saldo ant.</th>
              <th scope="col" className="px-3 py-2.5 text-right">Propio</th>
              <th scope="col" className="border-l border-slate-200 px-3 py-2.5 text-right">Reportado</th>
              <th scope="col" className="px-3 py-2.5 text-right">Saldo ant.</th>
              <th scope="col" className="px-3 py-2.5 text-right">Propio</th>
              <th scope="col" className="border-l border-slate-200 px-3 py-2.5 text-right">Ajustes</th>
              <th scope="col" className="px-3 py-2.5 text-right">Tratamiento</th>
              <th scope="col" className="px-3 py-2.5 text-right">Saldo final</th>
              <th scope="col" className="px-3 py-2.5 text-right">P. terminado</th>
              <th scope="col" className="px-5 py-2.5 text-right sm:px-6">Diferencia</th>
            </tr>
          </thead>
          {filteredGroups.map((group) => {
            const isExpanded = normalizedQuery.length > 0 || expandedFamilies.has(group.familyId)
            const subtotal = (selector: (product: ProductReconciliation) => number) =>
              formatCentiKg(sumField(group.products, selector))
            const groupDifferenceKg100 = sumField(
              group.products,
              (product) => product.differenceKg100,
            )

            return (
              <tbody key={group.familyId} className="border-b border-slate-200 last:border-0">
                <tr className="bg-brand-50/55">
                  <th scope="rowgroup" className="px-5 py-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => toggleFamily(group.familyId)}
                      className="flex max-w-lg items-center gap-2 text-left text-sm font-extrabold text-brand-950 hover:text-brand-700"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                      )}
                      {group.familyName}
                      <span className="rounded-full bg-white px-2 py-0.5 text-[0.6875rem] text-slate-500 ring-1 ring-slate-200">
                        {group.products.length}
                      </span>
                    </button>
                  </th>
                  <td className="number-tabular border-l border-brand-100 px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.day.reportedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.day.previousBalanceProcessedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.day.ownProductionKg100)}
                  </td>
                  <td className="number-tabular border-l border-brand-100 px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.night.reportedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.night.previousBalanceProcessedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.night.ownProductionKg100)}
                  </td>
                  <td className="number-tabular border-l border-brand-100 px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal(
                      (product) =>
                        product.day.adjustmentKg100 + product.night.adjustmentKg100,
                    )}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.treatmentKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
                    {subtotal((product) => product.newClosingBalanceKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-extrabold text-slate-950">
                    {subtotal((product) => product.declaredFinishedKg100)}
                  </td>
                  <td
                    className={`number-tabular px-5 py-3 text-right text-xs font-bold sm:px-6 ${
                      groupDifferenceKg100 === 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {formatCentiKg(groupDifferenceKg100)}
                  </td>
                </tr>
                {isExpanded
                  ? group.products.map((product) => (
                      <tr key={product.productId} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <th scope="row" className="max-w-xl px-5 py-3 pl-11 text-xs font-semibold leading-5 text-slate-700 sm:px-6 sm:pl-12">
                          {product.productName}
                        </th>
                        <td className="number-tabular border-l border-slate-100 px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.day.reportedKg100)}
                        </td>
                        <td className="number-tabular px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.day.previousBalanceProcessedKg100)}
                        </td>
                        <td className="number-tabular px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.day.ownProductionKg100)}
                        </td>
                        <td className="number-tabular border-l border-slate-100 px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.night.reportedKg100)}
                        </td>
                        <td className="number-tabular px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.night.previousBalanceProcessedKg100)}
                        </td>
                        <td className="number-tabular px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.night.ownProductionKg100)}
                        </td>
                        <td className="number-tabular border-l border-slate-100 px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(
                            (product.day.adjustmentKg100 +
                              product.night.adjustmentKg100) as Kg100,
                          )}
                        </td>
                        <td className="number-tabular px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.treatmentKg100)}
                        </td>
                        <td className="number-tabular px-3 py-3 text-right text-xs text-slate-600">
                          {formatCentiKg(product.newClosingBalanceKg100)}
                        </td>
                        <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-900">
                          {formatCentiKg(product.declaredFinishedKg100)}
                        </td>
                        <td
                          className={`number-tabular px-5 py-3 text-right text-xs font-bold sm:px-6 ${
                            product.differenceKg100 === 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatCentiKg(product.differenceKg100)}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            )
          })}
        </table>
      </div>
      {filteredGroups.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-slate-500">
          No se encontraron productos para “{query}”.
        </p>
      ) : null}
    </SectionCard>
  )
}
