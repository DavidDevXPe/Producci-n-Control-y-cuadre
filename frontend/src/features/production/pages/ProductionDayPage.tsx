import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Download,
  LoaderCircle,
  Moon,
  PackageCheck,
  Pencil,
  Scale,
  Sun,
  Waves,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { FreezingDayDetail } from '../components/FreezingDayDetail'
import { PerformancePanel } from '../components/PerformancePanel'
import { ProductionBreakdown } from '../components/ProductionBreakdown'
import { ReceivedBalancePanel } from '../components/ReceivedBalancePanel'
import { ReconciliationPanel } from '../components/ReconciliationPanel'
import {
  calculateOutstandingBalances,
} from '../model/calculations'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import {
  getProductionProcess,
  isFreezingProductionDay,
  isProductionProcess,
} from '../model/productionProcess'
import { useProductionData } from '../state/ProductionDataContext'

export function ProductionDayPage() {
  const { date } = useParams()
  const [searchParams] = useSearchParams()
  const [exportState, setExportState] = useState<
    'IDLE' | 'EXPORTING' | 'SUCCESS' | 'ERROR'
  >('IDLE')
  const {
    allProductionDays,
    subsequentBalanceLots,
    findProductionDay,
    isUserManagedDay,
  } = useProductionData()
  const processParam = searchParams.get('process')
  const requestedProcess = isProductionProcess(processParam)
    ? processParam
    : undefined
  const productionDay = date ? findProductionDay(date, requestedProcess) : undefined
  usePageTitle(
    productionDay ? `Detalle del ${productionDay.displayName}` : 'Jornada no encontrada',
  )

  if (!productionDay) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CalendarDays className="mx-auto size-10 text-slate-300" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Jornada no encontrada</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Todavía no existe información registrada para la fecha solicitada.
        </p>
        <ActionLink to="/jornadas" className="mt-6">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a jornadas
        </ActionLink>
      </div>
    )
  }

  const operationalState = getProductionDayOperationalState(productionDay)
  const calculation = operationalState.calculation
  const process = getProductionProcess(productionDay)
  const isFreezing = isFreezingProductionDay(productionDay)
  const weeklyBalancePositions = calculateOutstandingBalances(
    allProductionDays,
    subsequentBalanceLots,
  )
  const balancePositions = weeklyBalancePositions.filter(
    (position) => position.originDayId === productionDay.id,
  )
  const isBalanced = operationalState.isBalanced
  const isClosed = operationalState.lifecycle === 'CLOSED'
  const isReadyToClose = operationalState.state === 'READY_TO_CLOSE'
  const isBalanceOnly = isBalanceOnlyProductionDay(productionDay)
  const canExport =
    productionDay.status === 'CLOSED' &&
    isBalanced &&
    calculation.integrityIssues.length === 0
  const sourceSheet = productionDay.lines.at(0)?.source.sheet ?? 'la hoja operativa'

  if (isFreezing) {
    return (
      <FreezingDayDetail
        productionDay={productionDay}
        allProductionDays={allProductionDays}
        canEdit={isUserManagedDay(productionDay.date, process) && !isClosed}
      />
    )
  }

  const handleExport = async () => {
    if (!canExport || exportState === 'EXPORTING') return

    setExportState('EXPORTING')

    try {
      const { exportProductionDayWorkbook } = await import(
        '../export/productionDayWorkbook'
      )
      await exportProductionDayWorkbook(productionDay, calculation)
      setExportState('SUCCESS')
    } catch {
      setExportState('ERROR')
    }
  }

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
        title={formatIsoDate(productionDay.date)}
        description={
          isBalanceOnly
            ? 'Domingo de procesamiento físico vinculado íntegramente a saldos de jornadas anteriores.'
            : `Datos reconstruidos exclusivamente desde la hoja ${sourceSheet} y validados producto por producto.`
        }
        actions={
          <>
            <StatusBadge tone={isClosed ? (isBalanced ? 'success' : 'danger') : isReadyToClose ? 'success' : 'warning'}>
              {isClosed
                ? isBalanced
                  ? 'CERRADA · SOLO LECTURA'
                  : 'CERRADA · REVISAR'
                : isReadyToClose
                  ? 'LISTA PARA CERRAR'
                  : 'BORRADOR · REVISAR'}
            </StatusBadge>
            {isBalanceOnly ? (
              <StatusBadge tone="info">JORNADA DE SALDOS</StatusBadge>
            ) : null}
            {isUserManagedDay(productionDay.date, process) && !isClosed ? (
              <ActionLink
                to={`/jornadas/${productionDay.date}/editar?process=${process}`}
                variant={isReadyToClose ? 'primary' : 'secondary'}
                size="sm"
              >
                <Pencil className="size-4" aria-hidden="true" />
                {isReadyToClose ? 'Cerrar jornada' : 'Continuar captura'}
              </ActionLink>
            ) : null}
            <button
              type="button"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[0.625rem] bg-brand-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              disabled={!canExport || exportState === 'EXPORTING'}
              onClick={handleExport}
              title={
                canExport
                  ? 'Descargar jornada cerrada en formato Excel'
                  : 'Disponible únicamente para jornadas cerradas y cuadradas'
              }
            >
              {exportState === 'EXPORTING' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {exportState === 'EXPORTING' ? 'Generando…' : 'Exportar Excel'}
            </button>
          </>
        }
      />

      <p className="sr-only" role="status" aria-live="polite">
        {exportState === 'SUCCESS'
          ? 'El archivo Excel de la jornada se descargó correctamente.'
          : exportState === 'ERROR'
            ? 'No se pudo generar el archivo Excel. Inténtalo nuevamente.'
            : ''}
      </p>
      {exportState === 'ERROR' ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          No se pudo generar el archivo Excel. Inténtalo nuevamente.
        </div>
      ) : null}

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
          value={formatCentiKg(productionDay.declaredRawMaterialKg100)}
          icon={<Waves className="size-5" />}
          className="xl:col-span-2"
        />
        <MetricCard
          label={isBalanceOnly ? 'Procesado físicamente' : 'Producto terminado'}
          value={
            isBalanceOnly
              ? formatCentiKg(
                  calculation.day.declaredReportedKg100 +
                    calculation.night.declaredReportedKg100,
                )
              : formatCentiKg(calculation.declaredFinishedKg100)
          }
          icon={<PackageCheck className="size-5" />}
          tone="brand"
          className="xl:col-span-2"
        />
        <MetricCard
          label="Saldo al cierre"
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
        {isBalanceOnly ? (
          <SectionCard
            title="Aprovechamiento"
            description="La referencia del 80% no aplica porque no existe nueva materia prima."
            contentClassName="flex min-h-36 flex-col items-center justify-center p-5 text-center"
          >
            <p className="text-xl font-extrabold text-slate-950">NO APLICA</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Jornada de saldos</p>
          </SectionCard>
        ) : (
          <PerformancePanel
            calculation={calculation}
            washAuthorization={productionDay.nucaWashAuthorization}
          />
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Producción por turno">
        <MetricCard label="Producción Día" value={formatCentiKg(calculation.productiveDayKg100)} icon={<Sun className="size-5" />} />
        <MetricCard label="Producción Noche" value={formatCentiKg(calculation.productiveNightKg100)} icon={<Moon className="size-5" />} />
        <MetricCard label="Saldo anterior procesado" value={formatCentiKg(calculation.processedPreviousBalanceKg100)} icon={<Boxes className="size-5" />} />
        <MetricCard label="Tratamiento" value={formatCentiKg(calculation.treatmentKg100)} icon={<Waves className="size-5" />} />
      </section>

      <div id="produccion" className="scroll-mt-28">
        <ProductionBreakdown products={calculation.products} />
      </div>

      <div id="saldos" className="scroll-mt-28 space-y-5">
        <ReceivedBalancePanel
          productionDay={productionDay}
          calculation={calculation}
        />
        {!isBalanceOnly ? (
          <BalancePanel
            products={calculation.products}
            originDate={productionDay.date}
            positions={balancePositions}
          />
        ) : null}
      </div>
    </div>
  )
}

export default ProductionDayPage
