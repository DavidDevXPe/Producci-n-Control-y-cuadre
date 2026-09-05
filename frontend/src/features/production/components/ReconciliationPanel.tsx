import { CheckCircle2, Equal, Scale, TriangleAlert } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionDayCalculation, ShiftCalculation } from '../model/types'

interface ReconciliationPanelProps {
  calculation: ProductionDayCalculation
}

interface CalculationRowProps {
  label: string
  value: number
  emphasized?: boolean
  muted?: boolean
}

function CalculationRow({ label, value, emphasized, muted }: CalculationRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-2.5 ${
        emphasized ? 'font-extrabold text-slate-950' : muted ? 'text-slate-500' : 'text-slate-700'
      }`}
    >
      <span className="text-sm">{label}</span>
      <span className="number-tabular shrink-0 text-sm">{formatCentiKg(value)}</span>
    </div>
  )
}

interface ShiftEquationProps {
  label: string
  calculation: ShiftCalculation
}

function ShiftEquation({ label, calculation }: ShiftEquationProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-brand-700">
        Turno {label}
      </p>
      <div className="mt-2 divide-y divide-slate-100">
        <CalculationRow label="Reporte físico" value={calculation.reportedKg100} />
        <CalculationRow label="Ajustes explícitos" value={calculation.adjustmentKg100} muted />
        <CalculationRow
          label="Saldo anterior procesado"
          value={calculation.previousBalanceProcessedKg100}
          muted
        />
        <CalculationRow
          label="Producción propia"
          value={calculation.ownProductionKg100}
          emphasized
        />
      </div>
      <p className="mt-2 text-[0.6875rem] leading-5 text-slate-500">
        Reporte + ajustes − saldo anterior procesado
      </p>
    </div>
  )
}

export function ReconciliationPanel({ calculation }: ReconciliationPanelProps) {
  const isBalanced = calculation.status === 'BALANCED'

  return (
    <SectionCard
      title="Cuadre de producción"
      description="Validación matemática independiente del rendimiento."
      action={
        <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
          {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
        </StatusBadge>
      }
      className="h-full"
      contentClassName="p-5 sm:p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ShiftEquation label="Día" calculation={calculation.day} />
        <ShiftEquation label="Noche" calculation={calculation.night} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
        <div>
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
            Producción procesada
          </p>
          <CalculationRow label="Turno Día" value={calculation.day.ownProductionKg100} />
          <CalculationRow label="Turno Noche" value={calculation.night.ownProductionKg100} />
          <CalculationRow label="Tratamiento" value={calculation.treatmentKg100} />
          <div className="mt-1 border-t border-slate-200">
            <CalculationRow
              label="Subtotal procesado"
              value={
                calculation.ownTurnProductionKg100 + calculation.treatmentKg100
              }
              emphasized
            />
          </div>
        </div>

        <Equal className="mx-auto hidden size-5 text-slate-300 xl:block" aria-hidden="true" />

        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <CalculationRow
            label="Producto terminado"
            value={calculation.declaredFinishedKg100}
            emphasized
          />
          <CalculationRow
            label="Saldo final calculado"
            value={calculation.calculatedClosingBalanceKg100}
          />
          <CalculationRow
            label="Saldo final declarado"
            value={calculation.newClosingBalanceKg100}
          />
          <div className="mt-1 border-t border-slate-200">
            <CalculationRow label="Diferencia" value={calculation.differenceKg100} emphasized />
          </div>
        </div>
      </div>

      <div
        className={`mt-5 flex items-start gap-3 rounded-xl p-4 text-sm ${
          isBalanced
            ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
            : 'bg-rose-50 text-rose-900 ring-1 ring-rose-200'
        }`}
        aria-live="polite"
      >
        {isBalanced ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Scale className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        )}
        <p>
          {isBalanced
            ? 'El saldo declarado coincide con el saldo calculado producto por producto.'
            : 'Existe una diferencia que debe revisarse por familia, producto y turno.'}
        </p>
      </div>

      {calculation.integrityIssues.length > 0 ? (
        <div className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-950 ring-1 ring-rose-200">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-extrabold">
              Validaciones de integridad ({calculation.integrityIssues.length})
            </h3>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-5">
            {calculation.integrityIssues.map((issue, index) => (
              <li key={`${issue.code}-${issue.productId ?? 'day'}-${index}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-bold text-brand-800">Ver cálculo</summary>
        <p className="mt-2 leading-6">
          Saldo calculado = Producto terminado − Día − Noche − Tratamiento. La
          diferencia compara ese resultado con el saldo final declarado.
        </p>
      </details>
    </SectionCard>
  )
}
