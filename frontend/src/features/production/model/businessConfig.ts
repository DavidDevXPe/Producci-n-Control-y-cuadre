export const GENERAL_MIN_YIELD = 0.8
export const ALETA_TARGET = 0.9
export const REJO_REPRODUCTOR_TARGET = 0.97
export const NUCA_TARGET = 0.45
export const NUCA_BIKINI_REFERENCE = 0.07

export const MANTO_MP_SHARE = 0.5
export const ALETA_MP_SHARE = 0.2
export const REJO_MP_SHARE = 0.15
export const NUCA_MP_SHARE = 0.15

/**
 * Valor provisional. Debe reemplazarse aquí cuando se confirme el porcentaje
 * oficial de rendimiento de Anillas.
 */
export const ANILLAS_YIELD_RATE = 0.425

const BASIS_POINTS = 10_000

export const GENERAL_MIN_YIELD_BPS = Math.round(GENERAL_MIN_YIELD * BASIS_POINTS)
export const ALETA_TARGET_BPS = Math.round(ALETA_TARGET * BASIS_POINTS)
export const REJO_REPRODUCTOR_TARGET_BPS = Math.round(
  REJO_REPRODUCTOR_TARGET * BASIS_POINTS,
)
export const NUCA_TARGET_BPS = Math.round(NUCA_TARGET * BASIS_POINTS)
export const NUCA_BIKINI_REFERENCE_BPS = Math.round(
  NUCA_BIKINI_REFERENCE * BASIS_POINTS,
)
export const MANTO_MP_SHARE_BPS = Math.round(MANTO_MP_SHARE * BASIS_POINTS)
export const ALETA_MP_SHARE_BPS = Math.round(ALETA_MP_SHARE * BASIS_POINTS)
export const REJO_MP_SHARE_BPS = Math.round(REJO_MP_SHARE * BASIS_POINTS)
export const NUCA_MP_SHARE_BPS = Math.round(NUCA_MP_SHARE * BASIS_POINTS)
