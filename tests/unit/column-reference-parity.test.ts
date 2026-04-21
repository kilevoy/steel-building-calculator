import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  columnBraceUnitMassKgPerM,
  columnCandidateCatalog,
  columnCityLoads,
  columnCoveringCatalog,
  columnSupportCraneCatalog,
} from '../../src/domain/column/model/column-reference.generated'

interface CandidateSample {
  row: number
  excluded: boolean
  braceCount: number
  priceCategory: 'i_beam' | 'tube'
  steelGrade: string
  strengthResistanceMpa: number
  profile: string
  areaCm2: number
  unitMassKgPerM: number
  sectionModulusXCm3: number
  radiusXcm: number
  radiusYcm: number
}

interface CityLoadSample {
  row: number
  city: string
  snowLoadKpa: number
  windLoadKpa: number
  spRegion: string
}

interface CoveringSample {
  row: number
  name: string
  loadKpa: number
}

interface CraneSample {
  row: number
  capacityLabel: string
  spanM: number
  baseM: number
  gaugeM: number
  wheelLoadKn: number
  trolleyMassT: number
  craneMassT: number
}

interface WorkbookSmokeSample {
  braceUnitMassKgPerM: number
  candidateRowCount: number
  cityLoadRowCount: number
  coveringRowCount: number
  craneRowCount: number
  candidateSamples: CandidateSample[]
  cityLoadSamples: CityLoadSample[]
  coveringSamples: CoveringSample[]
  craneSamples: CraneSample[]
}

function findWorkbookPath(): string | null {
  const candidates = [
    process.env.COLUMN_REFERENCE_WORKBOOK,
    resolve(process.cwd(), 'column_calculator_final_release.xlsx'),
    resolve(process.cwd(), '..', 'column_calculator_final_release.xlsx'),
    'C:\\column_calculator_final_release.xlsx',
  ].filter((value): value is string => Boolean(value))

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function readWorkbookSmokeSample(workbookPath: string): WorkbookSmokeSample {
  const pythonScript = `
import json
from pathlib import Path
from openpyxl import load_workbook

def as_float(value):
    return float(value)

def resolve_price_category(profile):
    normalized = profile.strip().lower()
    return 'tube' if normalized.startswith('кв.') or normalized.startswith('пр.') else 'i_beam'

workbook = load_workbook(Path(r"${workbookPath.replace(/\\/g, '\\\\')}"), data_only=True, read_only=True)
ws_summary = workbook[workbook.sheetnames[4]]
ws_calc = workbook[workbook.sheetnames[5]]
ws_cranes = workbook[workbook.sheetnames[6]]
ws_city = workbook[workbook.sheetnames[9]]

candidate_rows = list(range(5, ws_calc.max_row + 1))
city_rows = list(range(3, ws_city.max_row + 1))
covering_rows = list(range(148, 168))
crane_rows = list(range(2, ws_cranes.max_row + 1))

candidate_sample_rows = [5, 124, 484, 2084]
city_sample_rows = [3, 81, 226]
covering_sample_rows = [148, 155, 167]
crane_sample_rows = [2, 17, 46]

result = {
    'braceUnitMassKgPerM': as_float(ws_calc['S88'].value),
    'candidateRowCount': len(candidate_rows),
    'cityLoadRowCount': len(city_rows),
    'coveringRowCount': len(covering_rows),
    'craneRowCount': len(crane_rows),
    'candidateSamples': [],
    'cityLoadSamples': [],
    'coveringSamples': [],
    'craneSamples': [],
}

for row in candidate_sample_rows:
    profile = ws_calc.cell(row=row, column=12).value
    result['candidateSamples'].append({
        'row': row,
        'excluded': ws_calc.cell(row=row, column=8).value == '-',
        'braceCount': int(ws_calc.cell(row=row, column=9).value),
        'priceCategory': resolve_price_category(profile),
        'steelGrade': ws_calc.cell(row=row, column=10).value.strip(),
        'strengthResistanceMpa': as_float(ws_calc.cell(row=row, column=11).value),
        'profile': profile.strip(),
        'areaCm2': as_float(ws_calc.cell(row=row, column=18).value),
        'unitMassKgPerM': as_float(ws_calc.cell(row=row, column=19).value),
        'sectionModulusXCm3': as_float(ws_calc.cell(row=row, column=21).value),
        'radiusXcm': as_float(ws_calc.cell(row=row, column=23).value),
        'radiusYcm': as_float(ws_calc.cell(row=row, column=26).value),
    })

for row in city_sample_rows:
    snow_secondary = ws_city.cell(row=row, column=5).value
    result['cityLoadSamples'].append({
        'row': row,
        'city': ws_city.cell(row=row, column=2).value.strip(),
        'snowLoadKpa': as_float(ws_city.cell(row=row, column=3).value),
        'windLoadKpa': as_float(ws_city.cell(row=row, column=7).value),
        'spRegion': str(int(snow_secondary)) if float(snow_secondary).is_integer() else format(float(snow_secondary), 'g'),
    })

for row in covering_sample_rows:
    result['coveringSamples'].append({
        'row': row,
        'name': ws_summary.cell(row=row, column=12).value.strip(),
        'loadKpa': as_float(ws_summary.cell(row=row, column=13).value) / 100,
    })

for row in crane_sample_rows:
    result['craneSamples'].append({
        'row': row,
        'capacityLabel': str(ws_cranes.cell(row=row, column=1).value).strip(),
        'spanM': int(ws_cranes.cell(row=row, column=2).value),
        'baseM': as_float(ws_cranes.cell(row=row, column=3).value) / 1000,
        'gaugeM': as_float(ws_cranes.cell(row=row, column=4).value) / 1000,
        'wheelLoadKn': as_float(ws_cranes.cell(row=row, column=5).value),
        'trolleyMassT': as_float(ws_cranes.cell(row=row, column=6).value),
        'craneMassT': as_float(ws_cranes.cell(row=row, column=7).value),
    })

print(json.dumps(result, ensure_ascii=True))
`.trim()

  return JSON.parse(execFileSync('python', ['-c', pythonScript], { encoding: 'utf-8' })) as WorkbookSmokeSample
}

const workbookPath = findWorkbookPath()
const runIfWorkbookExists = workbookPath ? it : it.skip

describe('column workbook parity smoke', () => {
  runIfWorkbookExists('matches key control points from the source workbook', () => {
    const workbook = readWorkbookSmokeSample(workbookPath!)

    expect(columnBraceUnitMassKgPerM).toBeCloseTo(workbook.braceUnitMassKgPerM, 6)

    expect(columnCandidateCatalog).toHaveLength(workbook.candidateRowCount)
    for (const sample of workbook.candidateSamples) {
      const { row, ...expected } = sample
      const generated = columnCandidateCatalog[row - 5]
      expect(generated).toMatchObject(expected)
    }

    expect(columnCityLoads).toHaveLength(workbook.cityLoadRowCount)
    for (const sample of workbook.cityLoadSamples) {
      const { row, ...expected } = sample
      const generated = columnCityLoads[row - 3]
      expect(generated).toMatchObject(expected)
    }

    expect(columnCoveringCatalog).toHaveLength(workbook.coveringRowCount)
    for (const sample of workbook.coveringSamples) {
      const { row, ...expected } = sample
      const generated = columnCoveringCatalog[row - 148]
      expect(generated).toMatchObject(expected)
    }

    expect(columnSupportCraneCatalog).toHaveLength(workbook.craneRowCount)
    for (const sample of workbook.craneSamples) {
      const { row, ...expected } = sample
      const generated = columnSupportCraneCatalog[row - 2]
      expect(generated).toMatchObject(expected)
    }
  }, 30000)
})
