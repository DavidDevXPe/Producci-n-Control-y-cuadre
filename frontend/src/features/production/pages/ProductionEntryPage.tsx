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
import { Fragment, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { FamilyYieldPanel } from '../components/FamilyYieldPanel'
import {
  ClosingBalanceRowControl,
  ClosingBalanceYieldControl,
} from '../components/ClosingBalanceYieldControl'
import { TubeMpBalancePanel } from '../components/TubeMpBalancePanel'
import { ProcessSelector } from '../components/ProcessSelector'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { getOperationalWeekContextForIsoDate } from '../../../utils/operationalContext'
import {
  buildProductionDayFromCapture,
  createCaptureDraftFromDay,
  createEmptyCaptureDraft,
  sumImportedBalances,
  type ProductionCaptureDraft,
  type ProductionCaptureBalanceUse,
  type ProductionCaptureRow,
} from '../capture/productionCapture'
import {
  filterProductionCatalogItems,
  PRODUCTION_CATALOG_ITEMS,
} from '../capture/productionCatalog'
import type { ParsedProductionSheet } from '../capture/parseProductionWorkbook'
import {
  buildProductionDiagnostics,
  calculateReportFamilySubtotals,
  calculateProductionBusinessSummary,
  validateProductionClosure,
} from '../model/businessRules'
import {
  calculateOutstandingBalances,
  kg100,
  sumKg100,
  toKilograms,
} from '../model/calculations'
import { calculateFreezingAvailability } from '../model/freezing'
import { isSundayIsoDate } from '../model/productionDayMode'
import {
  getProductionProcess,
  isPackingProductionDay,
  isProductionProcess,
  productionDayKey,
} from '../model/productionProcess'
import type { ProductionProcess } from '../model/types'
import { useProductionData } from '../state/ProductionDataContext'

type CaptureMode = 'MANUAL' | 'EXCEL'

interface QuantityInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  className?: string
}

function QuantityInput({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  className = '',
}: QuantityInputProps) {
  const clearedZeroOnFocus = useRef(false)

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
          disabled={disabled}
          onFocus={() => {
            if (
              !readOnly &&
              !disabled &&
              value.trim() !== '' &&
              Number(value.replace(',', '.')) === 0
            ) {
              clearedZeroOnFocus.current = true
              onChange('')
            } else {
              clearedZeroOnFocus.current = false
            }
          }}
          onBlur={() => {
            if (clearedZeroOnFocus.current && value.trim() === '') {
              onChange('0')
            }
            clearedZeroOnFocus.current = false
          }}
          onChange={(event) => onChange(event.target.value)}
          className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-right text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 read-only:cursor-default read-only:bg-slate-100 read-only:text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '0',
    finishedKg: '',
  }
}

function hasSufficientCaptureData(draft: ProductionCaptureDraft) {
  const hasRequiredTotals = [
    ...(draft.operationMode === 'BALANCE_ONLY' || draft.process === 'FREEZING'
      ? []
      : [draft.rawMaterialKg]),
    draft.declaredDayTotalKg,
    draft.declaredNightTotalKg,
  ].every((value) => value.trim() !== '')
  const hasCompleteRows =
    draft.rows.length > 0 &&
    draft.rows.every(
      (row) =>
        (draft.shiftAllocationMode === 'RECONCILED_INFERENCE' ||
          (row.dayReportedKg.trim() !== '' && row.nightReportedKg.trim() !== '')),
    )

  return /^\d{4}-\d{2}-\d{2}$/.test(draft.date) && hasRequiredTotals && hasCompleteRows
}

function shiftDifferenceMessage(
  label: 'Día' | 'Noche',
  differenceKg100: ReturnType<typeof kg100>,
) {
  if (differenceKg100 === 0) return `Turno ${label} conciliado.`
  if (differenceKg100 > 0) {
    return `Faltan ${formatCentiKg(differenceKg100)} por registrar en Turno ${label}.`
  }
  return `Sobran ${formatCentiKg(kg100(-differenceKg100))} en el detalle del Turno ${label}.`
}

function captureQuantityKg100(value: string) {
  const quantity = Number(value.trim().replace(',', '.'))
  return Number.isFinite(quantity) && quantity >= 0
    ? kg100(Math.round(quantity * 100))
    : kg100(0)
}

function captureBalancePosition(balance: ProductionCaptureBalanceUse) {
  const dayKg100 = captureQuantityKg100(balance.dayKg)
  const nightKg100 = captureQuantityKg100(balance.nightKg)
  const processedKg100 = sumKg100([dayKg100, nightKg100])

  return {
    processedKg100,
    pendingKg100: kg100(
      Math.max(balance.availableKg100 - processedKg100, 0),
    ),
    overusedKg100: kg100(
      Math.max(processedKg100 - balance.availableKg100, 0),
    ),
  }
}

function captureProductAvailability(
  draft: ProductionCaptureDraft,
  productId: string,
) {
  const balances = draft.balanceUses.filter(
    (balance) => balance.productId === productId,
  )
  const availableKg100 = sumKg100(
    balances.map((balance) => balance.availableKg100),
  )
  const frozenKg100 = sumKg100(
    balances.flatMap((balance) => [
      captureQuantityKg100(balance.dayKg),
      captureQuantityKg100(balance.nightKg),
    ]),
  )

  return {
    availableKg100,
    frozenKg100,
    pendingKg100: kg100(Math.max(availableKg100 - frozenKg100, 0)),
  }
}

export function ProductionEntryPage() {
  const { date: editingDate } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    activeWeekNumber,
    allProductionDays,
    subsequentBalanceLots,
    findProductionDay,
    getWeekState,
    getWeekView,
    isUserManagedDay,
    activeProcess,
    setActiveProcess,
    upsertProductionDay,
  } = useProductionData()
  const processParam = searchParams.get('process')
  const selectedProcess = isProductionProcess(processParam)
    ? processParam
    : activeProcess
  const activeWeek = getWeekView(activeWeekNumber, selectedProcess)
  const existingDay = editingDate
    ? findProductionDay(editingDate, selectedProcess)
    : undefined
  const activeWeekState = activeWeek
  const editingWeekState = editingDate
    ? getWeekState(
        getOperationalWeekContextForIsoDate(editingDate).number,
        selectedProcess,
      )
    : null
  const isEditingAllowed = editingDate
    ? isUserManagedDay(editingDate, selectedProcess) &&
      existingDay?.status !== 'CLOSED' &&
      editingWeekState?.canCreate === true
    : activeWeek.canCreate
  const suggestedDate =
    activeWeekState.canCreate
      ? activeWeek.calendarDays.find(
          (day) => !findProductionDay(day.isoDate, selectedProcess),
        )?.isoDate ?? activeWeek.period.startDate
      : activeWeek.period.startDate
  const [mode, setMode] = useState<CaptureMode>(
    existingDay?.lines.at(0)?.source.sheet === 'CAPTURA WEB'
      ? 'MANUAL'
      : existingDay
        ? 'EXCEL'
        : 'MANUAL',
  )
  const [draft, setDraft] = useState<ProductionCaptureDraft>(() =>
    existingDay
      ? createCaptureDraftFromDay(existingDay, allProductionDays)
      : createEmptyCaptureDraft(suggestedDate, selectedProcess),
  )
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [treatmentSearch, setTreatmentSearch] = useState('')
  const [selectedTreatmentProductId, setSelectedTreatmentProductId] = useState('')
  const [tunnelSearch, setTunnelSearch] = useState('')
  const [selectedTunnelProductId, setSelectedTunnelProductId] = useState('')
  const [closingSearch, setClosingSearch] = useState('')
  const [selectedClosingProductId, setSelectedClosingProductId] = useState('')
  const [closingProductIds, setClosingProductIds] = useState<Set<string>>(
    () =>
      new Set(
        existingDay?.lines
          .filter((line) => line.newClosingBalanceKg100 > 0)
          .map((line) => line.productId) ?? [],
      ),
  )
  const [selectedBalanceKey, setSelectedBalanceKey] = useState('')
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false)
  const [tunnelToggleError, setTunnelToggleError] = useState('')
  const [parsedSheets, setParsedSheets] = useState<
    readonly ParsedProductionSheet[]
  >([])
  const [selectedSheetName, setSelectedSheetName] = useState('')
  const [fileName, setFileName] = useState('')
  const [importState, setImportState] = useState<
    'IDLE' | 'READING' | 'READY' | 'ERROR'
  >('IDLE')
  const [saveError, setSaveError] = useState('')
  const isSunday = isSundayIsoDate(draft.date)
  const isFreezing = draft.process === 'FREEZING'
  const isBalanceOnly =
    isSunday && draft.operationMode === 'BALANCE_ONLY' && !isFreezing
  const usesExternalAvailability = isBalanceOnly || isFreezing

  usePageTitle(existingDay ? 'Editar jornada' : 'Nueva jornada')

  const buildResult = useMemo(
    () =>
      buildProductionDayFromCapture(
        draft,
        allProductionDays.filter(
          (day) =>
            productionDayKey(day.date, getProductionProcess(day)) !==
            productionDayKey(draft.date, draft.process),
        ),
        subsequentBalanceLots,
      ),
    [allProductionDays, draft, subsequentBalanceLots],
  )
  const hasSufficientData = hasSufficientCaptureData(draft)
  const businessSummary = useMemo(
    () =>
      calculateProductionBusinessSummary(
        buildResult.productionDay,
        buildResult.calculation,
      ),
    [buildResult],
  )
  const reportFamilySubtotals = useMemo(
    () => calculateReportFamilySubtotals(buildResult.productionDay),
    [buildResult.productionDay],
  )
  const closureValidation = useMemo(
    () =>
      validateProductionClosure(
        buildResult.productionDay,
        buildResult.calculation,
        {
          requiredDataComplete: hasSufficientData,
          inputErrors: buildResult.inputErrors,
        },
      ),
    [buildResult, hasSufficientData],
  )
  const canClose = closureValidation.canClose
  const diagnostics = useMemo(
    () =>
      usesExternalAvailability
        ? []
        : buildProductionDiagnostics(buildResult.calculation, businessSummary),
    [buildResult.calculation, businessSummary, usesExternalAvailability],
  )
  const dayHasReportData =
    draft.declaredDayTotalKg.trim() !== '' && draft.rows.length > 0
  const nightHasReportData =
    draft.declaredNightTotalKg.trim() !== '' && draft.rows.length > 0
  const hasReportData = dayHasReportData && nightHasReportData
  const reportsReconciled =
    hasReportData &&
    buildResult.calculation.day.detailDifferenceKg100 === 0 &&
    buildResult.calculation.night.detailDifferenceKg100 === 0
  const tunnelMovementRequired =
    draft.hasTunnelProduction && buildResult.calculation.tunnel.totalKg100 === 0
  const footerStatus = canClose
    ? {
        title: 'La jornada está lista para cerrar.',
        description: usesExternalAvailability
          ? isFreezing
            ? 'Los reportes coinciden y todo el producto congelado tiene origen trazable en Envasado.'
            : 'Los reportes y consumos de saldo están conciliados sin producción propia.'
          : 'El cuadre es correcto y no existen diferencias pendientes.',
      }
    : hasSufficientData
      ? {
          title: 'La jornada todavía requiere revisión.',
          description: 'Revisa el cuadre y las validaciones pendientes antes de cerrar.',
        }
      : {
          title: 'Completa los datos requeridos para validar la jornada.',
          description: 'Puedes guardar un borrador válido y continuar después.',
        }
  const importedBalanceTotal = sumImportedBalances(draft.importedBalances)
  const importedBalanceMatches =
    importedBalanceTotal === buildResult.calculation.newClosingBalanceKg100
  const freezingAvailabilityByProduct = useMemo(() => {
    if (!isFreezing) return new Map<string, ReturnType<typeof kg100>>()
    const totals = new Map<string, ReturnType<typeof kg100>>()
    for (const position of calculateFreezingAvailability(
      allProductionDays.filter(
        (day) =>
          productionDayKey(day.date, getProductionProcess(day)) !==
          productionDayKey(draft.date, draft.process),
      ),
      draft.date,
    )) {
      totals.set(
        position.productId,
        kg100((totals.get(position.productId) ?? 0) + position.pendingKg100),
      )
    }
    return totals
  }, [allProductionDays, draft.date, draft.process, isFreezing])
  const filteredCatalogItems = useMemo(
    () =>
      filterProductionCatalogItems(productSearch).filter(
        (product) =>
          !draft.rows.some((row) => row.product.productId === product.productId),
      ).sort((first, second) =>
        isFreezing
          ? (freezingAvailabilityByProduct.get(second.productId) ?? 0) -
            (freezingAvailabilityByProduct.get(first.productId) ?? 0)
          : 0,
      ),
    [draft.rows, freezingAvailabilityByProduct, isFreezing, productSearch],
  )
  const treatmentCatalogItems = useMemo(
    () =>
      filterProductionCatalogItems(treatmentSearch).filter(
        (product) =>
          !draft.rows.some((row) => row.product.productId === product.productId),
      ),
    [draft.rows, treatmentSearch],
  )
  const tunnelCatalogItems = useMemo(
    () =>
      filterProductionCatalogItems(tunnelSearch).filter(
        (product) =>
          !draft.rows.some((row) => row.product.productId === product.productId),
      ),
    [draft.rows, tunnelSearch],
  )
  const closingCatalogItems = useMemo(
    () =>
      filterProductionCatalogItems(closingSearch).filter(
        (product) => !closingProductIds.has(product.productId),
      ),
    [closingProductIds, closingSearch],
  )
  const closingRows = useMemo(
    () =>
      draft.rows.filter(
        (row) =>
          closingProductIds.has(row.product.productId) ||
          captureQuantityKg100(row.closingBalanceKg) > 0,
      ),
    [closingProductIds, draft.rows],
  )
  const availableBalances = useMemo(() => {
    const selectedKeys = new Set(
      draft.balanceUses.map(
        (balance) => `${balance.originDayId}|${balance.productId}`,
      ),
    )

    const positions = isFreezing
      ? calculateFreezingAvailability(
          allProductionDays.filter(
            (day) =>
              productionDayKey(day.date, getProductionProcess(day)) !==
              productionDayKey(draft.date, draft.process),
          ),
          draft.date,
        )
      : calculateOutstandingBalances(
          allProductionDays.filter(
            (day) => isPackingProductionDay(day) && day.date < draft.date,
          ),
          subsequentBalanceLots,
        )

    return positions.filter(
      (balance) =>
        balance.pendingKg100 > 0 &&
        PRODUCTION_CATALOG_ITEMS.some(
          (product) => product.productId === balance.productId,
        ) &&
        !selectedKeys.has(`${balance.originDayId}|${balance.productId}`),
    )
  }, [
    allProductionDays,
    draft.balanceUses,
    draft.date,
    draft.process,
    isFreezing,
    subsequentBalanceLots,
  ])
  const totalReportedKg100 = sumKg100([
    buildResult.calculation.day.declaredReportedKg100,
    buildResult.calculation.night.declaredReportedKg100,
  ])

  const changeProcess = (process: ProductionProcess) => {
    if (editingDate || process === draft.process) return
    const processWeek = getWeekView(activeWeek.number, process)
    const nextDate = processWeek.calendarDays.find(
      (day) => !findProductionDay(day.isoDate, process),
    )?.isoDate ?? processWeek.period.startDate

    setActiveProcess(process)
    setSearchParams({ process }, { replace: true })
    setMode('MANUAL')
    setDraft(createEmptyCaptureDraft(nextDate, process))
    setProductSearch('')
    setSelectedProductId('')
    setSelectedBalanceKey('')
    setParsedSheets([])
    setSelectedSheetName('')
    setFileName('')
    setImportState('IDLE')
    setClosingProductIds(new Set())
    setSaveError('')
  }

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
          Las semanas abiertas permiten captura; las semanas cerradas y futuras son de solo lectura.
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

  const updateDate = (date: string) => {
    const sunday = isSundayIsoDate(date)
    setDraft((current) => ({
      ...current,
      date,
      operationMode: sunday ? 'BALANCE_ONLY' : 'NORMAL',
      rawMaterialKg:
        sunday || current.process === 'FREEZING' ? '0' : current.rawMaterialKg,
    }))
    setSaveError('')
  }

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

  const updateTunnelCondition = (enabled: boolean) => {
    const hasTunnelMovements = draft.rows.some(
      (row) =>
        captureQuantityKg100(row.tunnelDayKg) > 0 ||
        captureQuantityKg100(row.tunnelNightKg) > 0,
    )

    if (!enabled && hasTunnelMovements) {
      setTunnelToggleError(
        'Existen productos de Túnel registrados. Elimina estos movimientos antes de desactivar la opción.',
      )
      return
    }

    updateDraft('hasTunnelProduction', enabled)
    setTunnelToggleError('')
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

  const addMovementProduct = (
    productId: string,
    resetSelection: () => void,
  ) => {
    if (!productId) return
    if (draft.rows.some((row) => row.product.productId === productId)) {
      resetSelection()
      return
    }
    const row = createRow(productId, draft.rows.length)
    if (!row) return
    updateDraft('rows', [
      ...draft.rows,
      { ...row, dayReportedKg: '0', nightReportedKg: '0' },
    ])
    resetSelection()
    setSaveError('')
  }

  const addClosingProduct = () => {
    if (!selectedClosingProductId) return
    const productId = selectedClosingProductId
    setClosingProductIds((current) => new Set(current).add(productId))
    addMovementProduct(productId, () => {
      setClosingSearch('')
      setSelectedClosingProductId('')
    })
  }

  const addSelectedBalance = () => {
    const position = availableBalances.find(
      (balance) =>
        `${balance.originDayId}|${balance.productId}` === selectedBalanceKey,
    )
    if (!position) return
    const catalogProduct = PRODUCTION_CATALOG_ITEMS.find(
      (product) => product.productId === position.productId,
    )
    if (!catalogProduct) {
      setSaveError('El producto del saldo ya no existe en el catálogo.')
      return
    }

    const balanceUse: ProductionCaptureBalanceUse = {
      key: `balance-${position.originDayId}-${position.productId}`,
      originDayId: position.originDayId,
      originDate: position.originDate,
      familyId: position.familyId,
      familyName: position.familyName,
      productId: position.productId,
      productName: position.productName,
      availableKg100: position.pendingKg100,
      dayKg: String(toKilograms(position.pendingKg100)),
      nightKg: '0',
    }
    const productExists = draft.rows.some(
      (row) => row.product.productId === position.productId,
    )
    const row = productExists
      ? null
      : createRow(position.productId, draft.rows.length)

    setDraft((current) => ({
      ...current,
      rows:
        row === null
          ? current.rows
          : [
              ...current.rows,
              { ...row, dayReportedKg: '0', nightReportedKg: '0' },
            ],
      balanceUses: [...current.balanceUses, balanceUse],
    }))
    setSelectedBalanceKey('')
    setSaveError('')
  }

  const updateBalanceUse = (
    key: string,
    field: 'dayKg' | 'nightKg',
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      balanceUses: current.balanceUses.map((balance) =>
        balance.key === key ? { ...balance, [field]: value } : balance,
      ),
    }))
  }

  const removeBalanceUse = (key: string) => {
    updateDraft(
      'balanceUses',
      draft.balanceUses.filter((balance) => balance.key !== key),
    )
  }

  const removeRow = (key: string) => {
    const productId = draft.rows.find((row) => row.key === key)?.product.productId
    if (productId) {
      setClosingProductIds((current) => {
        const next = new Set(current)
        next.delete(productId)
        return next
      })
    }
    setDraft((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.key !== key),
      balanceUses: current.balanceUses.filter(
        (balance) => balance.productId !== productId,
      ),
    }))
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
    const importedDraft = {
      ...createCaptureDraftFromImportedSheet(sheet),
      process: 'PACKING' as const,
    }
    setDraft(importedDraft)
    setClosingProductIds(
      new Set(
        importedDraft.rows
          .filter((row) => captureQuantityKg100(row.closingBalanceKg) > 0)
          .map((row) => row.product.productId),
      ),
    )
    setSaveError('')
  }

  const persist = (closeDay: boolean, confirmedWarnings = false) => {
    setSaveError('')
    const allowedPeriod = editingDate
      ? getOperationalWeekContextForIsoDate(editingDate).period
      : activeWeek.period
    if (
      draft.date < allowedPeriod.startDate ||
      draft.date > allowedPeriod.endDate
    ) {
      setSaveError(
        `La fecha debe permanecer dentro de la semana ${activeWeek.number}.`,
      )
      return
    }
    const next = buildProductionDayFromCapture(
      draft,
      allProductionDays.filter(
        (day) =>
          productionDayKey(day.date, getProductionProcess(day)) !==
          productionDayKey(draft.date, draft.process),
      ),
      subsequentBalanceLots,
      closeDay ? 'CLOSED' : 'DRAFT',
    )

    if (!closeDay && next.inputErrors.length > 0) {
      setSaveError(next.inputErrors[0] ?? 'Revisa los datos de la jornada.')
      return
    }
    if (closeDay) {
      const validation = validateProductionClosure(
        next.productionDay,
        next.calculation,
        {
          requiredDataComplete: hasSufficientCaptureData(draft),
          inputErrors: next.inputErrors,
        },
      )
      if (!validation.canClose) {
        setSaveError(
          validation.blockers[0]?.message ??
            'La jornada todavía tiene validaciones pendientes.',
        )
        return
      }
      if (validation.warnings.length > 0 && !confirmedWarnings) {
        setIsCloseConfirmationOpen(true)
        return
      }
    }

    try {
      upsertProductionDay(next.productionDay, {
        allowReplace: Boolean(editingDate),
      })
      setIsCloseConfirmationOpen(false)
      navigate(
        `/jornadas/${next.productionDay.date}?process=${draft.process}`,
      )
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No se pudo guardar la jornada.',
      )
    }
  }

  return (
    <div className="space-y-5 pb-[calc(var(--entry-action-bar-height)+1rem)] [--entry-action-bar-height:8.75rem] sm:[--entry-action-bar-height:4.25rem] xl:[--entry-action-bar-height:var(--sidebar-footer-height)]">
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
        description={
          isFreezing
            ? 'Registra lo congelado por turno y vincula cada kilo con el producto disponible desde Envasado.'
            : isBalanceOnly
            ? 'Domingo de saldos: concilia el procesamiento físico sin atribuir nueva producción a esta jornada.'
            : 'Ingresa los datos manualmente o precárgalos desde el Excel. Nada se cierra hasta que el cuadre sea exacto.'
        }
        actions={
          <StatusBadge tone={usesExternalAvailability ? 'info' : canClose ? 'success' : 'warning'}>
            {isFreezing
              ? 'CONGELAMIENTO'
              : isBalanceOnly
                ? 'JORNADA DE SALDOS'
              : canClose
                ? 'LISTO PARA CERRAR'
                : 'EN CAPTURA'}
          </StatusBadge>
        }
      />

      <ProcessSelector
        value={draft.process}
        disabled={Boolean(existingDay)}
        onChange={(process) => {
          if (process !== 'COMPARISON') changeProcess(process)
        }}
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
          disabled={isFreezing}
          className={`min-h-9 rounded-lg px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
            : 'Totales independientes usados para validar el cuadre y el aprovechamiento.'
        }
      >
        {isSunday ? (
          <div className="border-b border-brand-200 bg-brand-50 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-900">
                  DOMINGO · {isFreezing
                    ? 'CONGELAMIENTO DE PENDIENTES'
                    : isBalanceOnly
                      ? 'PROCESAMIENTO DE SALDOS'
                      : 'PRODUCCIÓN NORMAL'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {isFreezing
                    ? 'Los kg congelados se descuentan de la disponibilidad pendiente y conservan la jornada de Envasado que los originó.'
                    : 'Por defecto el domingo no registra nueva descarga. Los kg procesados se descuentan de saldos pendientes de jornadas anteriores.'}
                </p>
              </div>
              {!isFreezing ? (
              <label className="flex shrink-0 items-start gap-2.5 rounded-lg border border-brand-200 bg-white px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={!isBalanceOnly}
                  onChange={(event) =>
                    updateDraft(
                      'operationMode',
                      event.target.checked ? 'NORMAL' : 'BALANCE_ONLY',
                    )
                  }
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
                />
                <span className="text-xs font-bold text-slate-800">
                  Hubo descarga / producción nueva el domingo
                </span>
              </label>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
          <label className="block">
            <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
              Fecha
            </span>
            <input
              type="date"
              value={draft.date}
              min={editingDate ? existingDay?.date : activeWeek.period.startDate}
              max={editingDate ? existingDay?.date : activeWeek.period.endDate}
              disabled={Boolean(existingDay)}
              onChange={(event) => updateDate(event.target.value)}
              className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>
          <QuantityInput
            label={isFreezing ? 'MP descarga (no aplica)' : 'Materia prima'}
            value={usesExternalAvailability ? '0' : draft.rawMaterialKg}
            disabled={usesExternalAvailability}
            onChange={(value) => updateDraft('rawMaterialKg', value)}
          />
          <QuantityInput label="Reporte Día" value={draft.declaredDayTotalKg} onChange={(value) => updateDraft('declaredDayTotalKg', value)} />
          <QuantityInput label="Reporte Noche" value={draft.declaredNightTotalKg} onChange={(value) => updateDraft('declaredNightTotalKg', value)} />
          <div>
            <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
              Total reportado
            </span>
            <div className="number-tabular flex h-10 items-center justify-end rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-extrabold text-brand-900">
              {formatCentiKg(totalReportedKg100)}
            </div>
          </div>
        </div>
        {!usesExternalAvailability ? (
        <div className="grid gap-4 border-t border-slate-200 px-4 py-3 sm:px-5 lg:grid-cols-2">
          <div>
            <label className="flex items-start gap-3">
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
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label="Existe producto para Túnel"
                checked={draft.hasTunnelProduction}
                onChange={(event) => updateTunnelCondition(event.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
              />
              <span>
                <span className="block text-xs font-bold text-slate-800">
                  Existe producto para Túnel
                </span>
                <span className="mt-0.5 block text-[0.6875rem] leading-4 text-slate-500">
                  Activa la etapa solo cuando existan movimientos reales de Túnel.
                </span>
              </span>
            </label>
            {tunnelToggleError ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900" role="alert">
                {tunnelToggleError}
              </p>
            ) : null}
          </div>
        </div>
        ) : (
          <p className="border-t border-brand-200 bg-brand-50/60 px-4 py-3 text-xs font-semibold text-brand-900 sm:px-5">
            {isFreezing
              ? 'Congelamiento no recibe nueva MP anatómica. La validación usa reportes físicos y disponibilidad trazable desde Envasado.'
              : 'Materia Prima fija en 0 kg. La validación se realizará con los reportes físicos y los saldos vinculados por turno.'}
          </p>
        )}
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
        title="Reportes Día / Noche"
        description={
          draft.shiftAllocationMode === 'EXPLICIT'
            ? 'Registra los productos informados por los supervisores y concilia cada turno.'
            : 'Día y Noche se distribuyen desde los totales del Excel y conservan su trazabilidad.'
        }
        action={
          <StatusBadge tone={draft.shiftAllocationMode === 'EXPLICIT' ? 'info' : 'warning'}>
            {draft.shiftAllocationMode === 'EXPLICIT' ? 'TURNOS EXPLÍCITOS' : 'REPARTO CONCILIADO'}
          </StatusBadge>
        }
      >
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50/55 p-4 sm:grid-cols-2 sm:p-5">
          {([
            ['Día', buildResult.calculation.day, dayHasReportData],
            ['Noche', buildResult.calculation.night, nightHasReportData],
          ] as const).map(([label, shift, hasShiftData]) => (
            <article
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-950">Turno {label}</h3>
                <StatusBadge
                  tone={hasShiftData && shift.detailDifferenceKg100 === 0 ? 'success' : 'warning'}
                >
                  {hasShiftData && shift.detailDifferenceKg100 === 0 ? 'CONCILIADO' : 'PENDIENTE'}
                </StatusBadge>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <dt className="text-slate-500">Reporte supervisor</dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-900">
                    {formatCentiKg(shift.declaredReportedKg100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Productos registrados</dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-900">
                    {formatCentiKg(shift.reportedKg100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Diferencia</dt>
                  <dd
                    className={`number-tabular mt-1 font-extrabold ${
                      hasShiftData && shift.detailDifferenceKg100 === 0
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {formatCentiKg(shift.detailDifferenceKg100)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs font-semibold text-slate-600">
                {hasShiftData
                  ? shiftDifferenceMessage(label, shift.detailDifferenceKg100)
                  : `Completa el reporte del Turno ${label}.`}
              </p>
            </article>
          ))}
        </div>

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
                    {isFreezing
                      ? ` · Disponible: ${formatCentiKg(
                          freezingAvailabilityByProduct.get(product.productId) ??
                            kg100(0),
                        )}`
                      : ''}
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
            <table className="erp-table w-full min-w-[76rem] border-collapse text-left">
              <caption className="sr-only">Ingreso de producción por producto</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                  <th className="sticky left-0 z-20 w-[24rem] bg-slate-50 px-4 py-2.5">Familia / producto</th>
                  <th className="px-2 py-2.5 text-right">Día reportado</th>
                  <th className="px-2 py-2.5 text-right">Noche reportado</th>
                  <th className="px-3 py-2.5 text-right">Total jornada</th>
                  <th className="px-3 py-2.5 text-right">
                    {isFreezing ? 'Disponible' : 'Rend. preliminar'}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {isFreezing ? 'Pendiente' : 'Objetivo'}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {isFreezing ? 'Diferencia' : 'Kg faltantes'}
                  </th>
                  <th className="px-3 py-2.5 text-center">Estado</th>
                  <th className="px-3 py-2.5"><span className="sr-only">Eliminar</span></th>
                </tr>
              </thead>
              <tbody>
                {reportFamilySubtotals.map((subtotal) => {
                  const familyAvailability = subtotal.productIds.reduce(
                    (total, productId) => {
                      const availability = captureProductAvailability(
                        draft,
                        productId,
                      )
                      return {
                        availableKg100: kg100(
                          total.availableKg100 + availability.availableKg100,
                        ),
                        frozenKg100: kg100(
                          total.frozenKg100 + availability.frozenKg100,
                        ),
                        pendingKg100: kg100(
                          total.pendingKg100 + availability.pendingKg100,
                        ),
                      }
                    },
                    {
                      availableKg100: kg100(0),
                      frozenKg100: kg100(0),
                      pendingKg100: kg100(0),
                    },
                  )
                  const familyDifferenceKg100 = kg100(
                    subtotal.totalKg100 - familyAvailability.frozenKg100,
                  )

                  return (
                  <Fragment key={subtotal.key}>
                    <tr className="border-b border-brand-100 bg-brand-50/45">
                      <th colSpan={9} className="sticky left-0 z-10 px-4 py-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-brand-800">
                        {subtotal.label}
                      </th>
                    </tr>
                    {subtotal.productIds.map((productId) => {
                      const row = draft.rows.find(
                        (candidate) => candidate.product.productId === productId,
                      )!
                      const calculated = buildResult.calculation.products.find(
                        (candidate) => candidate.productId === productId,
                      )
                      const inferred = draft.shiftAllocationMode === 'RECONCILED_INFERENCE'
                      const totalKg100 = sumKg100([
                        calculated?.day.reportedKg100 ?? kg100(0),
                        calculated?.night.reportedKg100 ?? kg100(0),
                      ])
                      const availability = captureProductAvailability(
                        draft,
                        productId,
                      )
                      const linkedDifferenceKg100 = kg100(
                        totalKg100 - availability.frozenKg100,
                      )
                      return (
                    <tr key={row.key} className="border-b border-slate-100 bg-white hover:bg-brand-50/25">
                      <th className="sticky left-0 z-10 bg-white px-4 py-2.5">
                        <span className="block text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">{row.product.familyName}</span>
                        <span className="mt-0.5 block max-w-[22rem] text-xs font-semibold leading-4 text-slate-800">{row.product.productName}</span>
                      </th>
                      <td className="w-36 px-2 py-2">
                        <QuantityInput label="" value={inferred ? String((calculated?.day.reportedKg100 ?? 0) / 100) : row.dayReportedKg} readOnly={inferred} onChange={(value) => updateRow(row.key, 'dayReportedKg', value)} />
                      </td>
                      <td className="w-36 px-2 py-2">
                        <QuantityInput label="" value={inferred ? String((calculated?.night.reportedKg100 ?? 0) / 100) : row.nightReportedKg} readOnly={inferred} onChange={(value) => updateRow(row.key, 'nightReportedKg', value)} />
                      </td>
                      <td className="number-tabular px-3 py-2.5 text-right text-xs font-bold text-slate-800">
                        {formatCentiKg(totalKg100)}
                      </td>
                      <td className="number-tabular px-3 py-2.5 text-right text-xs text-slate-700">
                        {isFreezing ? formatCentiKg(availability.availableKg100) : '—'}
                      </td>
                      <td className="number-tabular px-3 py-2.5 text-right text-xs text-slate-700">
                        {isFreezing ? formatCentiKg(availability.pendingKg100) : '—'}
                      </td>
                      <td className={`number-tabular px-3 py-2.5 text-right text-xs ${isFreezing && linkedDifferenceKg100 !== 0 ? 'font-bold text-rose-700' : 'text-slate-400'}`}>
                        {isFreezing ? formatCentiKg(linkedDifferenceKg100) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-slate-400">
                        {isFreezing ? (
                          <StatusBadge tone={linkedDifferenceKg100 === 0 ? 'success' : 'danger'}>
                            {availability.availableKg100 === 0
                              ? 'SIN DISPONIBILIDAD'
                              : linkedDifferenceKg100 === 0
                                ? 'TRAZABLE'
                                : 'REVISAR'}
                          </StatusBadge>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <button type="button" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Eliminar ${row.product.productName}`} onClick={() => removeRow(row.key)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                      )
                    })}
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-bold">
                      <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-xs uppercase text-slate-800">
                        Subtotal {subtotal.label}
                      </th>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-800">{formatCentiKg(subtotal.dayKg100)}</td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-800">{formatCentiKg(subtotal.nightKg100)}</td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-950">{formatCentiKg(subtotal.totalKg100)}</td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-950">
                        {isFreezing
                          ? formatCentiKg(familyAvailability.availableKg100)
                          : isBalanceOnly
                            ? 'No aplica'
                          : subtotal.preliminaryYieldPercent === null
                            ? 'No disponible'
                            : `${subtotal.preliminaryYieldPercent.toFixed(2)}%`}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-700">
                        {isFreezing
                          ? formatCentiKg(familyAvailability.pendingKg100)
                          : isBalanceOnly
                            ? 'No aplica'
                          : subtotal.targetPercent === null
                            ? 'Sin objetivo'
                            : `≥ ${subtotal.targetPercent.toFixed(0)}%`}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-700">
                        {isFreezing
                          ? formatCentiKg(familyDifferenceKg100)
                          : isBalanceOnly || subtotal.targetPercent === null
                            ? '—'
                          : formatCentiKg(subtotal.missingToTargetKg100)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge tone={isFreezing ? familyDifferenceKg100 === 0 ? 'success' : 'danger' : isBalanceOnly ? 'neutral' : subtotal.status === 'INTEGRITY_ERROR' ? 'danger' : subtotal.status === 'BELOW_TARGET' ? 'warning' : subtotal.status === 'COMPLIES' ? 'success' : 'neutral'}>
                          {isFreezing ? familyDifferenceKg100 === 0 ? 'TRAZABLE' : 'REVISAR' : isBalanceOnly ? 'NO APLICA' : subtotal.status === 'INTEGRITY_ERROR' ? 'ERROR' : subtotal.status === 'BELOW_TARGET' ? 'BAJO OBJETIVO' : subtotal.status === 'COMPLIES' ? 'CUMPLE' : 'SIN OBJETIVO'}
                        </StatusBadge>
                      </td>
                      <td />
                    </tr>
                  </Fragment>
                  )
                })}
              </tbody>
            </table>
          </DataTableScroll>
        )}
      </SectionCard>

      {!usesExternalAvailability && draft.hasTunnelProduction ? (
      <SectionCard
        title="Túnel"
        description="Registra producción adicional por turno sin mezclarla con los reportes del supervisor."
        action={
          <StatusBadge tone={reportsReconciled ? 'success' : 'warning'}>
            {reportsReconciled ? 'TÚNEL DISPONIBLE' : 'TÚNEL ESPERANDO CUADRE'}
          </StatusBadge>
        }
      >
        {tunnelMovementRequired ? (
          <p
            role="alert"
            className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 sm:px-5"
          >
            Se indicó que existe producto para Túnel, pero no se registraron productos.
          </p>
        ) : null}
        <fieldset disabled={!reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Registro de producción de Túnel</legend>
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/55 p-4 sm:grid-cols-3 sm:p-5">
            <MetricCard label="Túnel Día" value={formatCentiKg(buildResult.calculation.tunnel.dayKg100)} />
            <MetricCard label="Túnel Noche" value={formatCentiKg(buildResult.calculation.tunnel.nightKg100)} />
            <MetricCard label="Total Túnel" value={formatCentiKg(buildResult.calculation.tunnel.totalKg100)} tone="brand" />
          </div>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto de Túnel
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={tunnelSearch}
                  placeholder="Ej.: manto, nuca o anillas"
                  autoComplete="off"
                  onChange={(event) => {
                    setTunnelSearch(event.target.value)
                    setSelectedTunnelProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto exacto del catálogo
              </span>
              <select
                value={selectedTunnelProductId}
                onChange={(event) => setSelectedTunnelProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">
                  {tunnelCatalogItems.length === 0
                    ? 'No hay productos nuevos para agregar'
                    : `Seleccionar entre ${tunnelCatalogItems.length} resultados…`}
                </option>
                {tunnelCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedTunnelProductId}
              onClick={() =>
                addMovementProduct(selectedTunnelProductId, () => {
                  setTunnelSearch('')
                  setSelectedTunnelProductId('')
                })
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar a Túnel
            </button>
          </div>

          {draft.rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Primero concilia los productos de Día y Noche.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {draft.rows.map((row) => {
                const tunnelTotalKg100 = sumKg100([
                  captureQuantityKg100(row.tunnelDayKg),
                  captureQuantityKg100(row.tunnelNightKg),
                ])

                return (
                  <div
                    key={`tunnel-${row.key}`}
                    className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem] sm:items-end sm:px-5"
                  >
                    <div className="min-w-0 sm:self-center">
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                        {row.product.familyName}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800" title={row.product.productName}>
                        {row.product.productName}
                      </p>
                    </div>
                    <QuantityInput
                      label="Kg Día"
                      value={row.tunnelDayKg}
                      disabled={!reportsReconciled}
                      onChange={(value) => updateRow(row.key, 'tunnelDayKg', value)}
                    />
                    <QuantityInput
                      label="Kg Noche"
                      value={row.tunnelNightKg}
                      disabled={!reportsReconciled}
                      onChange={(value) => updateRow(row.key, 'tunnelNightKg', value)}
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:min-h-10">
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">Total</p>
                      <p className="number-tabular mt-0.5 text-right text-xs font-extrabold text-slate-900">
                        {formatCentiKg(tunnelTotalKg100)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </fieldset>
      </SectionCard>
      ) : null}

      {!usesExternalAvailability ? (
      <SectionCard
        title="Tratamiento"
        description="Registra movimientos de tratamiento de forma independiente al reporte de los turnos."
        action={
          <StatusBadge tone={reportsReconciled ? 'success' : 'warning'}>
            {reportsReconciled ? 'DISPONIBLE' : 'ESPERANDO CUADRE DE TURNOS'}
          </StatusBadge>
        }
      >
        <fieldset disabled={!reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Registro de tratamiento</legend>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto de tratamiento
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={treatmentSearch}
                  placeholder="Ej.: aleta, manto o nuca"
                  autoComplete="off"
                  onChange={(event) => {
                    setTreatmentSearch(event.target.value)
                    setSelectedTreatmentProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto exacto del catálogo
              </span>
              <select
                value={selectedTreatmentProductId}
                onChange={(event) => setSelectedTreatmentProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">Seleccionar producto…</option>
                {treatmentCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedTreatmentProductId}
              onClick={() =>
                addMovementProduct(selectedTreatmentProductId, () => {
                  setTreatmentSearch('')
                  setSelectedTreatmentProductId('')
                })
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar tratamiento
            </button>
          </div>

          {draft.rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Primero concilia los productos de Día y Noche.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {draft.rows.map((row) => (
                <div
                  key={`treatment-${row.key}`}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                      {row.product.familyName}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-800" title={row.product.productName}>
                      {row.product.productName}
                    </p>
                  </div>
                  <QuantityInput
                    label="Kg tratamiento"
                    value={row.treatmentKg}
                    disabled={!reportsReconciled}
                    onChange={(value) => updateRow(row.key, 'treatmentKg', value)}
                  />
                </div>
              ))}
            </div>
          )}
        </fieldset>
      </SectionCard>
      ) : null}

      <SectionCard
        title={isFreezing ? 'Disponibilidad desde Envasado' : 'Saldos anteriores procesados'}
        description={
          isFreezing
            ? 'Selecciona producto envasado pendiente de congelar y distribuye lo ejecutado entre Día y Noche.'
            : isBalanceOnly
            ? 'Fuente principal del domingo: vincula cada kg procesado con su jornada de origen y turno.'
            : 'Selecciona lotes pendientes reales y distribuye su consumo entre Día y Noche.'
        }
        action={<StatusBadge tone="info">ORIGEN TRAZABLE</StatusBadge>}
      >
        <fieldset disabled={!usesExternalAvailability && !reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Consumo de saldos anteriores</legend>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                {isFreezing ? 'Producto disponible para congelar' : 'Saldo pendiente disponible'}
              </span>
              <select
                value={selectedBalanceKey}
                onChange={(event) => setSelectedBalanceKey(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">
                  {availableBalances.length === 0
                    ? isFreezing
                      ? 'No hay producto envasado pendiente de congelar'
                      : 'No hay otros saldos pendientes disponibles'
                    : 'Seleccionar jornada origen y producto…'}
                </option>
                {availableBalances.map((balance) => (
                  <option
                    key={`${balance.originDayId}|${balance.productId}`}
                    value={`${balance.originDayId}|${balance.productId}`}
                  >
                    {formatIsoDate(balance.originDate)} · {balance.familyName} ·{' '}
                    {balance.productName} · {formatCentiKg(balance.pendingKg100)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedBalanceKey}
              onClick={addSelectedBalance}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              {isFreezing ? 'Vincular producto' : 'Usar saldo'}
            </button>
          </div>

          {draft.balanceUses.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {isFreezing
                ? 'No se ha vinculado producto disponible desde Envasado.'
                : 'No se han asignado saldos de jornadas anteriores.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {draft.balanceUses.map((balance) => {
                const position = captureBalancePosition(balance)

                return (
                  <div key={balance.key} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">
                          {balance.familyName} · {balance.productName}
                        </p>
                        <p className="mt-1 text-[0.6875rem] text-slate-500">
                          Origen: {balance.originDate ? formatIsoDate(balance.originDate) : balance.originDayId} ·
                          Disponible: {formatCentiKg(balance.availableKg100)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBalanceUse(balance.key)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                        aria-label={`Quitar saldo de ${balance.productName}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end">
                      <QuantityInput
                        label="Procesado Día"
                        value={balance.dayKg}
                        onChange={(value) => updateBalanceUse(balance.key, 'dayKg', value)}
                      />
                      <QuantityInput
                        label="Procesado Noche"
                        value={balance.nightKg}
                        onChange={(value) => updateBalanceUse(balance.key, 'nightKg', value)}
                      />
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                          Pendiente del lote
                        </p>
                        <p className={`number-tabular mt-1 text-sm font-extrabold ${position.overusedKg100 > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                          {position.overusedKg100 > 0
                            ? `Exceso ${formatCentiKg(position.overusedKg100)}`
                            : formatCentiKg(position.pendingKg100)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </fieldset>
      </SectionCard>

      {!usesExternalAvailability ? (
      <SectionCard
        title="Saldo generado al cierre"
        description="Registra únicamente producto real de esta jornada que quedará pendiente para después."
        action={<StatusBadge tone="info">JORNADA ORIGEN ACTUAL</StatusBadge>}
        style={{ overflow: 'visible' }}
      >
        <fieldset disabled={!reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Saldo generado al cierre</legend>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto para saldo
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={closingSearch}
                  placeholder="Ej.: aleta, manto o nuca"
                  autoComplete="off"
                  onChange={(event) => {
                    setClosingSearch(event.target.value)
                    setSelectedClosingProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto exacto del catálogo
              </span>
              <select
                value={selectedClosingProductId}
                onChange={(event) => setSelectedClosingProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">Seleccionar producto…</option>
                {closingCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedClosingProductId}
              onClick={addClosingProduct}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar saldo
            </button>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-4 lg:p-4">
            {closingRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500 lg:px-1">
                Busca y agrega únicamente los productos que generaron saldo real.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {closingRows.map((row) => (
                  <div
                    key={`closing-${row.key}`}
                    className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center sm:px-5 lg:px-1"
                  >
                    <div className="min-w-0">
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                        {row.product.familyName}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800" title={row.product.productName}>
                        {row.product.productName}
                      </p>
                    </div>
                    <QuantityInput
                      label="Saldo al cierre"
                      value={row.closingBalanceKg}
                      disabled={!reportsReconciled}
                      onChange={(value) => updateRow(row.key, 'closingBalanceKg', value)}
                    />
                    <ClosingBalanceRowControl
                      summary={businessSummary}
                      summaryGroupId={row.product.summaryGroupId}
                    />
                  </div>
                ))}
              </div>
            )}
            <ClosingBalanceYieldControl summary={businessSummary} />
          </div>
        </fieldset>
      </SectionCard>
      ) : null}

      <SectionCard
        title="Producto terminado calculado"
        description={
          isFreezing
            ? 'Distingue la ejecución física de Congelamiento de la producción atribuida a su jornada de Envasado.'
            : isBalanceOnly
            ? 'Distingue el procesamiento físico del domingo de la producción propia atribuible a nueva materia prima.'
            : 'Desglose operativo derivado del estado actual; ningún valor es editable.'
        }
      >
        {usesExternalAvailability ? (
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <MetricCard label={isFreezing ? 'Congelado físicamente' : 'Procesado físicamente'} value={formatCentiKg(totalReportedKg100)} tone="brand" />
            <MetricCard label="Producción productiva atribuida" value={formatCentiKg(buildResult.calculation.ownTurnProductionKg100)} />
            <MetricCard label={isFreezing ? 'Disponible no utilizado' : 'Saldo anterior pendiente'} value={formatCentiKg(buildResult.calculation.pendingPreviousBalanceKg100)} />
          </div>
        ) : (
        <div className={`grid gap-3 p-4 sm:grid-cols-2 sm:p-5 ${draft.hasTunnelProduction ? 'xl:grid-cols-6' : 'xl:grid-cols-5'}`}>
          <MetricCard label="Reporte propio Día" value={formatCentiKg(buildResult.calculation.day.ownProductionKg100)} />
          <MetricCard label="Reporte propio Noche" value={formatCentiKg(buildResult.calculation.night.ownProductionKg100)} />
          {draft.hasTunnelProduction ? (
            <MetricCard label="Túnel total" value={formatCentiKg(buildResult.calculation.tunnel.totalKg100)} />
          ) : null}
          <MetricCard label="Tratamiento" value={formatCentiKg(buildResult.calculation.treatmentKg100)} />
          <MetricCard label="Saldo al cierre" value={formatCentiKg(buildResult.calculation.newClosingBalanceKg100)} />
          <MetricCard label="Producto terminado" value={formatCentiKg(businessSummary.finishedKg100)} tone="brand" />
        </div>
        )}
      </SectionCard>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Validación en tiempo real">
        <MetricCard
          label="Diferencia final"
          value={formatCentiKg(buildResult.calculation.differenceKg100)}
          tone={buildResult.calculation.differenceKg100 === 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label={isFreezing ? 'Referencia operativa' : 'Aprovechamiento general'}
          value={
            usesExternalAvailability
              ? 'NO APLICA'
              : businessSummary.overallUtilization.percent === null
              ? 'No disponible'
              : `${businessSummary.overallUtilization.percent.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}%`
          }
          tone={
            usesExternalAvailability
              ? 'neutral'
              : businessSummary.overallUtilization.percent !== null &&
            businessSummary.overallUtilization.percent >= 80 &&
            businessSummary.overallUtilization.percent <= 100
              ? 'success'
              : 'danger'
          }
          description={
            usesExternalAvailability
              ? isFreezing
                ? 'No aplica el 80%; Congelamiento se valida contra disponibilidad de Envasado.'
                : 'Jornada de saldos sin nueva materia prima.'
              : 'Debe estar entre 80% y 100% para cerrar.'
          }
        />
      </section>

      {!usesExternalAvailability ? (
        <TubeMpBalancePanel balance={businessSummary.tubeMpBalance} />
      ) : null}

      {!usesExternalAvailability ? (
        <FamilyYieldPanel
          summary={businessSummary}
          showTunnel={draft.hasTunnelProduction}
        />
      ) : null}

      {closureValidation.blockers.length > 0 || diagnostics.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-900">Validación y diagnóstico</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
            {[
              ...closureValidation.blockers
                .filter((blocker) => blocker.code !== 'TUNNEL_MOVEMENTS_REQUIRED')
                .map((blocker) => blocker.message),
              ...diagnostics.map((diagnostic) => diagnostic.message),
            ]
              .filter((message, index, messages) => messages.indexOf(message) === index)
              .slice(0, 12)
              .map((message) => <li key={message}>• {message}</li>)}
          </ul>
        </div>
      ) : null}

      {saveError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {saveError}
        </div>
      ) : null}

      {isCloseConfirmationOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="yield-warning-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="yield-warning-title" className="text-base font-bold text-slate-950">
                  Rendimientos por debajo del objetivo
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  La jornada está cuadrada, pero existen familias por debajo de su referencia.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {businessSummary.families
                .filter((family) => family.status === 'BELOW_TARGET')
                .map((family) => (
                  <div key={family.key} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    <p className="font-bold">{family.label}</p>
                    <p className="mt-1">
                      Actual: {family.projectedYieldPercent?.toFixed(2)}% · Objetivo: ≥{family.targetPercent?.toFixed(0)}% · Faltan: {formatCentiKg(family.missingToTargetKg100)}
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCloseConfirmationOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Volver a revisar
              </button>
              <button
                type="button"
                onClick={() => persist(true, true)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Cerrar de todas formas
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-3 shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur dark:border-[#2b5268] dark:bg-[#0a1a27] xl:left-64 xl:h-[var(--sidebar-footer-height)] xl:py-0">
        <div className="mx-auto flex w-full max-w-[92.5rem] flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6 xl:h-full xl:px-7 2xl:px-8">
          <div className="flex items-center gap-2" role="status" aria-live="polite">
            {canClose ? <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" /> : <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />}
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-[#f3f8fb]">{footerStatus.title}</p>
              <p className="text-[0.6875rem] text-slate-500 dark:text-[#a5bed0]">{footerStatus.description}</p>
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
