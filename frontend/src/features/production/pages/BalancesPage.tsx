import { Boxes, CalendarClock, CheckCircle2, Layers3 } from 'lucide-react'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { ProcessSelector } from '../components/ProcessSelector'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { FreezingBalancesPanel } from '../components/FreezingBalancesPanel'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  sumKg100,
} from '../model/calculations'
import { calculateFreezingAvailability } from '../model/freezing'
import { isPackingProductionDay, isProductionProcess } from '../model/productionProcess'
import { useProductionData } from '../state/ProductionDataContext'

export function BalancesPage() {
  usePageTitle('Saldos de producción')
  const {
    activeWeekNumber,
    activeProcess,
    allProductionDays,
    getWeekView,
    setActiveProcess,
    subsequentBalanceLots,
  } = useProductionData()
  const [searchParams, setSearchParams] = useSearchParams()
  const processParam = searchParams.get('process')
  const selectedProcess = isProductionProcess(processParam)
    ? processParam
    : activeProcess
  const activeWeek = getWeekView(activeWeekNumber, selectedProcess)
  useEffect(() => {
    if (selectedProcess !== activeProcess) setActiveProcess(selectedProcess)
  }, [activeProcess, selectedProcess, setActiveProcess])
  const isFreezing = selectedProcess === 'FREEZING'
  const productionDays = allProductionDays.filter(
    (day) =>
      isPackingProductionDay(day) &&
      day.date <= activeWeek.period.endDate,
  )
  const outstandingPositions = calculateOutstandingBalances(
    productionDays,
    subsequentBalanceLots,
  ).filter((position) => position.pendingKg100 > 0)
  const freezingPositions = calculateFreezingAvailability(
    allProductionDays,
    activeWeek.period.endDate,
  ).filter((position) => position.pendingKg100 > 0)
  const outstandingByOrigin = productionDays.flatMap((day) => {
    const positions = outstandingPositions.filter(
      (position) => position.originDayId === day.id,
    )

    return positions.length > 0
      ? [{ day, calculation: calculateProductionDay(day), positions }]
      : []
  })
  const totalPendingKg100 = sumKg100(
    (isFreezing ? freezingPositions : outstandingPositions).map(
      (position) => position.pendingKg100,
    ),
  )
  const pendingProductCount = new Set(
    (isFreezing ? freezingPositions : outstandingPositions).map(
      (position) => position.productId,
    ),
  ).size
  const originCount = new Set(
    (isFreezing ? freezingPositions : outstandingPositions).map(
      (position) => position.originDayId,
    ),
  ).size

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Producción"
        title="Saldos"
        description={
          isFreezing
            ? `Producto envasado pendiente de congelar al cierre de la semana ${activeWeek.number}.`
            : `Posición acumulada al cierre de la semana ${activeWeek.number}, identificada por producto y jornada de origen.`
        }
      />

      <ProcessSelector
        value={selectedProcess}
        onChange={(process) => {
          if (process !== 'COMPARISON') {
            setActiveProcess(process)
            setSearchParams({ process }, { replace: true })
          }
        }}
      />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de saldos">
        <MetricCard
          label={isFreezing ? 'Pendiente de congelar' : 'Saldo total pendiente'}
          value={formatCentiKg(totalPendingKg100)}
          icon={<Boxes className="size-5" />}
          tone="brand"
        />
        <MetricCard label="Productos pendientes" value={pendingProductCount} icon={<Layers3 className="size-5" />} />
        <MetricCard label="Jornadas de origen" value={originCount} icon={<CalendarClock className="size-5" />} />
      </section>

      {!isFreezing ? outstandingByOrigin.map(({ day, calculation, positions }) => (
        <BalancePanel
          key={day.id}
          products={calculation.products}
          originDate={day.date}
          positions={positions}
          view="outstanding"
        />
      )) : freezingPositions.length > 0 ? (
        <FreezingBalancesPanel positions={freezingPositions} />
      ) : null}

      {(isFreezing ? freezingPositions.length : outstandingByOrigin.length) === 0 ? (
        <SectionCard contentClassName="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-bold text-slate-950">
              {isFreezing ? 'Sin producto pendiente de congelar' : 'Sin saldos pendientes'}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
              {isFreezing
                ? 'No existe producto envasado pendiente hasta la fecha consultada.'
                : activeWeek.isClosed
                ? 'El saldo del sábado fue envasado completamente el domingo y los demás saldos cuentan con un consumo posterior registrado.'
                : 'No existen posiciones abiertas hasta la fecha consultada. Los saldos permanecen vinculados a su jornada de origen hasta que registres su procesamiento real.'}
            </p>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}

export default BalancesPage
