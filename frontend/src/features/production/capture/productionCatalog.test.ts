import { describe, expect, it } from 'vitest'

import {
  filterProductionCatalogItems,
  PRODUCTION_CATALOG_ITEMS,
} from './productionCatalog'

describe('production catalog filtering', () => {
  it.each(['aleta', 'MANTO', 'nuca', 'semi limpia'])(
    'filters the catalog while typing %s',
    (query) => {
      const matches = filterProductionCatalogItems(query)
      const normalizedQuery = query.toLocaleUpperCase('es-PE')

      expect(matches.length).toBeGreaterThan(0)
      expect(
        matches.every((product) =>
          `${product.familyName} ${product.productName}`
            .toLocaleUpperCase('es-PE')
            .includes(normalizedQuery),
        ),
      ).toBe(true)
    },
  )

  it('returns the complete catalog for an empty search', () => {
    expect(filterProductionCatalogItems('')).toHaveLength(
      PRODUCTION_CATALOG_ITEMS.length,
    )
  })

  it('ignores accents while filtering', () => {
    expect(filterProductionCatalogItems('japones')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: 'manto-japones-crudo' }),
      ]),
    )
  })

  it('accepts multiple words even when they are not consecutive', () => {
    expect(filterProductionCatalogItems('aleta codificada')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: 'aleta-cruda-codificada' }),
      ]),
    )
  })
})
