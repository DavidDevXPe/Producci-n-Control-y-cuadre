import {
  validateProductionClosure,
  type ProductionClosureValidation,
} from './businessRules'
import { calculateProductionDay } from './calculations'
import type {
  ProductionDay,
  ProductionDayCalculation,
} from './types'

export type ProductionLifecycleStatus = 'DRAFT' | 'CLOSED'

export type ProductionOperationalState =
  | 'DRAFT_REVIEW'
  | 'READY_TO_CLOSE'
  | 'CLOSED_BALANCED'
  | 'CLOSED_REVIEW'

export interface ProductionDayOperationalState {
  readonly lifecycle: ProductionLifecycleStatus
  readonly state: ProductionOperationalState
  readonly calculation: ProductionDayCalculation
  readonly validation: ProductionClosureValidation
  readonly isBalanced: boolean
  readonly canClose: boolean
}

export function getProductionLifecycleStatus(
  productionDay: Pick<ProductionDay, 'status'>,
): ProductionLifecycleStatus {
  return productionDay.status === 'CLOSED' ? 'CLOSED' : 'DRAFT'
}

export function hasPersistedRequiredCaptureData(
  productionDay: ProductionDay,
): boolean {
  if (productionDay.captureRequiredDataComplete !== undefined) {
    return productionDay.captureRequiredDataComplete
  }

  // Closed and historical records predate the explicit capture flag. Existing
  // editable records can be inferred safely only when they contain product rows.
  return productionDay.status === 'CLOSED' || productionDay.lines.length > 0
}

export function getProductionDayOperationalState(
  productionDay: ProductionDay,
): ProductionDayOperationalState {
  const calculation = calculateProductionDay(productionDay)
  const requiredDataComplete = hasPersistedRequiredCaptureData(productionDay)
  const validation = validateProductionClosure(productionDay, calculation, {
    requiredDataComplete,
    inputErrors: [],
  })
  const lifecycle = getProductionLifecycleStatus(productionDay)
  // The mathematical state belongs to the calculation only. Closure rules
  // (general yield, Tube allocation and required fields) are evaluated
  // independently by `canClose` so a balanced draft never appears as if its
  // arithmetic were wrong.
  const isBalanced =
    requiredDataComplete &&
    calculation.status === 'BALANCED'
  const canClose = lifecycle === 'DRAFT' && isBalanced && validation.canClose
  const state: ProductionOperationalState =
    lifecycle === 'CLOSED'
      ? isBalanced
        ? 'CLOSED_BALANCED'
        : 'CLOSED_REVIEW'
      : canClose
        ? 'READY_TO_CLOSE'
        : 'DRAFT_REVIEW'

  return {
    lifecycle,
    state,
    calculation,
    validation,
    isBalanced,
    canClose,
  }
}
