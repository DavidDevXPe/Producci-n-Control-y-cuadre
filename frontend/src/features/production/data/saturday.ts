import { kg100 } from '../model/calculations'
import type {
  BalanceLot,
  ProductionDay,
  ProductionLine,
  ShiftProductEntry,
  SummaryGroupId,
} from '../model/types'

const SATURDAY_DAY_ID = 'production-day-2026-09-05'
const FRIDAY_DAY_ID = 'production-day-2026-09-04'

const emptyShiftEntry = (reportedKg100: number): ShiftProductEntry => ({
  reportedKg100: kg100(reportedKg100),
  adjustments: [],
})

interface SaturdayLineSeed {
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

const createLine = (seed: SaturdayLineSeed): ProductionLine => ({
  familyId: seed.familyId,
  familyName: seed.familyName,
  productId: seed.productId,
  productName: seed.productName,
  summaryGroupId: seed.summaryGroupId,
  source: { sheet: 'SÁBADO', cell: seed.cell },
  // The product-level shift split is inferred from the worksheet addends and
  // reconciled exactly with the aggregate Día and Noche controls.
  shiftBreakdownConfidence: 'RECONCILED_INFERENCE',
  shifts: {
    DAY: emptyShiftEntry(
      seed.dayOwnKg100 + (seed.previousBalanceKg100 ?? 0),
    ),
    NIGHT: emptyShiftEntry(seed.nightOwnKg100),
  },
  treatmentKg100: kg100(seed.treatmentKg100 ?? 0),
  newClosingBalanceKg100: kg100(seed.balanceKg100 ?? 0),
  declaredFinishedKg100: kg100(seed.finishedKg100),
})

const saturdayLineSeeds: readonly SaturdayLineSeed[] = [
  {
    cell: 'B10',
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    productId: 'aleta-cruda-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO CODIFICADA',
    summaryGroupId: 'ALETA',
    dayOwnKg100: 3_822_000,
    nightOwnKg100: 4_997_000,
    previousBalanceKg100: 600_000,
    balanceKg100: 513_000,
    finishedKg100: 9_332_000,
  },
  {
    cell: 'B15',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-japones-crudo',
    productName:
      'MANTO JAPONÉS CRUDO CONGELADO BLOCK S/TTO 0.5-1 / 1-2 / 2-4 BLANCO + SB + CH',
    summaryGroupId: 'MANTO',
    dayOwnKg100: 3_168_000,
    nightOwnKg100: 4_115_000,
    balanceKg100: 113_000,
    finishedKg100: 7_396_000,
  },
  {
    cell: 'B16',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-estandar-crudo-2-4',
    productName:
      'MANTO ESTÁNDAR CRUDO CONGELADO BLOCK S/TTO 2-4 BLANCO + SB + C/2 MEMB. + CH',
    summaryGroupId: 'MANTO',
    dayOwnKg100: 3_147_000,
    nightOwnKg100: 4_673_000,
    balanceKg100: 39_000,
    finishedKg100: 7_859_000,
  },
  {
    cell: 'B24',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-segunda-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA SM 2DA MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 29_000,
    nightOwnKg100: 2_000,
    balanceKg100: 26_000,
    finishedKg100: 57_000,
  },
  {
    cell: 'B25',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-p-sm-sp-st-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    balanceKg100: 3_000,
    finishedKg100: 3_000,
  },
  {
    cell: 'B26',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-p-cm-sp-st-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 19_000,
    nightOwnKg100: 32_000,
    balanceKg100: 38_000,
    finishedKg100: 89_000,
  },
  {
    cell: 'B27',
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-polar-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA POLAR SM SP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS',
    dayOwnKg100: 1_733_000,
    nightOwnKg100: 1_007_000,
    balanceKg100: 1_302_000,
    finishedKg100: 4_042_000,
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
    treatmentKg100: 49_500,
    finishedKg100: 49_500,
  },
  {
    cell: 'B42',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-manto-japones',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO MANTO JAPONÉS 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 269_000,
    nightOwnKg100: 81_000,
    balanceKg100: 233_000,
    finishedKg100: 583_000,
  },
  {
    cell: 'B44',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-aleta',
    productName: 'RECORTE CRUDO CONGELADO BLOCK S/TTO ALETA 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 30_000,
    nightOwnKg100: 0,
    balanceKg100: 38_000,
    finishedKg100: 68_000,
  },
  {
    cell: 'B45',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recorte-crudo-anillas-sm-sp-st',
    productName:
      'RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM SP ST 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 984_000,
    nightOwnKg100: 724_000,
    balanceKg100: 811_000,
    finishedKg100: 2_519_000,
  },
  {
    cell: 'B48',
    familyId: 'recorte-crudo',
    familyName: 'RECORTE CRUDO',
    productId: 'recortes-crudos-labios',
    productName: 'RECORTES CRUDOS-LABIOS CONGELADOS BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'RECORTE_CRUDO',
    dayOwnKg100: 156_000,
    nightOwnKg100: 19_000,
    balanceKg100: 67_000,
    finishedKg100: 242_000,
  },
  {
    cell: 'B52',
    familyId: 'recorte-cocido',
    familyName: 'RECORTE COCIDO',
    productId: 'recorte-cocido-pb',
    productName: 'RECORTE COCIDO BLOCK S/TTO P.B 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    dayOwnKg100: 171_000,
    nightOwnKg100: 175_000,
    balanceKg100: 230_000,
    finishedKg100: 576_000,
  },
  {
    cell: 'B54',
    familyId: 'membrana',
    familyName: 'MEMBRANA',
    productId: 'membranas-cocidas',
    productName: 'MEMBRANAS COCIDAS CONGELADAS 100% P.N.',
    summaryGroupId: 'RECORTE_COCIDO',
    dayOwnKg100: 246_000,
    nightOwnKg100: 206_000,
    balanceKg100: 249_000,
    finishedKg100: 701_000,
  },
  {
    cell: 'B64',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-500-1000',
    productName:
      'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 500-1000 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    balanceKg100: 58_000,
    finishedKg100: 58_000,
  },
  {
    cell: 'B65',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-1-2',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 1-2 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 1_238_000,
    nightOwnKg100: 1_883_000,
    previousBalanceKg100: 282_000,
    balanceKg100: 191_000,
    finishedKg100: 3_312_000,
  },
  {
    cell: 'B66',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-baa-2-3',
    productName: 'REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 2-3 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 53_000,
    nightOwnKg100: 27_000,
    balanceKg100: 33_000,
    finishedKg100: 113_000,
  },
  {
    cell: 'B68',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-bailarina-0-500',
    productName:
      'REJO CRUDO CONGELADO BLOCK S/TTO BAILARINA S/R 0-500 G SEMI LIMPIOS 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 0,
    nightOwnKg100: 0,
    balanceKg100: 12_000,
    finishedKg100: 12_000,
  },
  {
    cell: 'B69',
    familyId: 'rejos-crudo',
    familyName: 'REJOS CRUDO',
    productId: 'rejo-bailarina-500-1000',
    productName:
      'REJO CRUDO CONGELADO BLOCK S/TTO BAILARINA S/R 500-1000 G SEMI LIMPIOS 100% P.N.',
    summaryGroupId: 'REJOS',
    dayOwnKg100: 752_000,
    nightOwnKg100: 1_420_000,
    balanceKg100: 80_000,
    finishedKg100: 2_252_000,
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
    treatmentKg100: 468_800,
    finishedKg100: 468_800,
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
    treatmentKg100: 154_100,
    finishedKg100: 154_100,
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
    treatmentKg100: 17_900,
    finishedKg100: 17_900,
  },
  {
    cell: 'B84',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-50-70',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 50-70 CM 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayOwnKg100: 87_000,
    nightOwnKg100: 8_000,
    balanceKg100: 1_000,
    finishedKg100: 96_000,
  },
  {
    cell: 'B85',
    familyId: 'reproductor-crudo',
    familyName: 'REPRODUCTOR CRUDO',
    productId: 'reproductor-70-up',
    productName:
      'REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 70 CM-UP 100% P.N.',
    summaryGroupId: 'REPRODUCTOR',
    dayOwnKg100: 591_000,
    nightOwnKg100: 588_000,
    previousBalanceKg100: 200_000,
    balanceKg100: 232_000,
    finishedKg100: 1_411_000,
  },
  {
    cell: 'B95',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-semilimpia-codificada',
    productName: 'NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI LIMPIAS CODIFICADA',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 968_000,
    nightOwnKg100: 632_000,
    balanceKg100: 117_000,
    finishedKg100: 1_717_000,
  },
  {
    cell: 'B96',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-100-300',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 100-300 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 1_000,
    nightOwnKg100: 0,
    balanceKg100: 11_000,
    finishedKg100: 12_000,
  },
  {
    cell: 'B97',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-300-500',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 300-500 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 161_000,
    nightOwnKg100: 154_000,
    balanceKg100: 21_000,
    finishedKg100: 336_000,
  },
  {
    cell: 'B98',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-500-700',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 500-700 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 592_000,
    nightOwnKg100: 603_000,
    balanceKg100: 46_000,
    finishedKg100: 1_241_000,
  },
  {
    cell: 'B99',
    familyId: 'nuca-bikini',
    familyName: 'NUCA BIKINI',
    productId: 'nuca-bikini-700-up',
    productName:
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO BIKINI 700-UP 100% P.N.',
    summaryGroupId: 'NUCA_BIKINI',
    dayOwnKg100: 345_000,
    nightOwnKg100: 634_000,
    balanceKg100: 2_000,
    finishedKg100: 981_000,
  },
]

export const SATURDAY_LINES: readonly ProductionLine[] =
  saturdayLineSeeds.map(createLine)

const createReceivedBalanceLot = (seed: SaturdayLineSeed): BalanceLot => ({
  id: `balance-${FRIDAY_DAY_ID}-${seed.productId}`,
  originDayId: FRIDAY_DAY_ID,
  familyId: seed.familyId,
  productId: seed.productId,
  originalKg100: kg100(seed.previousBalanceKg100 ?? 0),
  uses: [
    {
      id: `balance-use-${SATURDAY_DAY_ID}-${seed.productId}`,
      targetDayId: SATURDAY_DAY_ID,
      shift: 'DAY',
      kg100: kg100(seed.previousBalanceKg100 ?? 0),
    },
  ],
})

export const SATURDAY_RECEIVED_BALANCE_LOTS: readonly BalanceLot[] =
  saturdayLineSeeds
    .filter((seed) => (seed.previousBalanceKg100 ?? 0) > 0)
    .map(createReceivedBalanceLot)

export const SATURDAY_PRODUCTION_DAY: ProductionDay = {
  id: SATURDAY_DAY_ID,
  date: '2026-09-05',
  displayName: 'Sábado 05/09/2026',
  status: 'CLOSED',
  rawMaterialEntries: [
    {
      id: 'raw-material-2026-09-05-1',
      kg100: kg100(22_414_200),
      shift: null,
    },
    {
      id: 'raw-material-2026-09-05-2',
      kg100: kg100(26_433_400),
      shift: null,
    },
  ],
  declaredRawMaterialKg100: kg100(48_847_600),
  declaredShiftTotalsKg100: {
    DAY: kg100(19_644_000),
    NIGHT: kg100(21_980_000),
  },
  declaredFinishedTotalKg100: kg100(45_698_300),
  lines: SATURDAY_LINES,
  receivedBalanceLots: SATURDAY_RECEIVED_BALANCE_LOTS,
  nucaWashAuthorization: {
    kind: 'USER_CONFIRMED_ORDER',
    reference: null,
    reason:
      'La jornada cerrada del sábado registra producción de Nuca Bikini; el Excel no expone el número de pedido.',
  },
  performanceReferenceBasisPoints: 8_000,
  nucaBikiniReferenceBasisPoints: 700,
  rawMaterialAllocationOverridesKg100: {
    // SÁBADO!C88, asignación explícita del bloque Reproductor.
    REPRODUCTOR: kg100(1_280_877),
  },
}

export const saturdayProductionDay = SATURDAY_PRODUCTION_DAY
