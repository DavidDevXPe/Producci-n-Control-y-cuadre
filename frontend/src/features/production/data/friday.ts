import { kg100 } from '../model/calculations'
import type {
  BalanceLot,
  ProductionDay,
  ProductionLine,
  ShiftProductEntry,
  SummaryGroupId,
} from '../model/types'

const FRIDAY_DAY_ID = 'production-day-2026-09-04'
const THURSDAY_DAY_ID = 'production-day-2026-09-03'

const emptyShiftEntry = (reportedKg100: number): ShiftProductEntry => ({
  reportedKg100: kg100(reportedKg100),
  adjustments: [],
})

interface FridayLineSeed {
  readonly cell: string
  readonly familyId: string
  readonly familyName: string
  readonly productId: string
  readonly productName: string
  readonly summaryGroupId: SummaryGroupId
  readonly dayOwnKg100: number
  readonly nightOwnKg100: number
  readonly receivedBalanceKg100?: number
  readonly processedPreviousBalanceKg100?: number
  readonly treatmentKg100?: number
  readonly balanceKg100?: number
  readonly finishedKg100: number
}

const createLine = (seed: FridayLineSeed): ProductionLine => ({
  familyId: seed.familyId,
  familyName: seed.familyName,
  productId: seed.productId,
  productName: seed.productName,
  summaryGroupId: seed.summaryGroupId,
  source: { sheet: 'VIERNES', cell: seed.cell },
  // The sheet exposes only the two aggregate shift totals. Product splits are
  // reconciled from the arithmetic addends without changing the declared total.
  shiftBreakdownConfidence: 'RECONCILED_INFERENCE',
  shifts: {
    DAY: emptyShiftEntry(
      seed.dayOwnKg100 + (seed.processedPreviousBalanceKg100 ?? 0),
    ),
    NIGHT: emptyShiftEntry(seed.nightOwnKg100),
  },
  treatmentKg100: kg100(seed.treatmentKg100 ?? 0),
  newClosingBalanceKg100: kg100(seed.balanceKg100 ?? 0),
  declaredFinishedKg100: kg100(seed.finishedKg100),
})

const fridayLineSeeds: readonly FridayLineSeed[] = [
  {
    cell: 'B10',
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    productId: 'aleta-cruda-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO CODIFICADA',
    summaryGroupId: 'ALETA',
    dayOwnKg100: 2_966_000,
    nightOwnKg100: 5_910_000,
    balanceKg100: 600_000,
    finishedKg100: 9_476_000,
  },
  {
    cell: 'B15',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-japones-crudo',
    productName:
      'MANTO JAPONÉS CRUDO CONGELADO BLOCK S/TTO 0.5-1 / 1-2 / 2-4 BLANCO + SB + CH',
    summaryGroupId: 'MANTO',
    dayOwnKg100: 3_044_000,
    nightOwnKg100: 5_305_000,
    receivedBalanceKg100: 174_000,
    processedPreviousBalanceKg100: 174_000,
    finishedKg100: 8_349_000,
  },
  {
    cell: 'B16',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-estandar-crudo-2-4',
    productName:
      'MANTO ESTÁNDAR CRUDO CONGELADO BLOCK S/TTO 2-4 BLANCO + SB + C/2 MEMB. + CH',
    summaryGroupId: 'MANTO',
    dayOwnKg100: 3_479_000,
    nightOwnKg100: 1_749_000,
    finishedKg100: 5_228_000,
  },
  {
    cell: 'B24',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-segunda-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA SM 2DA MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 23_000,
    nightOwnKg100: 0,
    finishedKg100: 23_000,
  },
  {
    cell: 'B25',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-p-sm-sp-st-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 26_000,
    nightOwnKg100: 0,
    finishedKg100: 26_000,
  },
  {
    cell: 'B26',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-p-cm-sp-st-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 50_000,
    nightOwnKg100: 82_000,
    finishedKg100: 132_000,
  },
  {
    cell: 'B27',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-polar-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA POLAR SM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 704_000,
    nightOwnKg100: 1_828_000,
    receivedBalanceKg100: 807_000,
    processedPreviousBalanceKg100: 807_000,
    finishedKg100: 2_532_000,
  },
  {
    cell: 'B28',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-block-tratamiento-usa-sm-cp-st',
    productName: 'ANILLAS CRUDAS CONGELADAS BLOCK C/TTO USA SM CP ST',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 4_640,
    finishedKg100: 4_640,
  },
  {
    cell: 'B35',
    familyId: 'boton',
    familyName: 'BOTÓN',
    productId: 'boton-espana-sm-sp-tratamiento',
    productName: 'BOTÓN ESPAÑA SM SP ST (TRATAMIENTO)',
    summaryGroupId: 'BOTON',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 97_000,
    finishedKg100: 97_000,
  },
  {
    cell: 'B36',
    familyId: 'boton',
    familyName: 'BOTÓN',
    productId: 'boton-usa-sm-cp-tratamiento',
    productName: 'BOTÓN USA SM CP ST (TRATAMIENTO)',
    summaryGroupId: 'BOTON',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 5_300,
    finishedKg100: 5_300,
  },
  {
    cell: 'B42',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-manto-japones',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO MANTO JAPONÉS 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 293_000,
    nightOwnKg100: 157_000,
    finishedKg100: 450_000,
  },
  {
    cell: 'B44',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-aleta',
    productName: 'RECORTE CRUDO CONGELADO BLOCK S/TTO ALETA 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 14_000,
    nightOwnKg100: 0,
    receivedBalanceKg100: 44_000,
    processedPreviousBalanceKg100: 44_000,
    finishedKg100: 14_000,
  },
  {
    cell: 'B45',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-anillas-sm-sp-st',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM SP ST 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 606_000,
    nightOwnKg100: 975_000,
    finishedKg100: 1_581_000,
  },
  {
    cell: 'B48',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recortes-crudos-labios',
    productName: 'RECORTES CRUDOS-LABIOS CONGELADOS BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 128_000,
    nightOwnKg100: 7_000,
    finishedKg100: 135_000,
  },
  {
    cell: 'B52',
    familyId: 'recorte-cocido',
    familyName: 'RECORTE COCIDO',
    productId: 'recorte-cocido-pb',
    productName: 'RECORTE COCIDO BLOCK S/TTO P.B 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    dayOwnKg100: 34_000,
    nightOwnKg100: 80_000,
    finishedKg100: 114_000,
  },
  {
    cell: 'B54',
    familyId: 'membrana',
    familyName: 'MEMBRANA',
    productId: 'membranas-cocidas',
    productName: 'MEMBRANAS COCIDAS CONGELADAS 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    dayOwnKg100: 104_000,
    nightOwnKg100: 217_000,
    finishedKg100: 321_000,
  },
  {
    cell: 'B65',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-1-2',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 1-2 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 1_517_000,
    nightOwnKg100: 1_934_000,
    balanceKg100: 282_000,
    finishedKg100: 3_733_000,
  },
  {
    cell: 'B66',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-2-3',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 2-3 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 16_000,
    nightOwnKg100: 10_000,
    finishedKg100: 26_000,
  },
  {
    cell: 'B69',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-bailarina-500-1000',
    productName:
      'REJO CRUDO CONGELADO BLOCK S/TTO BAILARINA S/R 500-1000 G SEMI LIMPIOS 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 704_000,
    nightOwnKg100: 1_125_000,
    finishedKg100: 1_829_000,
  },
  {
    cell: 'B74',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-corona-tratamiento',
    productName: 'REJOS CRUDOS SECCIONADOS 1-2 PARTE CORONA (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 381_400,
    finishedKg100: 381_400,
  },
  {
    cell: 'B75',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-media-tratamiento',
    productName: 'REJOS CRUDOS SECCIONADOS 1-2 PARTE MEDIA (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 356_400,
    finishedKg100: 356_400,
  },
  {
    cell: 'B76',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejos-seccionados-1-2-terminal-tratamiento',
    productName:
      'REJOS CRUDOS SECCIONADOS 1-2 PARTE TERMINAL (EN TRATAMIENTO)',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    treatmentKg100: 49_400,
    finishedKg100: 49_400,
  },
  {
    cell: 'B84',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-50-70',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 50-70 CM 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayOwnKg100: 126_000,
    nightOwnKg100: 0,
    finishedKg100: 126_000,
  },
  {
    cell: 'B85',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-70-up',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 70 CM-UP 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayOwnKg100: 557_000,
    nightOwnKg100: 450_000,
    balanceKg100: 200_000,
    finishedKg100: 1_207_000,
  },
  {
    cell: 'B95',
    familyId: 'nuca-semilimpia',
    familyName: 'NUCA SEMILIMPIA',
    productId: 'nuca-semilimpia-codificada',
    productName: 'NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI LIMPIAS CODIFICADA',
    summaryGroupId: 'NUCA_SEMILIMPIA',
    dayOwnKg100: 1_068_000,
    nightOwnKg100: 581_000,
    receivedBalanceKg100: 1_200_000,
    processedPreviousBalanceKg100: 1_200_000,
    finishedKg100: 1_649_000,
  },
  {
    cell: 'B96',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-100-300',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 100-300 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 25_000,
    nightOwnKg100: 0,
    finishedKg100: 25_000,
  },
  {
    cell: 'B97',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-300-500',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 300-500 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 82_000,
    nightOwnKg100: 345_000,
    receivedBalanceKg100: 38_000,
    processedPreviousBalanceKg100: 38_000,
    finishedKg100: 427_000,
  },
  {
    cell: 'B98',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-500-700',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 500-700 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 513_000,
    nightOwnKg100: 667_000,
    receivedBalanceKg100: 79_000,
    processedPreviousBalanceKg100: 79_000,
    finishedKg100: 1_180_000,
  },
  {
    cell: 'B99',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-700-up',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 700-UP 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 440_000,
    nightOwnKg100: 668_000,
    receivedBalanceKg100: 35_000,
    processedPreviousBalanceKg100: 35_000,
    finishedKg100: 1_108_000,
  },
]

export const FRIDAY_LINES: readonly ProductionLine[] =
  fridayLineSeeds.map(createLine)

const createReceivedBalanceLot = (seed: FridayLineSeed): BalanceLot => ({
  id: `balance-${THURSDAY_DAY_ID}-${seed.productId}`,
  originDayId: THURSDAY_DAY_ID,
  familyId: seed.familyId,
  productId: seed.productId,
  originalKg100: kg100(seed.receivedBalanceKg100 ?? 0),
  uses:
    (seed.processedPreviousBalanceKg100 ?? 0) > 0
      ? [
          {
            id: `balance-use-${FRIDAY_DAY_ID}-${seed.productId}`,
            targetDayId: FRIDAY_DAY_ID,
            shift: 'DAY',
            kg100: kg100(seed.processedPreviousBalanceKg100 ?? 0),
          },
        ]
      : [],
})

export const FRIDAY_RECEIVED_BALANCE_LOTS: readonly BalanceLot[] =
  fridayLineSeeds
    .filter((seed) => (seed.receivedBalanceKg100 ?? 0) > 0)
    .map(createReceivedBalanceLot)

export const FRIDAY_PRODUCTION_DAY: ProductionDay = {
  id: FRIDAY_DAY_ID,
  date: '2026-09-04',
  displayName: 'Viernes 04/09/2026',
  status: 'CLOSED',
  rawMaterialEntries: [
    {
      id: 'raw-material-2026-09-04-1',
      kg100: kg100(25_297_100),
      shift: null,
    },
    {
      id: 'raw-material-2026-09-04-2',
      kg100: kg100(26_924_200),
      shift: null,
    },
  ],
  declaredRawMaterialKg100: kg100(52_221_300),
  declaredShiftTotalsKg100: {
    DAY: kg100(18_896_000),
    NIGHT: kg100(22_090_000),
  },
  declaredFinishedTotalKg100: kg100(40_585_140),
  lines: FRIDAY_LINES,
  receivedBalanceLots: FRIDAY_RECEIVED_BALANCE_LOTS,
  nucaWashAuthorization: {
    kind: 'USER_CONFIRMED_ORDER',
    reference: null,
    reason:
      'La jornada cerrada del viernes registra producción de Nuca Bikini; el Excel no expone el número de pedido.',
  },
  performanceReferenceBasisPoints: 8_000,
  nucaBikiniReferenceBasisPoints: 700,
  rawMaterialAllocationOverridesKg100: {
    // VIERNES!C88, asignación explícita del bloque Reproductor.
    REPRODUCTOR: kg100(1_354_616),
  },
}

export const fridayProductionDay = FRIDAY_PRODUCTION_DAY
