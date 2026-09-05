import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Moon,
  PackageCheck,
  Scale,
  Sun,
  Waves,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { PerformancePanel } from '../components/PerformancePanel'
import { ProductionBreakdown } from '../components/ProductionBreakdown'
import { ReceivedBalancePanel } from '../components/ReceivedBalancePanel'
import { ReconciliationPanel } from '../components/ReconciliationPanel'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'

const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

export function ProductionDayPage() {
  const { date } = useParams()
  const isKnownDay = date === WEDNESDAY_PRODUCTION_DAY.date
  usePageTitle(isKnownDay ? 'Detalle del miércoles' : 'Jornada no encontrada')

  if (!isKnownDay) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CalendarDays className="mx-auto size-10 text-slate-300" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">Jornada no encontrada</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Todavía no existe información registrada para la fecha solicitada.
        </p>
        <ActionLink
          to="/jornadas"
          className="mt-6"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a jornadas
        </ActionLink>
      </div>
    )
  }

  const isBalanced = calculation.status === 'BALANCED'

  return (
    <div className="space-y-5">
      <Link
        to="/jornadas"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas las jornadas
      </Link>

      <PageHeader
        eyebrow="Detalle de jornada"
        title={formatIsoDate(WEDNESDAY_PRODUCTION_DAY.date)}
        description="Datos reconstruidos exclusivamente desde la hoja MIÉRCOLES y validados producto por producto."
        actions={
          <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
            {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
          </StatusBadge>
        }
      />

      <nav
        aria-label="Secciones de la jornada"
        className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-2"
      >
        <a href="#cuadre" className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:text-brand-800">Cuadre</a>
        <a href="#produccion" className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:text-brand-800">Producción</a>
        <a href="#saldos" className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:text-brand-800">Saldos</a>
      </nav>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores de la jornada">
        <MetricCard
          label="Materia prima"
          value={formatCentiKg(WEDNESDAY_PRODUCTION_DAY.declaredRawMaterialKg100)}
          icon={<Waves className="size-5" />}
          className="xl:col-span-2"
        />
        <MetricCard
          label="Producto terminado"
          value={formatCentiKg(calculation.declaredFinishedKg100)}
          icon={<PackageCheck className="size-5" />}
          tone="brand"
          className="xl:col-span-2"
        />
        <MetricCard
          label="Saldo final"
          value={formatCentiKg(calculation.newClosingBalanceKg100)}
          icon={<Boxes className="size-5" />}
        />
        <MetricCard
          label="Diferencia"
          value={formatCentiKg(calculation.differenceKg100)}
          icon={<Scale className="size-5" />}
          tone={isBalanced ? 'success' : 'danger'}
        />
      </section>

      <section id="cuadre" className="grid scroll-mt-28 gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <ReconciliationPanel calculation={calculation} />
        <PerformancePanel
          calculation={calculation}
          washAuthorization={WEDNESDAY_PRODUCTION_DAY.nucaWashAuthorization}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Producción por turno">
        <MetricCard label="Turno Día" value={formatCentiKg(calculation.day.ownProductionKg100)} icon={<Sun className="size-5" />} />
        <MetricCard label="Turno Noche" value={formatCentiKg(calculation.night.ownProductionKg100)} icon={<Moon className="size-5" />} />
        <MetricCard label="Saldo anterior procesado" value={formatCentiKg(calculation.processedPreviousBalanceKg100)} icon={<Boxes className="size-5" />} />
        <MetricCard label="Tratamiento" value={formatCentiKg(calculation.treatmentKg100)} icon={<Waves className="size-5" />} />
      </section>

      <div id="produccion" className="scroll-mt-28">
        <ProductionBreakdown products={calculation.products} />
      </div>

      <div id="saldos" className="scroll-mt-28 space-y-5">
        <ReceivedBalancePanel
          productionDay={WEDNESDAY_PRODUCTION_DAY}
          calculation={calculation}
        />
        <BalancePanel products={calculation.products} originDate={WEDNESDAY_PRODUCTION_DAY.date} />
      </div>
    </div>
  )
}
