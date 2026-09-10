/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getOperationalWeekContext,
  getOperationalWeekContextByNumber,
  getOperationalWeekContextForIsoDate,
} from '../../../utils/operationalContext'
import {
  WEEK_36_2026_PRODUCTION_DAYS,
  WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
} from '../data/week36'
import type {
  BalanceLot,
  ProductionDay,
  WeeklySummaryPeriod,
} from '../model/types'

const DAYS_STORAGE_KEY = 'trabunda-production-days-v1'
const ACTIVE_WEEK_STORAGE_KEY = 'trabunda-active-operational-week-v1'
const HISTORICAL_WEEK_NUMBER = 41

export interface OperationalCalendarDay {
  label: string
  date: string
  isoDate: string
}

export interface OperationalWeekView {
  number: number
  period: WeeklySummaryPeriod
  calendarDays: readonly OperationalCalendarDay[]
  productionDays: readonly ProductionDay[]
  isHistorical: boolean
}

interface ProductionDataValue {
  activeWeek: OperationalWeekView
  activeWeekNumber: number
  availableWeekNumbers: readonly number[]
  allProductionDays: readonly ProductionDay[]
  subsequentBalanceLots: readonly BalanceLot[]
  setActiveWeekNumber: (weekNumber: number) => void
  findProductionDay: (date: string) => ProductionDay | undefined
  isUserManagedDay: (date: string) => boolean
  upsertProductionDay: (productionDay: ProductionDay) => void
}

const weekdayFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  timeZone: 'UTC',
})

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase('es-PE') + value.slice(1)
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function buildCalendarDays(period: WeeklySummaryPeriod): readonly OperationalCalendarDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const isoDate = addDays(period.startDate, index)
    return {
      label: capitalize(
        weekdayFormatter.format(new Date(`${isoDate}T00:00:00Z`)),
      ),
      date: formatShortDate(isoDate),
      isoDate,
    }
  })
}

function isProductionDay(value: unknown): value is ProductionDay {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProductionDay>

  return (
    typeof candidate.id === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date ?? '') &&
    typeof candidate.displayName === 'string' &&
    Array.isArray(candidate.rawMaterialEntries) &&
    Array.isArray(candidate.lines) &&
    Array.isArray(candidate.receivedBalanceLots) &&
    typeof candidate.declaredRawMaterialKg100 === 'number' &&
    typeof candidate.declaredFinishedTotalKg100 === 'number'
  )
}

function normalizeNucaClassification(day: ProductionDay): ProductionDay {
  const semilimpiaProductIds = new Set(
    day.lines
      .filter((line) =>
        line.productName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleUpperCase('es-PE')
          .includes('SEMI LIMPI'),
      )
      .map((line) => line.productId),
  )

  if (semilimpiaProductIds.size === 0) return day

  return {
    ...day,
    lines: day.lines.map((line) =>
      semilimpiaProductIds.has(line.productId)
        ? {
            ...line,
            familyId: 'nuca-semilimpia',
            familyName: 'NUCA SEMILIMPIA',
            summaryGroupId: 'NUCA_SEMILIMPIA',
          }
        : line,
    ),
    receivedBalanceLots: day.receivedBalanceLots.map((lot) =>
      semilimpiaProductIds.has(lot.productId)
        ? { ...lot, familyId: 'nuca-semilimpia' }
        : lot,
    ),
  }
}

function loadStoredDays(): readonly ProductionDay[] {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(DAYS_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter(isProductionDay).map(normalizeNucaClassification)
      : []
  } catch {
    return []
  }
}

function getInitialActiveWeek(): number {
  const currentWeek = getOperationalWeekContext(new Date()).number
  if (typeof window === 'undefined') return currentWeek

  const storedWeek = Number(window.localStorage.getItem(ACTIVE_WEEK_STORAGE_KEY))
  if (
    Number.isSafeInteger(storedWeek) &&
    storedWeek >= HISTORICAL_WEEK_NUMBER
  ) {
    return storedWeek
  }

  try {
    window.localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, String(currentWeek))
  } catch {
    // The valid week is still used when storage is unavailable.
  }
  return currentWeek
}

function sortDays(days: readonly ProductionDay[]): readonly ProductionDay[] {
  return [...days].sort((first, second) => first.date.localeCompare(second.date))
}

function buildWeekView(
  number: number,
  userDays: readonly ProductionDay[],
): OperationalWeekView {
  const { period } = getOperationalWeekContextByNumber(number)
  const productionDays =
    number === HISTORICAL_WEEK_NUMBER
      ? WEEK_36_2026_PRODUCTION_DAYS
      : userDays.filter(
          (day) =>
            day.date >= period.startDate && day.date <= period.endDate,
        )

  return {
    number,
    period,
    calendarDays: buildCalendarDays(period),
    productionDays: sortDays(productionDays),
    isHistorical: number === HISTORICAL_WEEK_NUMBER,
  }
}

const historicalWeek = buildWeekView(HISTORICAL_WEEK_NUMBER, [])

const fallbackValue: ProductionDataValue = {
  activeWeek: historicalWeek,
  activeWeekNumber: HISTORICAL_WEEK_NUMBER,
  availableWeekNumbers: [HISTORICAL_WEEK_NUMBER, 42],
  allProductionDays: WEEK_36_2026_PRODUCTION_DAYS,
  subsequentBalanceLots: WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
  setActiveWeekNumber: () => undefined,
  findProductionDay: (date) =>
    WEEK_36_2026_PRODUCTION_DAYS.find((day) => day.date === date),
  isUserManagedDay: () => false,
  upsertProductionDay: () => {
    throw new Error('ProductionDataProvider is required to save production days.')
  },
}

const ProductionDataContext = createContext<ProductionDataValue>(fallbackValue)

interface ProductionDataProviderProps {
  children: ReactNode
}

export function ProductionDataProvider({ children }: ProductionDataProviderProps) {
  const [userDays, setUserDays] = useState<readonly ProductionDay[]>(loadStoredDays)
  const [activeWeekNumber, setActiveWeekNumberState] =
    useState(getInitialActiveWeek)

  const setActiveWeekNumber = useCallback((weekNumber: number) => {
    setActiveWeekNumberState(weekNumber)
    try {
      window.localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, String(weekNumber))
    } catch {
      // The selection remains available during this browser session.
    }
  }, [])

  const upsertProductionDay = useCallback((productionDay: ProductionDay) => {
    const week = getOperationalWeekContextForIsoDate(productionDay.date)
    if (week.number === HISTORICAL_WEEK_NUMBER) {
      throw new Error('La semana histórica 41 es de solo lectura.')
    }

    setUserDays((current) => {
      const next = sortDays([
        ...current.filter((day) => day.date !== productionDay.date),
        productionDay,
      ])

      try {
        window.localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        throw new Error('El navegador no permitió guardar la jornada localmente.')
      }

      return next
    })
    setActiveWeekNumber(week.number)
  }, [setActiveWeekNumber])

  const value = useMemo<ProductionDataValue>(() => {
    const currentWeekNumber = getOperationalWeekContext(new Date()).number
    const effectiveActiveWeekNumber =
      Number.isSafeInteger(activeWeekNumber) &&
      activeWeekNumber >= HISTORICAL_WEEK_NUMBER
        ? activeWeekNumber
        : currentWeekNumber
    const availableWeekNumbers = [
      ...new Set([
        HISTORICAL_WEEK_NUMBER,
        currentWeekNumber,
        effectiveActiveWeekNumber,
        ...userDays.map(
          (day) => getOperationalWeekContextForIsoDate(day.date).number,
        ),
      ]),
    ].sort((first, second) => second - first)
    const allProductionDays = sortDays([
      ...WEEK_36_2026_PRODUCTION_DAYS,
      ...userDays.filter(
        (day) =>
          getOperationalWeekContextForIsoDate(day.date).number !==
          HISTORICAL_WEEK_NUMBER,
      ),
    ])

    return {
      activeWeek: buildWeekView(effectiveActiveWeekNumber, userDays),
      activeWeekNumber: effectiveActiveWeekNumber,
      availableWeekNumbers,
      allProductionDays,
      subsequentBalanceLots: WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
      setActiveWeekNumber,
      findProductionDay: (date) =>
        allProductionDays.find((day) => day.date === date),
      isUserManagedDay: (date) => userDays.some((day) => day.date === date),
      upsertProductionDay,
    }
  }, [activeWeekNumber, setActiveWeekNumber, upsertProductionDay, userDays])

  return (
    <ProductionDataContext.Provider value={value}>
      {children}
    </ProductionDataContext.Provider>
  )
}

export function useProductionData(): ProductionDataValue {
  return useContext(ProductionDataContext)
}
