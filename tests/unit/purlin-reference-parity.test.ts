import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  purlinAutoStepCapacityTable,
  purlinCityLoads,
  purlinCoveringCatalog,
  purlinLstkMp3502PsProfiles,
  purlinLstkMp3502TpsProfiles,
  purlinLstkMp350StepAxis,
  purlinLstkMp350ZProfiles,
  purlinLstkMp3902PsProfiles,
  purlinLstkMp3902TpsProfiles,
  purlinLstkMp390ZProfiles,
  purlinNuGrid,
  purlinNuXValues,
  purlinNuYValues,
  purlinProfileSheetIndices,
  purlinSortSteelProfiles,
  purlinSortSteelStabilityGrid,
  purlinSortSteelStabilityLambdaAxis,
  purlinSortSteelStabilityMefAxis,
  purlinSortSteelStepAxis,
  purlinSpRkEnCityFlags,
  purlinWindHeightTable,
} from '../../src/domain/purlin/model/purlin-reference.generated'

interface SampleWithIndex<T> {
  index: number
  value: T
}

interface WorkbookSmokeSample {
  autoStepCount: number
  autoStepSamples: Array<SampleWithIndex<{ stepMm: number; capacityByIndex: readonly number[] }>>
  cityLoadsCount: number
  cityLoadSamples: Array<SampleWithIndex<{ city: string; snowLoadKpa: number; windLoadKpa: number }>>
  coveringCount: number
  coveringSamples: Array<
    SampleWithIndex<{ name: string; coveringLoadKpa: number; fixedAutoStepIndex: number | null }>
  >
  profileSheetIndices: Array<{ profileSheet: string; autoStepIndex: number }>
  mp350StepAxis: { first: number; middle: number; last: number }
  mp350Samples: {
    tps: Array<SampleWithIndex<{ profile: string; momentResistance: number; unitMassKgPerM: number }>>
    ps: Array<SampleWithIndex<{ profile: string; momentResistance: number; unitMassKgPerM: number }>>
    z: Array<SampleWithIndex<{ profile: string; momentResistance: number; unitMassKgPerM: number }>>
  }
  mp390Samples: {
    tps: Array<SampleWithIndex<{ profile: string; momentResistance: number; unitMassKgPerM: number }>>
    ps: Array<SampleWithIndex<{ profile: string; momentResistance: number; unitMassKgPerM: number }>>
    z: Array<SampleWithIndex<{ profile: string; momentResistance: number; unitMassKgPerM: number }>>
  }
  nuX: readonly number[]
  nuY: readonly number[]
  nuGrid: { topLeft: number; center: number; bottomRight: number }
  sortSteelSamples: Array<
    SampleWithIndex<{
      ordinal: number
      steelGrade: string
      strengthResistanceMpa: number
      profile: string
      areaCm2: number
      unitMassKgPerM: number
      momentOfInertiaXCm4: number
      sectionModulusXCm3: number
      radiusXcm: number
      momentOfInertiaYCm4: number
      sectionModulusYCm3: number
      radiusYcm: number
      eta: number
      psi: number
    }>
  >
  sortSteelStepAxis: { first: number; middle: number; last: number }
  stabilityLambdaAxis: readonly number[]
  stabilityMefAxis: readonly number[]
  stabilityGrid: { topLeft: number; center: number; bottomRight: number }
  spRkEnSamples: Array<SampleWithIndex<{ city: string; windRegion: string }>>
  windHeightSamples: Array<
    SampleWithIndex<{
      heightM: number
      kByTerrain: Record<'А' | 'В' | 'С', number>
      zetaByTerrain: Record<'А' | 'В' | 'С', number>
    }>
  >
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

function readWorkbookSmokeSample(workbookPath: string): WorkbookSmokeSample {
  const pythonScript = `
import json
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.utils import column_index_from_string

def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)

def sample_indices(length):
    indices = {0, length // 2, length - 1}
    return sorted(index for index in indices if 0 <= index < length)

def pick_samples(values):
    return [{'index': index, 'value': values[index]} for index in sample_indices(len(values))]

def mp_entry(ws, row):
    return {
        'profile': ws[f'SK{row}'].value.strip(),
        'momentResistance': float(ws[f'SL{row}'].value),
        'unitMassKgPerM': float(ws[f'SM{row}'].value),
    }

workbook = load_workbook(Path(r"${workbookPath.replace(/\\/g, '\\\\')}"), data_only=True, read_only=False)
ws_summary_legacy = workbook[workbook.sheetnames[7]]
ws_mp350 = workbook[workbook.sheetnames[8]]
ws_mp390 = workbook[workbook.sheetnames[9]]
ws_sort_steel = workbook[workbook.sheetnames[10]]
ws_stability = workbook[workbook.sheetnames[11]]
ws_wind_sp = workbook[workbook.sheetnames[12]]
ws_city_sp20 = workbook[workbook.sheetnames[14]]
ws_choices = workbook[workbook.sheetnames[16]]
ws_sp_rk_en = workbook[workbook.sheetnames[18]]

wind_region_map = {}
for column in range(3, 11):
    region = ws_wind_sp.cell(row=1, column=column).value
    load = ws_wind_sp.cell(row=2, column=column).value
    if isinstance(region, str) and is_number(load):
        wind_region_map[region.strip()] = float(load)

auto_steps = []
for row in range(1, 220):
    step = ws_summary_legacy[f'B{row}'].value
    capacities = [ws_summary_legacy.cell(row=row, column=column).value for column in range(3, 14)]
    if not is_number(step) or int(step) < 600:
        continue
    if not all(is_number(value) for value in capacities):
        continue
    auto_steps.append({
        'stepMm': int(step),
        'capacityByIndex': [float(value) for value in capacities],
    })

city_loads = []
for row in range(3, 227):
    city = ws_city_sp20.cell(row=row, column=2).value
    snow_primary = ws_city_sp20.cell(row=row, column=3).value
    snow_secondary = ws_city_sp20.cell(row=row, column=5).value
    wind_region = ws_city_sp20.cell(row=row, column=6).value
    if not isinstance(city, str) or not city.strip():
        continue
    snow_value = snow_primary if is_number(snow_primary) else snow_secondary
    if not is_number(snow_value) or not isinstance(wind_region, str):
        continue
    city_loads.append({
        'city': city.strip(),
        'snowLoadKpa': float(snow_value),
        'windLoadKpa': float(wind_region_map[wind_region.strip()]),
    })

coverings = []
for row in range(1, 140):
    raw_index = ws_summary_legacy[f'K{row}'].value
    raw_name = ws_summary_legacy[f'L{row}'].value
    raw_load = ws_summary_legacy[f'M{row}'].value
    if not is_number(raw_index) or not isinstance(raw_name, str) or not raw_name.strip() or not is_number(raw_load):
        continue
    auto_step_index = int(raw_index)
    coverings.append({
        'name': raw_name.strip(),
        'coveringLoadKpa': float(raw_load) / 100,
        'fixedAutoStepIndex': auto_step_index if auto_step_index >= 5 else None,
    })

profile_sheet_indices = []
auto_step_index = 1
for row in range(1, 40):
    profile_sheet = ws_choices.cell(row=row, column=4).value
    if not isinstance(profile_sheet, str):
        continue
    normalized = profile_sheet.strip()
    if not normalized:
        continue
    if not any(character.isdigit() for character in normalized):
        continue
    if ',' not in normalized and '-' not in normalized:
        continue
    profile_sheet_indices.append({
        'profileSheet': normalized,
        'autoStepIndex': auto_step_index,
    })
    auto_step_index += 1

mp350_step_axis = [
    int(ws_mp350.cell(row=3, column=column_index_from_string('SO') + offset).value)
    for offset in range(${purlinLstkMp350StepAxis.length})
]

nu_x = [float(ws_wind_sp[f'Z{row}'].value) for row in range(68, 75)]
nu_y = [float(ws_wind_sp.cell(row=67, column=column_index_from_string('AA') + offset).value) for offset in range(7)]

sort_steel_step_axis = [
    int(ws_sort_steel.cell(row=2, column=column_index_from_string('AG') + offset).value)
    for offset in range(${purlinSortSteelStepAxis.length})
]

stability_lambda = [float(ws_stability.cell(row=9 + offset, column=1).value) for offset in range(18)]
stability_mef = [float(ws_stability.cell(row=8, column=2 + offset).value) for offset in range(45)]

def stability_value(row, column):
    value = ws_stability.cell(row=row, column=column).value
    if isinstance(value, str) and value.strip().lower() == 'ж':
        return 0.001
    return float(value) / 1000

result = {
    'autoStepCount': len(auto_steps),
    'autoStepSamples': pick_samples(auto_steps),
    'cityLoadsCount': len(city_loads),
    'cityLoadSamples': pick_samples(city_loads),
    'coveringCount': len(coverings),
    'coveringSamples': pick_samples(coverings),
    'profileSheetIndices': profile_sheet_indices,
    'mp350StepAxis': {
        'first': mp350_step_axis[0],
        'middle': mp350_step_axis[len(mp350_step_axis) // 2],
        'last': mp350_step_axis[-1],
    },
    'mp350Samples': {
        'tps': [
            {'index': 0, 'value': mp_entry(ws_mp350, 5)},
            {'index': 10, 'value': mp_entry(ws_mp350, 15)},
        ],
        'ps': [
            {'index': 0, 'value': mp_entry(ws_mp350, 16)},
            {'index': 13, 'value': mp_entry(ws_mp350, 29)},
        ],
        'z': [
            {'index': 0, 'value': mp_entry(ws_mp350, 30)},
            {'index': 24, 'value': mp_entry(ws_mp350, 54)},
        ],
    },
    'mp390Samples': {
        'tps': [
            {'index': 0, 'value': mp_entry(ws_mp390, 5)},
            {'index': 10, 'value': mp_entry(ws_mp390, 15)},
        ],
        'ps': [
            {'index': 0, 'value': mp_entry(ws_mp390, 16)},
            {'index': 13, 'value': mp_entry(ws_mp390, 29)},
        ],
        'z': [
            {'index': 0, 'value': mp_entry(ws_mp390, 30)},
            {'index': 24, 'value': mp_entry(ws_mp390, 54)},
        ],
    },
    'nuX': nu_x,
    'nuY': nu_y,
    'nuGrid': {
        'topLeft': float(ws_wind_sp['AA68'].value),
        'center': float(ws_wind_sp.cell(row=71, column=column_index_from_string('AD')).value),
        'bottomRight': float(ws_wind_sp['AG74'].value),
    },
    'sortSteelSamples': [
        {
            'index': 0,
            'value': {
                'ordinal': int(ws_sort_steel['H4'].value),
                'steelGrade': str(ws_sort_steel['I4'].value).strip(),
                'strengthResistanceMpa': float(ws_sort_steel['J4'].value),
                'profile': ws_sort_steel['L4'].value.strip(),
                'areaCm2': float(ws_sort_steel['R4'].value),
                'unitMassKgPerM': float(ws_sort_steel['S4'].value),
                'momentOfInertiaXCm4': float(ws_sort_steel['T4'].value),
                'sectionModulusXCm3': float(ws_sort_steel['U4'].value),
                'radiusXcm': float(ws_sort_steel['W4'].value),
                'momentOfInertiaYCm4': float(ws_sort_steel['X4'].value),
                'sectionModulusYCm3': float(ws_sort_steel['Y4'].value),
                'radiusYcm': float(ws_sort_steel['Z4'].value),
                'eta': float(ws_sort_steel['AA4'].value),
                'psi': float(ws_sort_steel['AC4'].value),
            },
        },
        {
            'index': 219,
            'value': {
                'ordinal': int(ws_sort_steel['H223'].value),
                'steelGrade': str(ws_sort_steel['I223'].value).strip(),
                'strengthResistanceMpa': float(ws_sort_steel['J223'].value),
                'profile': ws_sort_steel['L223'].value.strip(),
                'areaCm2': float(ws_sort_steel['R223'].value),
                'unitMassKgPerM': float(ws_sort_steel['S223'].value),
                'momentOfInertiaXCm4': float(ws_sort_steel['T223'].value),
                'sectionModulusXCm3': float(ws_sort_steel['U223'].value),
                'radiusXcm': float(ws_sort_steel['W223'].value),
                'momentOfInertiaYCm4': float(ws_sort_steel['X223'].value),
                'sectionModulusYCm3': float(ws_sort_steel['Y223'].value),
                'radiusYcm': float(ws_sort_steel['Z223'].value),
                'eta': float(ws_sort_steel['AA223'].value),
                'psi': float(ws_sort_steel['AC223'].value),
            },
        },
        {
            'index': 437,
            'value': {
                'ordinal': int(ws_sort_steel['H441'].value),
                'steelGrade': str(ws_sort_steel['I441'].value).strip(),
                'strengthResistanceMpa': float(ws_sort_steel['J441'].value),
                'profile': ws_sort_steel['L441'].value.strip(),
                'areaCm2': float(ws_sort_steel['R441'].value),
                'unitMassKgPerM': float(ws_sort_steel['S441'].value),
                'momentOfInertiaXCm4': float(ws_sort_steel['T441'].value),
                'sectionModulusXCm3': float(ws_sort_steel['U441'].value),
                'radiusXcm': float(ws_sort_steel['W441'].value),
                'momentOfInertiaYCm4': float(ws_sort_steel['X441'].value),
                'sectionModulusYCm3': float(ws_sort_steel['Y441'].value),
                'radiusYcm': float(ws_sort_steel['Z441'].value),
                'eta': float(ws_sort_steel['AA441'].value),
                'psi': float(ws_sort_steel['AC441'].value),
            },
        },
    ],
    'sortSteelStepAxis': {
        'first': sort_steel_step_axis[0],
        'middle': sort_steel_step_axis[len(sort_steel_step_axis) // 2],
        'last': sort_steel_step_axis[-1],
    },
    'stabilityLambdaAxis': stability_lambda,
    'stabilityMefAxis': stability_mef,
    'stabilityGrid': {
        'topLeft': stability_value(9, 2),
        'center': stability_value(18, 24),
        'bottomRight': stability_value(26, 46),
    },
    'spRkEnSamples': [
        {'index': 0, 'value': {'city': ws_sp_rk_en['B3'].value.strip(), 'windRegion': ws_sp_rk_en['C3'].value.strip()}},
        {'index': 27, 'value': {'city': ws_sp_rk_en['B48'].value.strip(), 'windRegion': ws_sp_rk_en['C48'].value.strip()}},
        {'index': 53, 'value': {'city': ws_sp_rk_en['B75'].value.strip(), 'windRegion': ws_sp_rk_en['C75'].value.strip()}},
    ],
    'windHeightSamples': [
        {
            'index': 0,
            'value': {
                'heightM': int(ws_wind_sp['R52'].value),
                'kByTerrain': {'А': float(ws_wind_sp['K52'].value), 'В': float(ws_wind_sp['L52'].value), 'С': float(ws_wind_sp['M52'].value)},
                'zetaByTerrain': {'А': float(ws_wind_sp['S52'].value), 'В': float(ws_wind_sp['T52'].value), 'С': float(ws_wind_sp['U52'].value)},
            },
        },
        {
            'index': 6,
            'value': {
                'heightM': int(ws_wind_sp['R58'].value),
                'kByTerrain': {'А': float(ws_wind_sp['K58'].value), 'В': float(ws_wind_sp['L58'].value), 'С': float(ws_wind_sp['M58'].value)},
                'zetaByTerrain': {'А': float(ws_wind_sp['S58'].value), 'В': float(ws_wind_sp['T58'].value), 'С': float(ws_wind_sp['U58'].value)},
            },
        },
        {
            'index': 12,
            'value': {
                'heightM': int(ws_wind_sp['R64'].value),
                'kByTerrain': {'А': float(ws_wind_sp['K64'].value), 'В': float(ws_wind_sp['L64'].value), 'С': float(ws_wind_sp['M64'].value)},
                'zetaByTerrain': {'А': float(ws_wind_sp['S64'].value), 'В': float(ws_wind_sp['T64'].value), 'С': float(ws_wind_sp['U64'].value)},
            },
        },
    ],
}

print(json.dumps(result, ensure_ascii=True))
`.trim()

  return JSON.parse(execFileSync('python', ['-c', pythonScript], { encoding: 'utf-8' })) as WorkbookSmokeSample
}

function expectSampleMatches<T extends object>(samples: Array<SampleWithIndex<T>>, generatedValues: readonly T[]) {
  for (const sample of samples) {
    expect(generatedValues[sample.index]).toMatchObject(sample.value)
  }
}

const workbookPath = findWorkbookPath()
const runIfWorkbookExists = workbookPath ? it : it.skip

describe('purlin workbook parity smoke', () => {
  runIfWorkbookExists('matches key control points from the source workbook', () => {
    const workbook = readWorkbookSmokeSample(workbookPath!)

    expect(purlinAutoStepCapacityTable).toHaveLength(workbook.autoStepCount)
    expectSampleMatches(workbook.autoStepSamples, purlinAutoStepCapacityTable)

    expect(purlinCityLoads).toHaveLength(workbook.cityLoadsCount)
    expectSampleMatches(workbook.cityLoadSamples, purlinCityLoads)

    expect(purlinCoveringCatalog).toHaveLength(workbook.coveringCount)
    expectSampleMatches(workbook.coveringSamples, purlinCoveringCatalog)

    expect(purlinProfileSheetIndices).toMatchObject(workbook.profileSheetIndices)

    expect(purlinLstkMp3502TpsProfiles).toHaveLength(11)
    expect(purlinLstkMp3502PsProfiles).toHaveLength(14)
    expect(purlinLstkMp350ZProfiles).toHaveLength(25)
    expect(purlinLstkMp350StepAxis[0]).toBe(workbook.mp350StepAxis.first)
    expect(purlinLstkMp350StepAxis[Math.floor(purlinLstkMp350StepAxis.length / 2)]).toBe(workbook.mp350StepAxis.middle)
    expect(purlinLstkMp350StepAxis[purlinLstkMp350StepAxis.length - 1]).toBe(workbook.mp350StepAxis.last)
    expectSampleMatches(workbook.mp350Samples.tps, purlinLstkMp3502TpsProfiles)
    expectSampleMatches(workbook.mp350Samples.ps, purlinLstkMp3502PsProfiles)
    expectSampleMatches(workbook.mp350Samples.z, purlinLstkMp350ZProfiles)

    expect(purlinLstkMp3902TpsProfiles).toHaveLength(11)
    expect(purlinLstkMp3902PsProfiles).toHaveLength(14)
    expect(purlinLstkMp390ZProfiles).toHaveLength(25)
    expectSampleMatches(workbook.mp390Samples.tps, purlinLstkMp3902TpsProfiles)
    expectSampleMatches(workbook.mp390Samples.ps, purlinLstkMp3902PsProfiles)
    expectSampleMatches(workbook.mp390Samples.z, purlinLstkMp390ZProfiles)

    expect(purlinNuXValues).toEqual(workbook.nuX)
    expect(purlinNuYValues).toEqual(workbook.nuY)
    expect(purlinNuGrid[0][0]).toBeCloseTo(workbook.nuGrid.topLeft, 6)
    expect(purlinNuGrid[3][3]).toBeCloseTo(workbook.nuGrid.center, 6)
    expect(purlinNuGrid[purlinNuGrid.length - 1][purlinNuGrid[0].length - 1]).toBeCloseTo(
      workbook.nuGrid.bottomRight,
      6,
    )

    expectSampleMatches(workbook.sortSteelSamples, purlinSortSteelProfiles)
    expect(purlinSortSteelStepAxis[0]).toBe(workbook.sortSteelStepAxis.first)
    expect(purlinSortSteelStepAxis[Math.floor(purlinSortSteelStepAxis.length / 2)]).toBe(workbook.sortSteelStepAxis.middle)
    expect(purlinSortSteelStepAxis[purlinSortSteelStepAxis.length - 1]).toBe(workbook.sortSteelStepAxis.last)

    expect(purlinSortSteelStabilityLambdaAxis).toEqual(workbook.stabilityLambdaAxis)
    expect(purlinSortSteelStabilityMefAxis).toEqual(workbook.stabilityMefAxis)
    expect(purlinSortSteelStabilityGrid[0][0]).toBeCloseTo(workbook.stabilityGrid.topLeft, 6)
    expect(purlinSortSteelStabilityGrid[9][22]).toBeCloseTo(workbook.stabilityGrid.center, 6)
    expect(
      purlinSortSteelStabilityGrid[purlinSortSteelStabilityGrid.length - 1][
        purlinSortSteelStabilityGrid[0].length - 1
      ],
    ).toBeCloseTo(workbook.stabilityGrid.bottomRight, 6)

    expectSampleMatches(workbook.spRkEnSamples, purlinSpRkEnCityFlags)
    expectSampleMatches(workbook.windHeightSamples, purlinWindHeightTable)
  }, 90000)
})
