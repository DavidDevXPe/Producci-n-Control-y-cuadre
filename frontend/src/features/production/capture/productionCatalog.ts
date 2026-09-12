import { WEEK_36_2026_PRODUCTION_DAYS } from '../data/week36'
import {
  getAnillaYieldClass,
  getProcessOrigin,
  type AnillaYieldClass,
  type ProcessOrigin,
} from '../model/businessConfig'
import type { SummaryGroupId } from '../model/types'

export interface ProductionCatalogItem {
  familyId: string
  familyName: string
  productId: string
  productName: string
  summaryGroupId: SummaryGroupId
  anillaYieldClass?: AnillaYieldClass
  processOrigin?: ProcessOrigin
}

const extraCatalogItems: readonly ProductionCatalogItem[] = [
  {
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'conos-con-piel-crudos',
    productName: 'CONOS CON PIEL CRUDOS CONGELADO BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'MANTO',
  },
  {
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    productId: 'aleta-cruda-ucrania-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO UCRANIA CODIFICADA',
    summaryGroupId: 'ALETA',
  },
  {
    familyId: 'pico',
    familyName: 'PICO',
    productId: 'pico-crudo',
    productName: 'PICO CRUDO CONGELADO BLOCK S/TTO',
    summaryGroupId: 'PICO',
  },
  {
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-block-tratamiento-usa-sm-sp-st',
    productName: 'ANILLAS CRUDAS CONG. BLOCK C/TTO USA SM SP ST',
    summaryGroupId: 'ANILLAS',
  },
]

const catalogByProductId = new Map<string, ProductionCatalogItem>()

for (const day of WEEK_36_2026_PRODUCTION_DAYS) {
  for (const line of day.lines) {
    if (catalogByProductId.has(line.productId)) continue
    const anillaYieldClass = getAnillaYieldClass(line.productId)
    const processOrigin = getProcessOrigin(line.productId)
    catalogByProductId.set(line.productId, {
      familyId: line.familyId,
      familyName: line.familyName,
      productId: line.productId,
      productName: line.productName,
      summaryGroupId: line.summaryGroupId,
      ...(anillaYieldClass ? { anillaYieldClass } : {}),
      ...(processOrigin ? { processOrigin } : {}),
    })
  }
}

for (const item of extraCatalogItems) {
  if (!catalogByProductId.has(item.productId)) {
    const anillaYieldClass = getAnillaYieldClass(item.productId)
    const processOrigin = getProcessOrigin(item.productId)
    catalogByProductId.set(item.productId, {
      ...item,
      ...(anillaYieldClass ? { anillaYieldClass } : {}),
      ...(processOrigin ? { processOrigin } : {}),
    })
  }
}

export const PRODUCTION_CATALOG_ITEMS = [...catalogByProductId.values()].sort(
  (first, second) =>
    first.familyName.localeCompare(second.familyName, 'es-PE') ||
    first.productName.localeCompare(second.productName, 'es-PE'),
)

function normalizeProductName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/gi, ' ')
    .trim()
    .toLocaleUpperCase('es-PE')
}

export function filterProductionCatalogItems(
  query: string,
): readonly ProductionCatalogItem[] {
  const normalizedQuery = normalizeProductName(query)
  if (!normalizedQuery) return PRODUCTION_CATALOG_ITEMS
  const queryWords = normalizedQuery.split(' ')

  return PRODUCTION_CATALOG_ITEMS.filter((item) => {
    const searchableText = normalizeProductName(
      `${item.familyName} ${item.productName}`,
    )
    return queryWords.every((word) => searchableText.includes(word))
  })
}

export function findCatalogItemByName(
  productName: string,
): ProductionCatalogItem | undefined {
  const normalizedName = normalizeProductName(productName)
  return PRODUCTION_CATALOG_ITEMS.find(
    (item) => normalizeProductName(item.productName) === normalizedName,
  )
}
