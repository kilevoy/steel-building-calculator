import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { calculatePurlin } from '../../src/domain/purlin/model/calculate-purlin'
import { defaultPurlinInput } from '../../src/domain/purlin/model/purlin-input'

interface SortSteelRow {
  profile: string
  steelGrade: string
  stepMm: number
  totalMassKg: number
  costThousandsRub: number
}

interface LstkRow {
  lineLabel: string
  profile: string
  stepMm: number
  massPerMeterKg: number
  massPerStepKg: number
  totalMassKg: number
  blackMassKg: number | null
  galvanizedMassKg: number | null
  massWithBracesKg: number
  developedLengthM: number
}

interface WorkbookExpandedSheetSample {
  sortSteelTop10: SortSteelRow[]
  mp350: LstkRow[]
  mp390: LstkRow[]
}

function findWorkbookPath(): string | null {
  const candidates = [
    process.env.PURLIN_REFERENCE_WORKBOOK,
    resolve(process.cwd(), 'calculator_final_release.xlsx'),
    resolve(process.cwd(), '..', 'calculator_final_release.xlsx'),
    'C:\\calculator_final_release.xlsx',
  ].filter((value): value is string => Boolean(value))

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function readExpandedWorkbookSample(workbookPath: string): WorkbookExpandedSheetSample {
  const pythonScript = `
import json
import win32com.client as win32

excel = win32.DispatchEx('Excel.Application')
excel.Visible = False
excel.DisplayAlerts = False
excel.AskToUpdateLinks = False

def as_float(value):
    return float(value) if value not in (None, '') else None

def clean(value):
    if value in (None, ''):
        return ''
    return str(value).replace('\\xa0', ' ').strip()

try:
    workbook = excel.Workbooks.Open(r"${workbookPath.replace(/\\/g, '\\\\')}", UpdateLinks=0)
    input_ws = workbook.Worksheets('Ввод')
    legacy_ws = workbook.Worksheets('Сводка legacy')

    input_ws.Range('D6').Value = 'Уфа'
    input_ws.Range('D7').Value = 'по СП 20.13330.20ХХ'
    input_ws.Range('D8').Value = 1
    input_ws.Range('D9').Value = 'двускатная'
    input_ws.Range('D12').Value = 24
    input_ws.Range('D13').Value = 48
    input_ws.Range('D14').Value = 10
    input_ws.Range('D15').Value = 6
    input_ws.Range('D16').Value = 6
    input_ws.Range('D17').Value = 6
    input_ws.Range('D20').Value = 'В'
    input_ws.Range('D21').Value = 'С-П 150 мм'
    input_ws.Range('D22').Value = 'С44-1000-0,7'
    input_ws.Range('D23').Value = 'нет'
    input_ws.Range('D24').Value = 4.5
    input_ws.Range('D25').Value = 9.5
    input_ws.Range('D28').Value = 0
    input_ws.Range('D29').Value = 0
    input_ws.Range('D30').Value = 'нет'
    input_ws.Range('D31').Value = 'нет'
    input_ws.Range('D32').Value = 'нет'
    input_ws.Range('D33').Value = 3

    excel.CalculateFullRebuild()

    sort_rows = []
    for row in range(51, 61):
        sort_rows.append({
            'profile': clean(legacy_ws.Cells(row, 2).Value),
            'steelGrade': clean(legacy_ws.Cells(row, 3).Value),
            'stepMm': int(round(float(legacy_ws.Cells(row, 4).Value))),
            'totalMassKg': float(legacy_ws.Cells(row, 5).Value),
            'costThousandsRub': float(legacy_ws.Cells(row, 6).Value),
        })

    def lstk_row(row):
        black_mass = as_float(legacy_ws.Cells(row, 9).Value)
        galvanized_mass = as_float(legacy_ws.Cells(row, 10).Value)
        return {
            'lineLabel': clean(legacy_ws.Cells(row, 3).Value),
            'profile': clean(legacy_ws.Cells(row, 4).Value),
            'stepMm': int(round(float(legacy_ws.Cells(row, 5).Value))),
            'massPerMeterKg': float(legacy_ws.Cells(row, 6).Value),
            'massPerStepKg': float(legacy_ws.Cells(row, 7).Value),
            'totalMassKg': float(legacy_ws.Cells(row, 8).Value),
            'blackMassKg': black_mass,
            'galvanizedMassKg': galvanized_mass,
            'massWithBracesKg': float(legacy_ws.Cells(row, 11).Value),
            'developedLengthM': float(legacy_ws.Cells(row, 12).Value),
        }

    payload = {
        'sortSteelTop10': sort_rows,
        'mp350': [lstk_row(63), lstk_row(64), lstk_row(65)],
        'mp390': [lstk_row(68), lstk_row(69), lstk_row(70)],
    }
    print(json.dumps(payload, ensure_ascii=True))
    workbook.Close(SaveChanges=False)
finally:
    excel.Quit()
`.trim()

  return JSON.parse(execFileSync('python', ['-c', pythonScript], { encoding: 'utf-8' })) as WorkbookExpandedSheetSample
}

const workbookPath = findWorkbookPath()
const runIfWorkbookExists = workbookPath ? it : it.skip

describe('purlin expanded sheet parity', () => {
  runIfWorkbookExists('matches the expanded workbook sheet for the Ufa dual-slope baseline', () => {
    const workbook = readExpandedWorkbookSample(workbookPath!)
    const app = calculatePurlin({
      ...defaultPurlinInput,
      city: 'Уфа',
      roofType: 'двускатная',
      spanM: 24,
      buildingLengthM: 48,
      buildingHeightM: 10,
      roofSlopeDeg: 6,
      frameStepM: 6,
      fakhverkSpacingM: 6,
      terrainType: 'В',
      coveringType: 'С-П 150 мм',
      profileSheet: 'С44-1000-0,7',
      snowBagMode: 'нет',
      heightDifferenceM: 4.5,
      adjacentBuildingSizeM: 9.5,
      manualMaxStepMm: 0,
      manualMinStepMm: 0,
      maxUtilizationRatio: 0.8,
      tiesSetting: 'нет',
      braceSpacingM: 3,
      snowRetentionPurlin: 'нет',
      barrierPurlin: 'нет',
    })

    expect(app.sortSteelTop10).toHaveLength(workbook.sortSteelTop10.length)
    workbook.sortSteelTop10.forEach((expected, index) => {
      const actual = app.sortSteelTop10[index]
      expect(actual.profile).toBe(expected.profile)
      expect(actual.steelGrade).toBe(expected.steelGrade)
      expect(actual.stepMm).toBe(expected.stepMm)
      expect(actual.totalMassKg).toBeCloseTo(expected.totalMassKg, 3)
      expect(actual.excelMetrics?.displayCostThousandsRub).toBeCloseTo(expected.costThousandsRub, 1)
    })

    const compareLstkRows = (actualRows: typeof app.lstkMp350Top, expectedRows: LstkRow[]) => {
      expect(actualRows).toHaveLength(expectedRows.length)

      expectedRows.forEach((expected, index) => {
        const actual = actualRows[index]
        expect(actual.excelMetrics?.lineLabel).toBe(expected.lineLabel === '2ТПС' ? '2TPS' : expected.lineLabel === '2ПС' ? '2PS' : expected.lineLabel)
        expect(actual.profile).toBe(expected.profile)
        expect(actual.stepMm).toBe(expected.stepMm)
        expect(actual.excelMetrics?.unitMassPerMeterKg).toBeCloseTo(expected.massPerMeterKg, 4)
        expect(actual.excelMetrics?.massPerStepKg).toBeCloseTo(expected.massPerStepKg, 4)
        expect(actual.totalMassKg).toBeCloseTo(expected.totalMassKg, 3)
        expect(actual.excelMetrics?.massWithBracesKg).toBeCloseTo(expected.massWithBracesKg, 4)
        expect(actual.excelMetrics?.developedLengthM).toBeCloseTo(expected.developedLengthM, 3)

        if (expected.blackMassKg === null) {
          expect(actual.excelMetrics?.blackMassKg ?? null).toBeNull()
        } else {
          expect(actual.excelMetrics?.blackMassKg).toBeCloseTo(expected.blackMassKg, 2)
        }

        if (expected.galvanizedMassKg === null) {
          expect(actual.excelMetrics?.galvanizedMassKg ?? null).toBeNull()
        } else {
          expect(actual.excelMetrics?.galvanizedMassKg).toBeCloseTo(expected.galvanizedMassKg, 2)
        }
      })
    }

    compareLstkRows(app.lstkMp350Top, workbook.mp350)
    compareLstkRows(app.lstkMp390Top, workbook.mp390)
  }, 240000)
})
