import { kg100, sumKg100 } from './calculations'
import type {
  Kg100,
  ProductionDay,
  ProductionDayCalculation,
  ShiftCode,
} from './types'

export type ProductionMovementType =
  | 'REPORT_DAY'
  | 'REPORT_NIGHT'
  | 'TUNNEL_DAY'
  | 'TUNNEL_NIGHT'
  | 'TREATMENT'
  | 'PREVIOUS_BALANCE_DAY'
  | 'PREVIOUS_BALANCE_NIGHT'
  | 'CLOSING_BALANCE'

export type ProductionStage = 'REPORT' | 'TUNNEL' | 'TREATMENT' | 'PREVIOUS_BALANCE' | 'CLOSING_BALANCE'

export interface ProductionMovement {
  readonly id: string
  readonly dayId: string
  readonly productId: string
  readonly productName: string
  readonly familyId: string
  readonly familyName: string
  readonly movementType: ProductionMovementType
  readonly stage: ProductionStage
  readonly shift: ShiftCode | null
  readonly kg100: Kg100
}

const ZERO = kg100(0)

/**
 * Produces an explicit, stage-aware view without flattening the persisted line.
 * Historical days without tunnelShifts remain valid and expose zero tunnel movements.
 */
export function getProductionMovements(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
): readonly ProductionMovement[] {
  return productionDay.lines.flatMap((line, index) => {
    const product = calculation.products[index]
    const base = {
      dayId: productionDay.id,
      productId: line.productId,
      productName: line.productName,
      familyId: line.familyId,
      familyName: line.familyName,
    }
    const movement = (
      movementType: ProductionMovementType,
      stage: ProductionStage,
      shift: ShiftCode | null,
      value: Kg100,
    ): ProductionMovement => ({
      ...base,
      id: `${productionDay.id}:${line.productId}:${movementType}`,
      movementType,
      stage,
      shift,
      kg100: value,
    })

    return [
      movement(
        'REPORT_DAY',
        'REPORT',
        'DAY',
        product
          ? kg100(product.day.reportedKg100 + product.day.adjustmentKg100)
          : line.shifts.DAY.reportedKg100,
      ),
      movement(
        'REPORT_NIGHT',
        'REPORT',
        'NIGHT',
        product
          ? kg100(product.night.reportedKg100 + product.night.adjustmentKg100)
          : line.shifts.NIGHT.reportedKg100,
      ),
      movement(
        'TUNNEL_DAY',
        'TUNNEL',
        'DAY',
        product?.tunnel.DAY.ownProductionKg100 ??
          line.tunnelShifts?.DAY.reportedKg100 ??
          ZERO,
      ),
      movement(
        'TUNNEL_NIGHT',
        'TUNNEL',
        'NIGHT',
        product?.tunnel.NIGHT.ownProductionKg100 ??
          line.tunnelShifts?.NIGHT.reportedKg100 ??
          ZERO,
      ),
      movement('TREATMENT', 'TREATMENT', null, line.treatmentKg100),
      movement(
        'PREVIOUS_BALANCE_DAY',
        'PREVIOUS_BALANCE',
        'DAY',
        product?.day.previousBalanceProcessedKg100 ?? ZERO,
      ),
      movement(
        'PREVIOUS_BALANCE_NIGHT',
        'PREVIOUS_BALANCE',
        'NIGHT',
        product?.night.previousBalanceProcessedKg100 ?? ZERO,
      ),
      movement(
        'CLOSING_BALANCE',
        'CLOSING_BALANCE',
        null,
        line.newClosingBalanceKg100,
      ),
    ]
  })
}

export function getMovementsByStage(
  movements: readonly ProductionMovement[],
  stage: ProductionStage,
) {
  return movements.filter((movement) => movement.stage === stage)
}

export function getProductTotal(
  movements: readonly ProductionMovement[],
  productId: string,
) {
  return getFinishedProduct(
    movements.filter((movement) => movement.productId === productId),
  )
}

export function getFamilyTotal(
  movements: readonly ProductionMovement[],
  familyIds: readonly string[],
) {
  const accepted = new Set(familyIds)
  return getFinishedProduct(
    movements.filter((movement) => accepted.has(movement.familyId)),
  )
}

export function getTunnelTotals(movements: readonly ProductionMovement[]) {
  const tunnel = getMovementsByStage(movements, 'TUNNEL')
  const dayKg100 = sumKg100(
    tunnel.filter((movement) => movement.shift === 'DAY').map((movement) => movement.kg100),
  )
  const nightKg100 = sumKg100(
    tunnel.filter((movement) => movement.shift === 'NIGHT').map((movement) => movement.kg100),
  )

  return { dayKg100, nightKg100, totalKg100: sumKg100([dayKg100, nightKg100]) }
}

export function getTreatmentTotals(movements: readonly ProductionMovement[]) {
  return sumKg100(getMovementsByStage(movements, 'TREATMENT').map((movement) => movement.kg100))
}

export function getClosingBalanceTotals(movements: readonly ProductionMovement[]) {
  return sumKg100(
    getMovementsByStage(movements, 'CLOSING_BALANCE').map((movement) => movement.kg100),
  )
}

export function getFinishedProduct(movements: readonly ProductionMovement[]) {
  return kg100(
    movements.reduce(
      (total, movement) =>
        total +
        (movement.stage === 'PREVIOUS_BALANCE' ? -movement.kg100 : movement.kg100),
      0,
    ),
  )
}
