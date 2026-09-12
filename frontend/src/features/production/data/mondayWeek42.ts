import { kg100 } from '../model/calculations'
import type {
  ProductionDay,
  ProductionLine,
  ShiftProductEntry,
  SummaryGroupId,
} from '../model/types'

const MONDAY_DAY_ID = 'production-day-2026-09-07'

const emptyShiftEntry = (reportedKg100: number): ShiftProductEntry => ({
  reportedKg100: kg100(reportedKg100),
  adjustments: [],
})

interface MondayLineSeed {
  readonly familyId: string
  readonly familyName: string
  readonly productId: string
  readonly productName: string
  readonly summaryGroupId: SummaryGroupId
  readonly dayKg100?: number
  readonly nightKg100?: number
  readonly treatmentKg100?: number
  readonly closingBalanceKg100?: number
}
const mondayLineSeeds: readonly MondayLineSeed[] = [
  {
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    productId: 'aleta-cruda-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO CODIFICADA',
    summaryGroupId: 'ALETA',
    dayKg100: 4_702_000,
    nightKg100: 4_938_000,
    closingBalanceKg100: 1_500_000,
  },
  {
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-japones-crudo',
    productName:
      'MANTO JAPONÉS CRUDO CONGELADO BLOCK S/TTO 0.5-1 / 1-2 / 2-4 BLANCO + SB + CH',
    summaryGroupId: 'MANTO',
    dayKg100: 5_739_000,
    nightKg100: 2_732_000,
  },
  {
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-estandar-crudo-2-4',
    productName:
      'MANTO ESTÁNDAR CRUDO CONGELADO BLOCK S/TTO 2-4 BLANCO + SB + C/2 MEMB. + CH',
    summaryGroupId: 'MANTO',
    dayKg100: 5_328_000,
    nightKg100: 2_750_000,
    closingBalanceKg100: 1_500_000,
  },
  {
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'conos-con-piel-crudos',
    productName: 'CONOS CON PIEL CRUDOS CONGELADO BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'MANTO',
    dayKg100: 39_000,
    nightKg100: 413_000,
  },
  {
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-segunda-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA SM 2DA MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayKg100: 26_000,
    nightKg100: 27_000,
  },
  {
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-p-cm-sp-st-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    nightKg100: 31_000,
  },
  {
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-polar-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA POLAR SM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayKg100: 1_030_000,
    nightKg100: 1_183_000,
  },
  {
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-manto-japones',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO MANTO JAPONÉS 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    nightKg100: 179_000,
  },
  {
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-aleta',
    productName: 'RECORTE CRUDO CONGELADO BLOCK S/TTO ALETA 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    nightKg100: 19_000,
  },
  {
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-anillas-sm-sp-st',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM SP ST 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayKg100: 541_000,
    nightKg100: 586_000,
  },
  {
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recortes-crudos-labios',
    productName: 'RECORTES CRUDOS-LABIOS CONGELADOS BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    nightKg100: 140_000,
  },
  {
    familyId: 'recorte-cocido',
    familyName: 'RECORTE COCIDO',
    productId: 'recorte-cocido-pb',
    productName: 'RECORTE COCIDO BLOCK S/TTO P.B 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    nightKg100: 114_000,
  },
  {
    familyId: 'membrana',
    familyName: 'MEMBRANA',
    productId: 'membranas-cocidas',
    productName: 'MEMBRANAS COCIDAS CONGELADAS 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    nightKg100: 76_000,
  },
  {
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-1-2',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 1-2 100% P.N.',
    summaryGroupId: 'REJOS',
    dayKg100: 319_000,
    nightKg100: 3_174_000,
    closingBalanceKg100: 1_018_200,
  },
  {
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-2-3',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 2-3 100% P.N.',
    summaryGroupId: 'REJOS',
    nightKg100: 51_000,
  },
  {
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-bailarina-500-1000',
    productName:
      'REJO CRUDO CONGELADO BLOCK S/TTO BAILARINA S/R 500-1000 G SEMI LIMPIOS 100% P.N.',
    summaryGroupId: 'REJOS',
    dayKg100: 1_131_000,
    nightKg100: 1_434_000,
    closingBalanceKg100: 322_300,
  },
  {
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-50-70',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 50-70 CM 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    nightKg100: 121_000,
    closingBalanceKg100: 82_700,
  },
  {
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-70-up',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 70 CM-UP 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayKg100: 747_000,
    nightKg100: 464_000,
    closingBalanceKg100: 121_800,
  },
  {
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-300-500',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 300-500 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayKg100: 21_000,
    nightKg100: 123_000,
  },
  {
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-500-700',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 500-700 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayKg100: 160_000,
    nightKg100: 218_000,
    closingBalanceKg100: 300_000,
  },
  {
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-700-up',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 700-UP 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayKg100: 150_000,
    nightKg100: 454_000,
    closingBalanceKg100: 400_000,
  },
  {
    familyId: 'nuca-semilimpia',
    familyName: 'NUCA SEMILIMPIA',
    productId: 'nuca-semilimpia-codificada',
    productName: 'NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI LIMPIAS CODIFICADA',
    summaryGroupId: 'NUCA_SEMILIMPIA',
    dayKg100: 2_414_000,
    nightKg100: 1_342_000,
    closingBalanceKg100: 800_000,
  },
  {
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-terminal-tratamiento',
    productName:
      'REJOS CRUDOS SECCIONADOS 1-2 PARTE TERMINAL (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    treatmentKg100: 19_500,
  },
  {
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-block-tratamiento-usa-sm-cp-st',
    productName: 'ANILLAS CRUDAS CONGELADAS BLOCK C/TTO USA SM CP ST',
    summaryGroupId: 'ANILLAS',
    treatmentKg100: 4_500,
  },
  {
    familyId: 'boton',
    familyName: 'BOTÓN',
    productId: 'boton-espana-sm-sp-tratamiento',
    productName: 'BOTÓN ESPAÑA SM SP ST (TRATAMIENTO)',
    summaryGroupId: 'BOTON',
    treatmentKg100: 291_300,
  },
]

const createLine = (seed: MondayLineSeed, index: number): ProductionLine => {
  const dayKg100 = seed.dayKg100 ?? 0
  const nightKg100 = seed.nightKg100 ?? 0
  const treatmentKg100 = seed.treatmentKg100 ?? 0
  const closingBalanceKg100 = seed.closingBalanceKg100 ?? 0

  return {
    familyId: seed.familyId,
    familyName: seed.familyName,
    productId: seed.productId,
    productName: seed.productName,
    summaryGroupId: seed.summaryGroupId,
    source: { sheet: 'CAPTURA WEB', cell: `PRODUCTO ${index + 1}` },
    shiftBreakdownConfidence: 'EXPLICIT',
    shifts: {
      DAY: emptyShiftEntry(dayKg100),
      NIGHT: emptyShiftEntry(nightKg100),
    },
    treatmentKg100: kg100(treatmentKg100),
    newClosingBalanceKg100: kg100(closingBalanceKg100),
    declaredFinishedKg100: kg100(
      dayKg100 + nightKg100 + treatmentKg100 + closingBalanceKg100,
    ),
  }
}

export const MONDAY_WEEK_42_LINES: readonly ProductionLine[] =
  mondayLineSeeds.map(createLine)

/**
 * Closed Monday exported by the web app and validated against
 * TRABUNDA_Produccion_2026-09-07.xlsx.
 */
export const MONDAY_WEEK_42_PRODUCTION_DAY: ProductionDay = {
  id: MONDAY_DAY_ID,
  date: '2026-09-07',
  displayName: 'Lunes 07/09/2026',
  status: 'CLOSED',
  rawMaterialEntries: [
    {
      id: 'raw-material-2026-09-07-1',
      kg100: kg100(61_523_900),
      shift: null,
    },
  ],
  declaredRawMaterialKg100: kg100(61_523_900),
  declaredShiftTotalsKg100: {
    DAY: kg100(22_347_000),
    NIGHT: kg100(20_569_000),
  },
  declaredFinishedTotalKg100: kg100(49_276_300),
  hasTunnelProduction: false,
  lines: MONDAY_WEEK_42_LINES,
  receivedBalanceLots: [],
  nucaWashAuthorization: {
    kind: 'USER_CONFIRMED_ORDER',
    reference: null,
    reason: 'Pedido de lavado confirmado durante la captura web.',
  },
  performanceReferenceBasisPoints: 8_000,
  nucaBikiniReferenceBasisPoints: 700,
  rawMaterialAllocationOverridesKg100: {},
}
