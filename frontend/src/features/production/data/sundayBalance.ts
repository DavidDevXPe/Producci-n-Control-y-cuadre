import type { BalanceLot } from '../model/types'
import { SATURDAY_PRODUCTION_DAY } from './saturday'

export const SUNDAY_BALANCE_PROCESSING_ID = 'balance-processing-2026-09-06'

/**
 * The supervisor confirmed that every balance generated on Saturday was
 * packaged on Sunday and that the operation contained no new production.
 * The normal operating rule assigns this explicit balance use to the Day shift.
 */
export const SUNDAY_PROCESSED_SATURDAY_BALANCE_LOTS: readonly BalanceLot[] =
  SATURDAY_PRODUCTION_DAY.lines
    .filter((line) => line.newClosingBalanceKg100 > 0)
    .map((line) => ({
      id: `balance-${SATURDAY_PRODUCTION_DAY.id}-${line.productId}`,
      originDayId: SATURDAY_PRODUCTION_DAY.id,
      familyId: line.familyId,
      productId: line.productId,
      originalKg100: line.newClosingBalanceKg100,
      uses: [
        {
          id: `balance-use-${SATURDAY_PRODUCTION_DAY.id}-${line.productId}-sunday-day`,
          targetDayId: SUNDAY_BALANCE_PROCESSING_ID,
          shift: 'DAY' as const,
          kg100: line.newClosingBalanceKg100,
        },
      ],
    }))
