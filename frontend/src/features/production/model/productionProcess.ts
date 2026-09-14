import type { ProductionDay, ProductionProcess } from './types'

export const DEFAULT_PRODUCTION_PROCESS: ProductionProcess = 'PACKING'

export const productionProcessLabels: Readonly<Record<ProductionProcess, string>> = {
  PACKING: 'Envasado',
  FREEZING: 'Congelamiento',
}

export function isProductionProcess(value: unknown): value is ProductionProcess {
  return value === 'PACKING' || value === 'FREEZING'
}

export function getProductionProcess(
  productionDay: Pick<ProductionDay, 'process'>,
): ProductionProcess {
  return isProductionProcess(productionDay.process)
    ? productionDay.process
    : DEFAULT_PRODUCTION_PROCESS
}

export function isPackingProductionDay(
  productionDay: Pick<ProductionDay, 'process'>,
): boolean {
  return getProductionProcess(productionDay) === 'PACKING'
}

export function isFreezingProductionDay(
  productionDay: Pick<ProductionDay, 'process'>,
): boolean {
  return getProductionProcess(productionDay) === 'FREEZING'
}

export function productionDayKey(
  date: string,
  process: ProductionProcess,
): string {
  return `${date}|${process}`
}
