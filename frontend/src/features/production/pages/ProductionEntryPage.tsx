import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMemo, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import {
  getOperationalWeekContext,
  getOperationalWeekContextForIsoDate,
  getOperationalWeekState,
} from '../../../utils/operationalContext'
import {
  buildProductionDayFromCapture,
  createCaptureDraftFromDay,
  createEmptyCaptureDraft,
  sumImportedBalances,
  type ProductionCaptureDraft,
  type ProductionCaptureRow,
} from '../capture/productionCapture'
import {
  filterProductionCatalogItems,
  PRODUCTION_CATALOG_ITEMS,
} from '../capture/productionCatalog'
import type { ParsedProductionSheet } from '../capture/parseProductionWorkbook'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

type CaptureMode = 'MANUAL' | 'EXCEL'

interface QuantityInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  className?: string
}

function QuantityInput({
  label,
  value,
  onChange,
  readOnly = false,
  className = '',
}: QuantityInputProps) {
  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-right text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 read-only:cursor-default read-only:bg-slate-100 read-only:text-slate-600"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.6875rem] font-bold text-slate-400">
          kg
        </span>
      </span>
    </label>
  )
}

function createRow(productId: string, index: number): ProductionCaptureRow | null {
  const product = PRODUCTION_CATALOG_ITEMS.find(
    (item) => item.productId === productId,
  )
  if (!product) return null

  return {
    key: `manual-${product.productId}-${Date.now()}-${index}`,
    product,
    dayReportedKg: '',
    dayPreviousBalanceKg: '0',
    nightReportedKg: '',
    nightPreviousBalanceKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '0',
    finishedKg: '',
  }
}

export function ProductionEntryPage() {
  const { date: editingDate } = useParams()
  const navigate = useNavigate()
  const {
    activeWeek,
    allProductionDays,
    subsequentBalanceLots,
    findProductionDay,
    isUserManagedDay,
    upsertProductionDay,
  } = useProductionData()
  const existingDay = editingDate ? findProductionDay(editingDate) : undefined
  const currentWeek = getOperationalWeekContext(new Date())
  const activeWeekState = getOperationalWeekState(activeWeek, currentWeek)
  const editingWeekState = editingDate
    ? getOperationalWeekState(
        getOperationalWeekContextForIsoDate(editingDate),
        currentWeek,
      )
    : null
  const isEditingAllowed = editingDate
    ? isUserManagedDay(editingDate) && editingWeekState?.canCreate === true
    : activeWeekState.canCreate
  const suggestedDate =
    activeWeekState.canCreate
      ? activeWeek.calendarDays.find(
          (day) => !findProductionDay(day.isoDate),
        )?.isoDate ?? activeWeek.period.startDate
      : currentWeek.period.startDate
  const [mode, setMode] = useState<CaptureMode>(
    existingDay?.lines.at(0)?.source.sheet === 'CAPTURA WEB'
      ? 'MANUAL'
      : existingDay
        ? 'EXCEL'
        : 'MANUAL',
  )
  const [draft, setDraft] = useState<ProductionCaptureDraft>(() =>
    existingDay
      ? createCaptureDraftFromDay(existingDay)
      : createEmptyCaptureDraft(suggestedDate),
  )
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [parsedSheets, setParsedSheets] = useState<
    readonly ParsedProductionSheet[]
  >([])
  const [selectedSheetName, setSelectedSheetName] = useState('')
  const [fileName, setFileName] = useState('')
  const [importState, setImportState] = useState<
    'IDLE' | 'READING' | 'READY' | 'ERROR'
  >('IDLE')
  const [saveError, setSaveError] = useState('')

  usePageTitle(existingDay ? 'Editar jornada' : 'Nueva jornada')

  const buildResult = useMemo(
    () =>
      buildProductionDayFromCapture(
        draft,
        allProductionDays.filter((day) => day.date !== draft.date),
        subsequentBalanceLots,
      ),
    [allProductionDays, draft, subsequentBalanceLots],
  )
  const canClose =
    buildResult.inputErrors.length === 0 &&
    buildResult.calculation.status === 'BALANCED' &&
    buildResult.calculation.integrityIssues.length === 0
  const yieldStatus = getYieldStatus(buildResult.calculation.performance.percent)
  const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
  const importedBalanceTotal = sumImportedBalances(draft.importedBalances)
  const importedBalanceMatches =
    importedBalanceTotal === buildResult.calculation.newClosingBalanceKg100
  const filteredCatalogItems = useMemo(
    () =>
      filterProductionCatalogItems(productSearch).filter(
        (product) =>
          !draft.rows.some((row) => row.product.productId === product.productId),
      ),
    [draft.rows, productSearch],
  )

  if (!isEditingAllowed || (editingDate && !existingDay)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto size-10 text-amber-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          {editingDate
            ? 'Esta jornada no se puede editar'
            : 'Esta semana es de solo lectura'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Solo la semana operativa actual permite crear o modificar jornadas.
        </p>
        <Link
          to="/jornadas"
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a jornadas
        </Link>
      </div>
    )
  }

  const updateDraft = <Key extends keyof ProductionCaptureDraft>(
    key: Key,
    value: ProductionCaptureDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const updateRow = (
    key: string,
    field: keyof Omit<ProductionCaptureRow, 'key' | 'product'>,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    }))
  }

  const addSelectedProduct = () => {
    if (!selectedProductId) return
    if (draft.rows.some((row) => row.product.productId === selectedProductId)) {
      setSaveError('Ese producto ya está agregado a la jornada.')
      return
    }
    const row = createRow(selectedProductId, draft.rows.length)
    if (!row) return
    updateDraft('rows', [...draft.rows, row])
    setProductSearch('')
    setSelectedProductId('')
    setSaveError('')
  }

  const removeRow = (key: string) => {
    updateDraft(
      'rows',
      draft.rows.filter((row) => row.key !== key),
    )
  }

  const handleWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportState('READING')
    setFileName(file.name)
    setSaveError('')

    try {
      const { parseProductionWorkbook } = await import(
        '../capture/parseProductionWorkbook'
      )
      const sheets = await parseProductionWorkbook(await file.arrayBuffer())
      if (sheets.length === 0) {
        throw new Error('No se encontraron hojas diarias válidas.')
      }
      setParsedSheets(sheets)
      setSelectedSheetName(sheets[0]!.sheetName)
      setImportState('READY')
    } catch {
      setParsedSheets([])
      setSelectedSheetName('')
      setImportState('ERROR')
    }
  }

  const applyImportedSheet = async () => {
    const sheet = parsedSheets.find(
      (candidate) => candidate.sheetName === selectedSheetName,
    )
    if (!sheet) return
    const { createCaptureDraftFromImportedSheet } = await import(
      '../capture/parseProductionWorkbook'
    )
    setDraft(createCaptureDraftFromImportedSheet(sheet))
    setSaveError('')
  }

  const persist = (closeDay: boolean) => {
    setSaveError('')
    const next = buildProductionDayFromCapture(
      draft,
      allProductionDays.filter((day) => day.date !== draft.date),
      subsequentBalanceLots,
      closeDay ? 'CLOSED' : 'DRAFT',
    )

    if (next.inputErrors.length > 0) {
      setSaveError(next.inputErrors[0] ?? 'Revisa los datos de la jornada.')
      return
    }
    if (closeDay && next.calculation.status !== 'BALANCED') {
      setSaveError('La jornada no puede cerrarse hasta que la diferencia sea 0.00 kg.')
      return
    }

    try {
      upsertProductionDay(next.productionDay)
      navigate(`/jornadas/${next.productionDay.date}`)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No se pudo guardar la jornada.',
      )
    }
  }

  return (
    <div className="space-y-5 pb-24">
      <Link
        to="/jornadas"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a jornadas
      </Link>

      <PageHeader
        eyebrow="Captura operativa"
        title={existingDay ? `Editar ${formatIsoDate(existingDay.date)}` : 'Nueva jornada'}
        description="Ingresa los datos manualmente o precárgalos desde el Excel. Nada se cierra hasta que el cuadre sea exacto."
        actions={
          <StatusBadge tone={canClose ? 'success' : 'warning'}>
            {canClose ? 'LISTO PARA CERRAR' : 'EN CAPTURA'}
          </StatusBadge>
        }
      />

      <div
        className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        role="tablist"
        aria-label="Forma de ingreso"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'MANUAL'}
          className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
            mode === 'MANUAL'
              ? 'bg-brand-700 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setMode('MANUAL')}
        >
          Ingreso manual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'EXCEL'}
          className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
            mode === 'EXCEL'
              ? 'bg-brand-700 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setMode('EXCEL')}
        >
          Importar Excel
        </button>
      </div>

      {mode === 'EXCEL' ? (
        <SectionCard
          title="Precargar desde Excel"
          description="El archivo se procesa dentro de este navegador; primero verás una vista previa editable."
          action={<FileSpreadsheet className="size-5 text-emerald-700" aria-hidden="true" />}
        >
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_18rem_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Archivo de producción
              </span>
              <span className="relative block">
                <Upload className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-brand-700" aria-hidden="true" />
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="block h-10 w-full cursor-pointer rounded-lg border border-dashed border-brand-300 bg-brand-50 pl-9 text-xs font-semibold text-brand-900 file:mr-3 file:h-10 file:border-0 file:border-r file:border-brand-200 file:bg-transparent file:px-3 file:text-xs file:font-bold file:text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  aria-describedby="excel-file-status"
                  onChange={handleWorkbook}
                />
              </span>
              <span id="excel-file-status" className="mt-1 block truncate text-[0.6875rem] text-slate-500">
                {fileName || 'Solo archivos .xlsx con hojas diarias del formato TRABUNDA.'}
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Hoja diaria
              </span>
              <select
                value={selectedSheetName}
                disabled={parsedSheets.length === 0}
                onChange={(event) => setSelectedSheetName(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:bg-slate-100"
              >
                {parsedSheets.length === 0 ? <option>Sin hojas detectadas</option> : null}
                {parsedSheets.map((sheet) => (
                  <option key={`${sheet.sheetName}-${sheet.date}`} value={sheet.sheetName}>
                    {sheet.sheetName} · {sheet.date}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={importState !== 'READY'}
              onClick={applyImportedSheet}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Cargar vista previa
            </button>
          </div>
          {importState === 'READING' ? (
            <p className="px-5 pb-4 text-xs font-semibold text-brand-800" role="status">
              Leyendo y validando el libro…
            </p>
          ) : null}
          {importState === 'ERROR' ? (
            <p className="mx-5 mb-5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800" role="alert">
              No se pudo leer una hoja diaria válida. Verifica que sea el formato de producción `.xlsx`.
            </p>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Datos generales"
        description={
          draft.source === 'EXCEL'
            ? `Vista previa de ${draft.sourceSheet}; todos los campos siguen siendo editables antes de guardar.`
            : 'Totales independientes usados para validar el cuadre y el rendimiento.'
        }
      >
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-6">
          <label className="block">
            <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
              Fecha
            </span>
            <input
              type="date"
              value={draft.date}
              onChange={(event) => updateDraft('date', event.target.value)}
              className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <QuantityInput label="Materia prima" value={draft.rawMaterialKg} onChange={(value) => updateDraft('rawMaterialKg', value)} />
          <QuantityInput label="Reporte Día" value={draft.declaredDayTotalKg} onChange={(value) => updateDraft('declaredDayTotalKg', value)} />
          <QuantityInput label="Reporte Noche" value={draft.declaredNightTotalKg} onChange={(value) => updateDraft('declaredNightTotalKg', value)} />
          <QuantityInput label="Producto terminado" value={draft.declaredFinishedTotalKg} onChange={(value) => updateDraft('declaredFinishedTotalKg', value)} />
          <QuantityInput label="MP Reproductor" value={draft.reproductorAllocationKg} onChange={(value) => updateDraft('reproductorAllocationKg', value)} />
        </div>
        <div className="border-t border-slate-200 px-4 py-3 sm:px-5">
          <label className="flex max-w-2xl items-start gap-3">
            <input
              type="checkbox"
              checked={draft.nucaWashConfirmed}
              onChange={(event) => updateDraft('nucaWashConfirmed', event.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
            />
            <span>
              <span className="block text-xs font-bold text-slate-800">
                Existe pedido confirmado para lavado de Nuca Bikini
              </span>
              <span className="mt-0.5 block text-[0.6875rem] leading-4 text-slate-500">
                Márcalo solo cuando corresponda; no afecta el cuadre de otros productos.
              </span>
            </span>
          </label>
          {draft.nucaWashConfirmed ? (
            <label className="mt-3 block max-w-sm">
              <span className="mb-1 block text-xs font-bold text-slate-700">
                Referencia del pedido (opcional)
              </span>
              <input
                type="text"
                value={draft.nucaWashReference}
                onChange={(event) => updateDraft('nucaWashReference', event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          ) : null}
        </div>
      </SectionCard>

      {draft.importedBalances.length > 0 ? (
        <div className={`rounded-xl border px-4 py-3 ${importedBalanceMatches ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                Saldos detectados en el Excel: {formatCentiKg(importedBalanceTotal)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Asígnalos en la columna “Saldo final” del producto correspondiente. Asignado ahora: {formatCentiKg(buildResult.calculation.newClosingBalanceKg100)}.
              </p>
              <p className="mt-1 text-[0.6875rem] font-semibold text-slate-500">
                {draft.importedBalances.map((balance) => `${balance.label}: ${balance.kg.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <SectionCard
        title="Productos de la jornada"
        description={
          draft.shiftAllocationMode === 'EXPLICIT'
            ? 'Ingresa el reporte físico por turno; el saldo anterior se descuenta para calcular producción propia.'
            : 'Día y Noche se concilian con los totales del Excel; revisa tratamiento, saldos y producto terminado.'
        }
        action={
          <StatusBadge tone={draft.shiftAllocationMode === 'EXPLICIT' ? 'info' : 'warning'}>
            {draft.shiftAllocationMode === 'EXPLICIT' ? 'TURNOS EXPLÍCITOS' : 'REPARTO CONCILIADO'}
          </StatusBadge>
        }
      >
        {mode === 'MANUAL' ? (
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto
              </span>
              <span className="relative block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={productSearch}
                  placeholder="Ej.: aleta, manto o nuca"
                  autoComplete="off"
                  onChange={(event) => {
                    setProductSearch(event.target.value)
                    setSelectedProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto con movimiento
              </span>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">
                  {filteredCatalogItems.length === 0
                    ? 'Sin productos coincidentes'
                    : `Seleccionar entre ${filteredCatalogItems.length} resultado${filteredCatalogItems.length === 1 ? '' : 's'}…`}
                </option>
                {filteredCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={addSelectedProduct}
              disabled={!selectedProductId}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </button>
          </div>
        ) : null}

        {draft.rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Agrega un producto manualmente o carga una hoja desde Excel.
          </div>
        ) : (
          <DataTableScroll label="Captura por producto y turno">
            <table className="erp-table w-full min-w-[104rem] border-collapse text-left">
              <caption className="sr-only">Ingreso de producción por producto</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                  <th className="sticky left-0 z-20 w-[24rem] bg-slate-50 px-4 py-2.5">Familia / producto</th>
                  <th className="px-2 py-2.5 text-right">Día reportado</th>
                  <th className="px-2 py-2.5 text-right">Saldo ant. Día</th>
                  <th className="px-2 py-2.5 text-right">Noche reportado</th>
                  <th className="px-2 py-2.5 text-right">Saldo ant. Noche</th>
                  <th className="px-2 py-2.5 text-right">Tratamiento</th>
                  <th className="px-2 py-2.5 text-right">Saldo final</th>
                  <th className="px-2 py-2.5 text-right">P. terminado</th>
                  <th className="px-2 py-2.5 text-right">Diferencia</th>
                  <th className="px-3 py-2.5"><span className="sr-only">Eliminar</span></th>
                </tr>
              </thead>
              <tbody>
                {draft.rows.map((row, index) => {
                  const calculated = buildResult.calculation.products[index]
                  const inferred = draft.shiftAllocationMode === 'RECONCILED_INFERENCE'
                  return (
                    <tr key={row.key} className="border-b border-slate-100 bg-white hover:bg-brand-50/25">
                      <th className="sticky left-0 z-10 bg-white px-4 py-2.5">
                        <span className="block text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">{row.product.familyName}</span>
                        <span className="mt-0.5 block max-w-[22rem] text-xs font-semibold leading-4 text-slate-800">{row.product.productName}</span>
                      </th>
                      <td className="w-36 px-2 py-2">
                        <QuantityInput label="" value={inferred ? String((calculated?.day.reportedKg100 ?? 0) / 100) : row.dayReportedKg} readOnly={inferred} onChange={(value) => updateRow(row.key, 'dayReportedKg', value)} />
                      </td>
                      <td className="w-36 px-2 py-2"><QuantityInput label="" value={row.dayPreviousBalanceKg} onChange={(value) => updateRow(row.key, 'dayPreviousBalanceKg', value)} /></td>
                      <td className="w-36 px-2 py-2">
                        <QuantityInput label="" value={inferred ? String((calculated?.night.reportedKg100 ?? 0) / 100) : row.nightReportedKg} readOnly={inferred} onChange={(value) => updateRow(row.key, 'nightReportedKg', value)} />
                      </td>
                      <td className="w-36 px-2 py-2"><QuantityInput label="" value={row.nightPreviousBalanceKg} onChange={(value) => updateRow(row.key, 'nightPreviousBalanceKg', value)} /></td>
                      <td className="w-36 px-2 py-2"><QuantityInput label="" value={row.treatmentKg} onChange={(value) => updateRow(row.key, 'treatmentKg', value)} /></td>
                      <td className="w-36 px-2 py-2"><QuantityInput label="" value={row.closingBalanceKg} onChange={(value) => updateRow(row.key, 'closingBalanceKg', value)} /></td>
                      <td className="w-36 px-2 py-2"><QuantityInput label="" value={row.finishedKg} onChange={(value) => updateRow(row.key, 'finishedKg', value)} /></td>
                      <td className={`number-tabular whitespace-nowrap px-3 py-2.5 text-right text-xs font-bold ${(calculated?.differenceKg100 ?? 0) === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCentiKg(calculated?.differenceKg100 ?? 0)}
                      </td>
                      <td className="px-3 py-2.5">
                        <button type="button" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Eliminar ${row.product.productName}`} onClick={() => removeRow(row.key)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTableScroll>
        )}
      </SectionCard>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Validación en tiempo real">
        <MetricCard label="Producto terminado" value={formatCentiKg(buildResult.calculation.declaredFinishedKg100)} />
        <MetricCard label="Saldo final" value={formatCentiKg(buildResult.calculation.newClosingBalanceKg100)} />
        <MetricCard label="Diferencia" value={formatCentiKg(buildResult.calculation.differenceKg100)} tone={canClose ? 'success' : 'danger'} />
        <MetricCard
          label="Rendimiento"
          value={buildResult.calculation.performance.percent === null ? 'No disponible' : `${buildResult.calculation.performance.percent.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
          tone={yieldStyles.metricTone}
          valueClassName={yieldStyles.textClass}
          description={
            <StatusBadge tone={yieldStyles.badgeTone} title={yieldStatus.interpretation}>
              {yieldStatus.label}
            </StatusBadge>
          }
        />
      </section>

      {buildResult.inputErrors.length > 0 || buildResult.calculation.integrityIssues.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-900">Revisiones pendientes</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
            {[...buildResult.inputErrors, ...buildResult.calculation.integrityIssues.map((issue) => issue.message)].slice(0, 8).map((message) => <li key={message}>• {message}</li>)}
          </ul>
        </div>
      ) : null}

      {saveError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {saveError}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur xl:left-64">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {canClose ? <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" /> : <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />}
            <div>
              <p className="text-xs font-bold text-slate-900">{canClose ? 'Cuadre correcto: 0.00 kg' : 'La jornada todavía requiere revisión'}</p>
              <p className="text-[0.6875rem] text-slate-500">Puedes guardar un borrador válido y continuar después.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => persist(false)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:flex-none">
              <Save className="size-4" aria-hidden="true" />
              Guardar borrador
            </button>
            <button type="button" disabled={!canClose} onClick={() => persist(true)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:flex-none">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Cerrar jornada
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductionEntryPage
