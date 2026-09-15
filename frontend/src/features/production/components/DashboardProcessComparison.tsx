import { ArrowRight, PackageCheck, Snowflake } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { FreezingComparison } from '../model/freezing'

interface DashboardProcessComparisonProps {
  comparison: FreezingComparison
  hasFreezingData: boolean
}

export function DashboardProcessComparison({
  comparison,
  hasFreezingData,
}: DashboardProcessComparisonProps) {
  return (
    <SectionCard
      title="Envasado vs Congelamiento"
      description="Balance por origen productivo de la semana seleccionada."
      action={
        hasFreezingData ? (
          <StatusBadge
            tone={comparison.status === 'BALANCED' ? 'success' : 'danger'}
          >
            {comparison.status === 'BALANCED' ? 'CONCILIADO' : 'REVISAR'}
          </StatusBadge>
        ) : null
      }
      contentClassName="p-4"
    >
      {hasFreezingData ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Envasado', comparison.packedKg100],
            ['Congelado atribuible', comparison.frozenKg100],
            ['Pendiente', comparison.pendingKg100],
            ['Diferencia', comparison.unexplainedDifferenceKg100],
          ].map(([label, value], index) => (
            <div
              key={String(label)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3"
            >
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                {String(label)}
              </p>
              <p
                className={`number-tabular mt-1 whitespace-nowrap text-base font-extrabold ${
                  index === 3 && comparison.unexplainedDifferenceKg100 !== 0
                    ? 'text-rose-700'
                    : index === 2 && comparison.pendingKg100 > 0
                      ? 'text-amber-700'
                      : 'text-slate-950'
                }`}
              >
                {formatCentiKg(value as FreezingComparison['packedKg100'])}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[#2b5268] bg-[#123247] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#2b5268] bg-[#0d2534] text-[#58c8ea]">
              <Snowflake className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#f3f8fb]">
                Aún no hay jornadas de Congelamiento
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[#a5bed0]">
                El comparativo se activará cuando se registre producto congelado.
              </p>
            </div>
          </div>
          <ActionLink to="/jornadas?process=FREEZING" variant="ghost" size="sm" className="text-[#58c8ea] hover:bg-[#153b50] hover:text-[#f3f8fb]">
            <PackageCheck className="size-4" aria-hidden="true" />
            Ver Congelamiento
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </div>
      )}
      {hasFreezingData ? (
        <ActionLink to="/resumen?view=COMPARISON" variant="ghost" size="sm" className="mt-2 -ml-3">
          Ver comparativo completo
          <ArrowRight className="size-4" aria-hidden="true" />
        </ActionLink>
      ) : null}
    </SectionCard>
  )
}
