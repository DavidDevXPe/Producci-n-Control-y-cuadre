import { getActiveProducts } from './productCatalogRepository'
import { normalizeProductName } from './productNormalizer'
import type { ProductionCatalogItem } from './productionCatalog'

export type ProductMatchKind = 'EXACT' | 'ALIAS' | 'LIKELY_MATCH' | 'NEW_PRODUCT'

export interface ProductMatch {
  kind: ProductMatchKind
  product?: ProductionCatalogItem
  normalizedName: string
  score?: number
}

export interface ProductFeatures {
  family: string | null
  sizeRange: string | null
  classification: 'POLAR' | 'USA' | 'GENERAL' | null
  presentationTokens: readonly string[]
}

export function extractProductFeatures(value: string): ProductFeatures {
  const normalized = normalizeProductName(value)
  const range = normalized.match(/\b(\d+)\s*(?:G|KG)?\s*(?:-|A)\s*(\d+|UP)\b|\b(\d+)\s*(?:G|KG)?\s*UP\b/)
  return {
    family: ['ALETA', 'MANTO', 'ANILLA', 'NUCA', 'REJO', 'RECORTE', 'CONO'].find((family) => normalized.includes(family)) ?? null,
    sizeRange: range ? range[0].replace(/\s+/g, '') : null,
    classification: normalized.includes('POLAR') ? 'POLAR' : normalized.includes('USA') ? 'USA' : normalized.includes('GENERAL') ? 'GENERAL' : null,
    presentationTokens: normalized.split(' ').filter((token) => /^(SM|SP|ST|CM|E|TTO|STTO|PN)$/.test(token)),
  }
}

function tokenScore(first: string, second: string): number {
  const a = new Set(first.split(' '))
  const b = new Set(second.split(' '))
  const intersection = [...a].filter((token) => b.has(token)).length
  return intersection / Math.max(a.size, b.size)
}

export function matchProduct(productName: string, products: readonly ProductionCatalogItem[] = getActiveProducts()): ProductMatch {
  const normalizedName = normalizeProductName(productName)
  const exact = products.find((product) => product.normalizedName === normalizedName || normalizeProductName(product.productName) === normalizedName)
  if (exact) return { kind: 'EXACT', product: exact, normalizedName, score: 1 }
  const alias = products.find((product) => product.aliases?.some((value) => normalizeProductName(value) === normalizedName))
  if (alias) return { kind: 'ALIAS', product: alias, normalizedName, score: 1 }
  const incomingFeatures = extractProductFeatures(normalizedName)
  const likely = products
    .map((product) => {
      const candidateFeatures = extractProductFeatures(product.normalizedName ?? normalizeProductName(product.productName))
      const conflictingRange = incomingFeatures.sizeRange !== null && candidateFeatures.sizeRange !== null && incomingFeatures.sizeRange !== candidateFeatures.sizeRange
      const conflictingClass = incomingFeatures.classification !== null && candidateFeatures.classification !== null && incomingFeatures.classification !== candidateFeatures.classification
      return {
        product,
        score: conflictingRange || conflictingClass
          ? 0
          : tokenScore(normalizedName, product.normalizedName ?? normalizeProductName(product.productName)),
      }
    })
    .sort((first, second) => second.score - first.score)[0]
  if (likely && likely.score >= 0.82) return { kind: 'LIKELY_MATCH', product: likely.product, normalizedName, score: likely.score }
  return { kind: 'NEW_PRODUCT', normalizedName }
}