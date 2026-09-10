import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  createCaptureDraftFromImportedSheet,
  parseProductionWorkbook,
} from './parseProductionWorkbook'

describe('production workbook import', () => {
  it('reads the supported daily sheet into an editable capture preview', async () => {
    const workbook = new Workbook()
    const worksheet = workbook.addWorksheet('LUNES')
    worksheet.getCell('A5').value = 'FECHA: 07/09/2026'
    worksheet.getCell('D3').value = { formula: '60000+40000', result: 100_000 }
    worksheet.getCell('A10').value =
      'ALETA CRUDA CONGELADA BLOCK S/TTO CODIFICADA'
    worksheet.getCell('B10').value = 80_000
    worksheet.getCell('A36').value = 'BOTON ESPAÑA SM SP ST (TRATAMIENTO)'
    worksheet.getCell('B36').value = 2_000
    worksheet.getCell('A95').value =
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI LIMPIAS CODIFICADA'
    worksheet.getCell('B95').value = 500
    worksheet.getCell('B104').value = 82_500
    worksheet.getCell('B107').value = 50_000
    worksheet.getCell('C107').value = 10_000
    worksheet.getCell('C89').value = 1_500
    worksheet.getCell('H10').value = 'Aleta'
    worksheet.getCell('I10').value = 20_000

    const sheets = await parseProductionWorkbook(
      await workbook.xlsx.writeBuffer(),
    )
    const sheet = sheets[0]!
    const draft = createCaptureDraftFromImportedSheet(sheet)

    expect(sheets).toHaveLength(1)
    expect(sheet.date).toBe('2026-09-07')
    expect(sheet.rawMaterialKg).toBe(100_000)
    expect(sheet.products).toHaveLength(3)
    expect(sheet.products[2]?.product.summaryGroupId).toBe('NUCA_SEMILIMPIA')
    expect(sheet.balances).toEqual([{ label: 'Aleta', kg: 20_000 }])
    expect(draft.source).toBe('EXCEL')
    expect(draft.shiftAllocationMode).toBe('RECONCILED_INFERENCE')
    expect(draft.rows[1]?.treatmentKg).toBe('2000')
  })
})
