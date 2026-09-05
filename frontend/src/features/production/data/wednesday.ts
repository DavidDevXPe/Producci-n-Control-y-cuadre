import { kg100 } from '../model/calculations'
import type {
  ProductionDay,
  ProductionLine,
  ShiftProductEntry,
  SummaryGroupId,
} from '../model/types'

const emptyShiftEntry = (reportedKg100: number): ShiftProductEntry => ({
  reportedKg100: kg100(reportedKg100),
  adjustments: [],
})

interface WednesdayLineSeed {
  readonly cell: string
  readonly familyId: string
  readonly familyName: string
  readonly productId: string
  readonly productName: string
  readonly summaryGroupId: SummaryGroupId
  readonly dayKg100: number
  readonly nightKg100: number
  readonly treatmentKg100: number
  readonly balanceKg100: number
  readonly finishedKg100: number
}

const createLine = (seed: WednesdayLineSeed): ProductionLine => ({
  familyId: seed.familyId,
  familyName: seed.familyName,
  productId: seed.productId,
  productName: seed.productName,
  summaryGroupId: seed.summaryGroupId,
  source: { sheet: 'MIÉRCOLES', cell: seed.cell },
  // The two shift totals are a unique arithmetic reconciliation of the
  // unlabeled addends in the sheet formulas. Balance and treatment are explicit.
  shiftBreakdownConfidence: 'RECONCILED_INFERENCE',
  shifts: {
    DAY: emptyShiftEntry(seed.dayKg100),
    NIGHT: emptyShiftEntry(seed.nightKg100),
  },
  treatmentKg100: kg100(seed.treatmentKg100),
  newClosingBalanceKg100: kg100(seed.balanceKg100),
  declaredFinishedKg100: kg100(seed.finishedKg100),
})

/**
 * Every non-zero product line in MIÉRCOLES. Values are integer hundredths of kg.
 */
export const WEDNESDAY_LINES: readonly ProductionLine[] = [
  createLine({
    cell: 'B10',
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    productId: 'aleta-cruda-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO CODIFICADA',
    summaryGroupId: 'ALETA',
    dayKg100: 2_001_000,
    nightKg100: 3_612_000,
    treatmentKg100: 0,
    balanceKg100: 221_000,
    finishedKg100: 5_834_000,
  }),
  createLine({
    cell: 'B15',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-japones-crudo',
    productName:
      'MANTO JAPONÉS CRUDO CONGELADO BLOCK S/TTO 0.5-1 / 1-2 / 2-4 BLANCO + SB + CH',
    summaryGroupId: 'MANTO',
    dayKg100: 1_475_000,
    nightKg100: 2_460_000,
    treatmentKg100: 0,
    balanceKg100: 0,
    finishedKg100: 3_935_000,
  }),
  createLine({
    cell: 'B16',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-estandar-crudo-2-4',
    productName:
      'MANTO ESTÁNDAR CRUDO CONGELADO BLOCK S/TTO 2-4 BLANCO + SB + C/2 MEMB. + CH',
    summaryGroupId: 'MANTO',
    dayKg100: 1_203_000,
    nightKg100: 1_733_000,
    treatmentKg100: 0,
    balanceKg100: 0,
    finishedKg100: 2_936_000,
  }),
  createLine({
    cell: 'B24',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-segunda-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA SM 2DA MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayKg100: 0,
    nightKg100: 8_000,
    treatmentKg100: 0,
    balanceKg100: 25_000,
    finishedKg100: 33_000,
  }),
  createLine({
    cell: 'B25',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-polar-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA POLAR SM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayKg100: 453_000,
    nightKg100: 952_000,
    treatmentKg100: 0,
    balanceKg100: 1_108_830,
    finishedKg100: 2_513_830,
  }),
  createLine({
    cell: 'B26',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-iqf-tratamiento-usa',
    productName: 'ANILLAS CRUDAS CONGELADAS IQF C/TTO USA SM CP ST',
    summaryGroupId: 'ANILLAS',
    dayKg100: 0,
    nightKg100: 0,
    treatmentKg100: 15_170,
    balanceKg100: 0,
    finishedKg100: 15_170,
  }),
  createLine({
    cell: 'B32',
    familyId: 'boton',
    familyName: 'BOTÓN',
    productId: 'boton-usa-tratamiento',
    productName: 'BOTÓN USA SM CP ST (TRATAMIENTO)',
    summaryGroupId: 'BOTON',
    dayKg100: 0,
    nightKg100: 0,
    treatmentKg100: 2_500,
    balanceKg100: 0,
    finishedKg100: 2_500,
  }),
  createLine({
    cell: 'B33',
    familyId: 'boton',
    familyName: 'BOTÓN',
    productId: 'boton-espana-iqf',
    productName: 'BOTÓN ESPAÑA SM SP ST (IQF)',
    summaryGroupId: 'BOTON',
    dayKg100: 0,
    nightKg100: 0,
    // D103 includes the complete Botón subtotal in Tratamiento.
    treatmentKg100: 213_000,
    balanceKg100: 0,
    finishedKg100: 213_000,
  }),
  createLine({
    cell: 'B38',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-manto-japones',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO MANTO JAPONÉS 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayKg100: 58_000,
    nightKg100: 145_000,
    treatmentKg100: 0,
    balanceKg100: 113_000,
    finishedKg100: 316_000,
  }),
  createLine({
    cell: 'B41',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-anillas-sm-sp-st',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM SP ST 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayKg100: 251_000,
    nightKg100: 690_000,
    treatmentKg100: 0,
    balanceKg100: 655_000,
    finishedKg100: 1_596_000,
  }),
  createLine({
    cell: 'B44',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recortes-crudos-labios',
    productName: 'RECORTES CRUDOS-LABIOS CONGELADOS BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayKg100: 26_000,
    nightKg100: 40_000,
    treatmentKg100: 0,
    balanceKg100: 35_000,
    finishedKg100: 101_000,
  }),
  createLine({
    cell: 'B50',
    familyId: 'membrana',
    familyName: 'MEMBRANA',
    productId: 'membranas-cocidas',
    productName: 'MEMBRANAS COCIDAS CONGELADAS 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    dayKg100: 0,
    nightKg100: 0,
    treatmentKg100: 0,
    balanceKg100: 185_000,
    finishedKg100: 185_000,
  }),
  createLine({
    cell: 'B62',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-2-3',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 2-3 100% P.N.',
    summaryGroupId: 'REJOS',
    dayKg100: 0,
    nightKg100: 15_000,
    treatmentKg100: 0,
    balanceKg100: 0,
    finishedKg100: 15_000,
  }),
  createLine({
    cell: 'B65',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-bailarina-500-1000',
    productName:
      'REJO CRUDO CONGELADO BLOCK S/TTO BAILARINA S/R 500-1000 G SEMI LIMPIOS 100% P.N.',
    summaryGroupId: 'REJOS',
    dayKg100: 517_000,
    nightKg100: 523_000,
    treatmentKg100: 0,
    balanceKg100: 200_000,
    finishedKg100: 1_240_000,
  }),
  createLine({
    cell: 'B70',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-corona-tratamiento',
    productName: 'REJOS CRUDOS SECCIONADOS 1-2 PARTE CORONA (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayKg100: 0,
    nightKg100: 0,
    treatmentKg100: 1_300_200,
    balanceKg100: 0,
    finishedKg100: 1_300_200,
  }),
  createLine({
    cell: 'B71',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-media-tratamiento',
    productName: 'REJOS CRUDOS SECCIONADOS 1-2 PARTE MEDIA (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayKg100: 0,
    nightKg100: 0,
    treatmentKg100: 585_800,
    balanceKg100: 0,
    finishedKg100: 585_800,
  }),
  createLine({
    cell: 'B72',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-terminal-tratamiento',
    productName:
      'REJOS CRUDOS SECCIONADOS 1-2 PARTE TERMINAL (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayKg100: 0,
    nightKg100: 0,
    treatmentKg100: 29_800,
    balanceKg100: 0,
    finishedKg100: 29_800,
  }),
  createLine({
    cell: 'B75',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'rejos-reproductor-tratamiento',
    productName: 'REJOS REPRODUCTOR (EN TRATAMIENTO)',
    // The Excel row belongs to the main Rejos formula block.
    summaryGroupId: 'REJOS',
    dayKg100: 0,
    nightKg100: 0,
    treatmentKg100: 4_500,
    balanceKg100: 0,
    finishedKg100: 4_500,
  }),
  createLine({
    cell: 'B80',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-50-70',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 50-70 CM 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayKg100: 30_000,
    nightKg100: 202_000,
    treatmentKg100: 0,
    balanceKg100: 118_000,
    finishedKg100: 350_000,
  }),
  createLine({
    cell: 'B81',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-70-up',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 70 CM-UP 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayKg100: 260_000,
    nightKg100: 441_000,
    treatmentKg100: 0,
    balanceKg100: 200_000,
    finishedKg100: 901_000,
  }),
  createLine({
    cell: 'B93',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-300-500',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 300-500 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayKg100: 70_000,
    nightKg100: 75_000,
    treatmentKg100: 0,
    balanceKg100: 126_000,
    finishedKg100: 271_000,
  }),
  createLine({
    cell: 'B94',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-500-700',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 500-700 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayKg100: 212_000,
    nightKg100: 302_000,
    treatmentKg100: 0,
    balanceKg100: 548_000,
    finishedKg100: 1_062_000,
  }),
  createLine({
    cell: 'B95',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-700-up',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 700-UP 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayKg100: 212_000,
    nightKg100: 235_000,
    treatmentKg100: 0,
    balanceKg100: 495_000,
    finishedKg100: 942_000,
  }),
]

export const WEDNESDAY_PRODUCTION_DAY: ProductionDay = {
  id: 'production-day-2026-09-02',
  date: '2026-09-02',
  displayName: 'Miércoles 02/09/2026',
  status: 'BALANCED',
  rawMaterialEntries: [
    {
      id: 'raw-material-2026-09-02-1',
      kg100: kg100(15_426_400),
      shift: null,
    },
    {
      id: 'raw-material-2026-09-02-2',
      kg100: kg100(16_917_600),
      shift: null,
    },
  ],
  declaredRawMaterialKg100: kg100(32_344_000),
  declaredShiftTotalsKg100: {
    DAY: kg100(6_768_000),
    NIGHT: kg100(11_433_000),
  },
  declaredFinishedTotalKg100: kg100(24_381_800),
  lines: WEDNESDAY_LINES,
  // MIÉRCOLES documents the balance it generates, not a received balance lot.
  receivedBalanceLots: [],
  nucaWashAuthorization: {
    kind: 'USER_CONFIRMED_ORDER',
    reference: null,
    reason:
      'El usuario confirmó que la Nuca Bikini solo se lava cuando existe pedido; el Excel no incluye su número.',
  },
  performanceReferenceBasisPoints: 8_000,
  nucaBikiniReferenceBasisPoints: 700,
  rawMaterialAllocationOverridesKg100: {
    // MIÉRCOLES!C84. Kept explicit because its source formula is not established.
    REPRODUCTOR: kg100(1_371_202),
  },
}

export const wednesdayProductionDay = WEDNESDAY_PRODUCTION_DAY
