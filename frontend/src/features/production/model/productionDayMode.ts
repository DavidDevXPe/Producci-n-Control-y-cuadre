import type { ProductionDay, ProductionDayOperationMode } from './types'

export function isSundayIsoDate(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay() === 0
}

export function getProductionDayOperationMode(
  productionDay: Pick<ProductionDay, 'operationMode'>,
): ProductionDayOperationMode {
  return productionDay.operationMode ?? 'NORMAL'
}

export function isBalanceOnlyProductionDay(
  productionDay: Pick<ProductionDay, 'operationMode'>,
): boolean {
  return getProductionDayOperationMode(productionDay) === 'BALANCE_ONLY'
}
