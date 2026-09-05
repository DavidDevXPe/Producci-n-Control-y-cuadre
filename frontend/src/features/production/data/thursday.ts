import { kg100 } from '../model/calculations'
import type {
  BalanceLot,
  ProductionDay,
  ProductionLine,
  ShiftProductEntry,
  SummaryGroupId,
} from '../model/types'

const THURSDAY_DAY_ID = 'production-day-2026-09-03'
const WEDNESDAY_DAY_ID = 'production-day-2026-09-02'

const emptyShiftEntry = (reportedKg100: number): ShiftProductEntry => ({
  reportedKg100: kg100(reportedKg100),
  adjustments: [],
})

interface ThursdayLineSeed {
  readonly cell: string
  readonly familyId: string
  readonly familyName: string
  readonly productId: string
  readonly productName: string
  readonly summaryGroupId: SummaryGroupId
  readonly dayOwnKg100: number
  readonly nightOwnKg100: number
  readonly previousBalanceKg100?: number
  readonly treatmentKg100?: number
  readonly balanceKg100?: number
  readonly finishedKg100: number
}

const createLine = (seed: ThursdayLineSeed): ProductionLine => ({
  familyId: seed.familyId,
  familyName: seed.familyName,
  productId: seed.productId,
  productName: seed.productName,
  summaryGroupId: seed.summaryGroupId,
  source: { sheet: 'JUEVES', cell: seed.cell },
  // JUEVES exposes the shift totals and the arithmetic addends but does not
  // label every product addend by shift. This split reconciles exactly with
  // JUEVES!B103:C105; the complete prior balance was processed during Día.
  shiftBreakdownConfidence: 'RECONCILED_INFERENCE',
  shifts: {
    DAY: emptyShiftEntry(seed.dayOwnKg100 + (seed.previousBalanceKg100 ?? 0)),
    NIGHT: emptyShiftEntry(seed.nightOwnKg100),
  },
  treatmentKg100: kg100(seed.treatmentKg100 ?? 0),
  newClosingBalanceKg100: kg100(seed.balanceKg100 ?? 0),
  declaredFinishedKg100: kg100(seed.finishedKg100),
})

const thursdayLineSeeds: readonly ThursdayLineSeed[] = [
  {
    cell: 'B10',
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    productId: 'aleta-cruda-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO CODIFICADA',
    summaryGroupId: 'ALETA',
    dayOwnKg100: 2_719_000,
    nightOwnKg100: 4_689_000,
    previousBalanceKg100: 221_000,
    finishedKg100: 7_408_000,
  },
  {
    cell: 'B15',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-japones-crudo',
    productName:
      'MANTO JAPONÉS CRUDO CONGELADO BLOCK S/TTO 0.5-1 / 1-2 / 2-4 BLANCO + SB + CH',
    summaryGroupId: 'MANTO',
    dayOwnKg100: 1_705_000,
    nightOwnKg100: 3_580_000,
    balanceKg100: 174_000,
    finishedKg100: 5_459_000,
  },
  {
    cell: 'B16',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-estandar-crudo-2-4',
    productName:
      'MANTO ESTÁNDAR CRUDO CONGELADO BLOCK S/TTO 2-4 BLANCO + SB + C/2 MEMB. + CH',
    summaryGroupId: 'MANTO',
    dayOwnKg100: 3_712_000,
    nightOwnKg100: 2_023_000,
    finishedKg100: 5_735_000,
  },
  {
    cell: 'B24',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-segunda-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA SM 2DA MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 0,
    nightOwnKg100: 25_000,
    previousBalanceKg100: 25_000,
    finishedKg100: 25_000,
  },
  {
    cell: 'B25',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-polar-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA POLAR SM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 261_170,
    nightOwnKg100: 1_229_000,
    previousBalanceKg100: 1_108_830,
    balanceKg100: 807_000,
    finishedKg100: 2_297_170,
  },
  {
    cell: 'B26',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-iqf-tratamiento-usa',
    productName: 'ANILLAS CRUDAS CONGELADAS IQF C/TTO USA SM CP ST',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 860,
    finishedKg100: 860,
  },
  {
    cell: 'B27',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-iqf-usa-cm-sp-st',
    productName: 'ANILLAS CRUDAS CONGELADAS IQF C/TTO USA CM SP ST',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 62_000,
    nightOwnKg100: 0,
    finishedKg100: 62_000,
  },
  {
    cell: 'B33',
    familyId: 'boton',
    familyName: 'BOTÓN',
    productId: 'boton-usa-tratamiento',
    productName: 'BOTÓN USA SM CP ST (TRATAMIENTO)',
    summaryGroupId: 'BOTON',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 1_420,
    finishedKg100: 1_420,
  },
  {
    cell: 'B39',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-manto-japones',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO MANTO JAPONÉS 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 139_000,
    nightOwnKg100: 0,
    previousBalanceKg100: 113_000,
    finishedKg100: 139_000,
  },
  {
    cell: 'B41',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-aleta',
    productName: 'RECORTE CRUDO CONGELADO BLOCK S/TTO ALETA 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    balanceKg100: 44_000,
    finishedKg100: 44_000,
  },
  {
    cell: 'B42',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-anillas-sm-sp-st',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM SP ST 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 1_228_000,
    nightOwnKg100: 0,
    previousBalanceKg100: 655_000,
    finishedKg100: 1_228_000,
  },
  {
    cell: 'B45',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recortes-crudos-labios',
    productName: 'RECORTES CRUDOS-LABIOS CONGELADOS BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 104_000,
    nightOwnKg100: 0,
    previousBalanceKg100: 35_000,
    finishedKg100: 104_000,
  },
  {
    cell: 'B49',
    familyId: 'recorte-cocido',
    familyName: 'RECORTE COCIDO',
    productId: 'recorte-cocido-pb',
    productName: 'RECORTE COCIDO BLOCK S/TTO P.B 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    dayOwnKg100: 0,
    nightOwnKg100: 178_000,
    finishedKg100: 178_000,
  },
  {
    cell: 'B51',
    familyId: 'membrana',
    familyName: 'MEMBRANA',
    productId: 'membranas-cocidas',
    productName: 'MEMBRANAS COCIDAS CONGELADAS 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    previousBalanceKg100: 185_000,
    finishedKg100: 0,
  },
  {
    cell: 'B62',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-1-2',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 1-2 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 1_721_000,
    nightOwnKg100: 1_081_000,
    finishedKg100: 2_802_000,
  },
  {
    cell: 'B63',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-2-3',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 2-3 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 7_000,
    nightOwnKg100: 10_000,
    finishedKg100: 17_000,
  },
  {
    cell: 'B66',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-bailarina-500-1000',
    productName:
      'REJO CRUDO CONGELADO BLOCK S/TTO BAILARINA S/R 500-1000 G SEMI LIMPIOS 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 542_000,
    nightOwnKg100: 1_164_000,
    previousBalanceKg100: 200_000,
    finishedKg100: 1_706_000,
  },
  {
    cell: 'B71',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-corona-tratamiento',
    productName: 'REJOS CRUDOS SECCIONADOS 1-2 PARTE CORONA (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 312_400,
    finishedKg100: 312_400,
  },
  {
    cell: 'B72',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-media-tratamiento',
    productName: 'REJOS CRUDOS SECCIONADOS 1-2 PARTE MEDIA (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 289_400,
    finishedKg100: 289_400,
  },
  {
    cell: 'B73',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-terminal-tratamiento',
    productName:
      'REJOS CRUDOS SECCIONADOS 1-2 PARTE TERMINAL (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 55_500,
    finishedKg100: 55_500,
  },
  {
    cell: 'B81',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-50-70',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 50-70 CM 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayOwnKg100: 0,
    nightOwnKg100: 517_000,
    previousBalanceKg100: 118_000,
    finishedKg100: 517_000,
  },
  {
    cell: 'B82',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-70-up',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 70 CM-UP 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayOwnKg100: 0,
    nightOwnKg100: 366_000,
    previousBalanceKg100: 200_000,
    finishedKg100: 366_000,
  },
  {
    cell: 'B92',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-semilimpia-codificada',
    productName: 'NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI LIMPIAS CODIFICADA',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    balanceKg100: 1_200_000,
    finishedKg100: 1_200_000,
  },
  {
    cell: 'B94',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-300-500',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 300-500 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 0,
    nightOwnKg100: 280_000,
    previousBalanceKg100: 126_000,
    balanceKg100: 38_000,
    finishedKg100: 318_000,
  },
  {
    cell: 'B95',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-500-700',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 500-700 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 0,
    nightOwnKg100: 614_000,
    previousBalanceKg100: 548_000,
    balanceKg100: 79_000,
    finishedKg100: 693_000,
  },
  {
    cell: 'B96',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-700-up',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 700-UP 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 0,
    nightOwnKg100: 605_000,
    previousBalanceKg100: 495_000,
    balanceKg100: 35_000,
    finishedKg100: 640_000,
  },
]

export const THURSDAY_LINES: readonly ProductionLine[] =
  thursdayLineSeeds.map(createLine)

const createReceivedBalanceLot = (seed: ThursdayLineSeed): BalanceLot => ({
  id: `balance-${WEDNESDAY_DAY_ID}-${seed.productId}`,
  originDayId: WEDNESDAY_DAY_ID,
  familyId: seed.familyId,
  productId: seed.productId,
  originalKg100: kg100(seed.previousBalanceKg100 ?? 0),
  uses: [
    {
      id: `balance-use-${THURSDAY_DAY_ID}-${seed.productId}`,
      targetDayId: THURSDAY_DAY_ID,
      shift: 'DAY',
      kg100: kg100(seed.previousBalanceKg100 ?? 0),
    },
  ],
})

export const THURSDAY_RECEIVED_BALANCE_LOTS: readonly BalanceLot[] =
  thursdayLineSeeds
    .filter((seed) => (seed.previousBalanceKg100 ?? 0) > 0)
    .map(createReceivedBalanceLot)

/**
 * Closed production day reconstructed from JUEVES. Quantities are integer
 * hundredths of kg; no value from another weekday is introduced.
 */
export const THURSDAY_PRODUCTION_DAY: ProductionDay = {
  id: THURSDAY_DAY_ID,
  date: '2026-09-03',
  displayName: 'Jueves 03/09/2026',
  status: 'CLOSED',
  rawMaterialEntries: [
    {
      id: 'raw-material-2026-09-03-1',
      kg100: kg100(20_494_700),
      shift: null,
    },
    {
      id: 'raw-material-2026-09-03-2',
      kg100: kg100(20_516_900),
      shift: null,
    },
  ],
  declaredRawMaterialKg100: kg100(41_011_600),
  declaredShiftTotalsKg100: {
    DAY: kg100(16_230_000),
    NIGHT: kg100(16_361_000),
  },
  declaredFinishedTotalKg100: kg100(31_597_750),
  lines: THURSDAY_LINES,
  receivedBalanceLots: THURSDAY_RECEIVED_BALANCE_LOTS,
  nucaWashAuthorization: {
    kind: 'USER_CONFIRMED_ORDER',
    reference: null,
    reason:
      'La jornada cerrada del jueves registra producción de Nuca Bikini; el Excel no expone el número de pedido.',
  },
  performanceReferenceBasisPoints: 8_000,
  nucaBikiniReferenceBasisPoints: 700,
  rawMaterialAllocationOverridesKg100: {
    // JUEVES!C85, asignación explícita del bloque Reproductor.
    REPRODUCTOR: kg100(895_584),
  },
}

export const thursdayProductionDay = THURSDAY_PRODUCTION_DAY
