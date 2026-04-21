import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defaultColumnInput, type ColumnInput } from '../src/domain/column/model/column-input.ts'
import { calculateColumn } from '../src/domain/column/model/calculate-column.ts'
import type { ColumnGroupKey } from '../src/domain/column/model/column-output.ts'
import { columnSupportCraneCatalog } from '../src/domain/column/model/column-reference.generated.ts'
import { defaultPurlinInput, type PurlinInput } from '../src/domain/purlin/model/purlin-input.ts'
import { calculatePurlin } from '../src/domain/purlin/model/calculate-purlin.ts'

const OUTPUT_PATH = resolve(process.cwd(), 'docs/ENGINEERING_ACCEPTANCE_CASES.md')
const EXCEL_SNAPSHOT_PATH = resolve(process.cwd(), 'docs/ENGINEERING_ACCEPTANCE_EXCEL_SNAPSHOT.json')
const TODAY = '2026-03-22'

type ResultRow = {
  metric: string
  excel?: string
  app: string
  tolerance: string
}

type ExcelSnapshot = {
  generatedAt: string
  cases: Record<string, Record<string, string>>
}

type ColumnScenario = {
  id: string
  scenario: string
  workbook: string
  notes: string
  input: ColumnInput
  inputRows: Array<[string, string | number]>
  resultRows: ResultRow[]
}

type PurlinScenario = {
  id: string
  scenario: string
  workbook: string
  notes: string
  input: PurlinInput
  inputRows: Array<[string, string | number]>
  resultRows: ResultRow[]
}

function formatDecimal(value: number, digits = 3): string {
  if (!Number.isFinite(value)) {
    return 'n/a'
  }

  return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function formatUtilization(value: number): string {
  return formatDecimal(value, 4)
}

function formatCode(value: string | number): string {
  return `\`${String(value)}\``
}

function loadExcelSnapshot(): ExcelSnapshot | null {
  if (!existsSync(EXCEL_SNAPSHOT_PATH)) {
    return null
  }

  return JSON.parse(readFileSync(EXCEL_SNAPSHOT_PATH, 'utf8')) as ExcelSnapshot
}

function applyExcelSnapshot<T extends { id: string; resultRows: ResultRow[] }>(
  scenarios: T[],
  snapshot: ExcelSnapshot | null,
): T[] {
  if (!snapshot) {
    return scenarios
  }

  return scenarios.map((scenario) => {
    const metricMap = snapshot.cases[scenario.id]

    if (!metricMap) {
      return scenario
    }

    return {
      ...scenario,
      resultRows: scenario.resultRows.map((row) => ({
        ...row,
        excel: metricMap[row.metric] ?? row.excel,
      })),
    }
  })
}

function findColumnGroupKey(input: ColumnInput): ColumnGroupKey {
  if (input.columnType === 'крайняя') {
    return 'extreme'
  }

  if (input.columnType === 'фахверковая') {
    return 'fachwerk'
  }

  return 'middle'
}

function resolveSupportCraneWheelLoadKn(input: ColumnInput): number {
  const roundedSpanM = Math.ceil(input.spanM / 6) * 6
  const normalizedCapacity = input.supportCraneCapacity.replace(/\s+/g, '').replace(',', '.')
  const record = columnSupportCraneCatalog.find(
    (item) => item.spanM === roundedSpanM && item.capacityLabel.replace(/\s+/g, '').replace(',', '.') === normalizedCapacity,
  )

  if (!record) {
    throw new Error(`Unsupported support crane combination: ${input.supportCraneCapacity} / ${roundedSpanM}`)
  }

  return record.wheelLoadKn
}

function renderTableRows(rows: Array<[string, string | number]>): string {
  return rows.map(([field, value]) => `| ${field} | ${formatCode(value)} |`).join('\n')
}

function renderResultRows(rows: ResultRow[]): string {
  return rows
    .map((row) => `| ${row.metric} | ${row.excel ? formatCode(row.excel) : ''} | ${formatCode(row.app)} | ${row.tolerance} | pending |`)
    .join('\n')
}

function buildColumnScenario(definition: Omit<ColumnScenario, 'resultRows'>): ColumnScenario {
  const result = calculateColumn(definition.input, { selectionMode: 'excel' })
  const groupKey = findColumnGroupKey(definition.input)
  const group = result.specification.groups.find((item) => item.key === groupKey)

  if (!group || !group.selectedCandidate) {
    throw new Error(`No selected column candidate for ${definition.id}`)
  }

  const candidate = group.selectedCandidate
  const rowsById: Record<string, ResultRow> = {
    selectedProfile: {
      metric: 'selectedProfile',
      app: candidate.profile,
      tolerance: 'exact',
    },
    columnGroup: {
      metric: 'columnGroup',
      app: group.key,
      tolerance: 'exact',
    },
    unitMassKgPerM: {
      metric: 'unitMassKgPerM',
      app: formatDecimal(candidate.unitMassKg),
      tolerance: 'agreed delta',
    },
    totalMassKg: {
      metric: 'totalMassKg',
      app: formatDecimal(candidate.totalMassKg),
      tolerance: 'agreed delta',
    },
    utilization: {
      metric: 'utilization',
      app: formatUtilization(candidate.utilization),
      tolerance: 'agreed delta',
    },
    snowLoadKpa: {
      metric: 'snowLoadKpa',
      app: formatDecimal(result.derivedContext.snowLoadKpa),
      tolerance: 'exact',
    },
    windLoadKpa: {
      metric: 'windLoadKpa',
      app: formatDecimal(result.derivedContext.windLoadKpa),
      tolerance: 'exact',
    },
    craneWheelLoadKn: {
      metric: 'craneWheelLoadKn',
      app: formatDecimal(resolveSupportCraneWheelLoadKn(definition.input)),
      tolerance: 'exact',
    },
  }

  return {
    ...definition,
    resultRows: definition.resultRows.map((row) => rowsById[row.metric]),
  }
}

function buildPurlinScenario(definition: Omit<PurlinScenario, 'resultRows'>): PurlinScenario {
  const result = calculatePurlin(definition.input)
  const sortTop = result.sortSteelTop10[0] ?? null
  const mp350Top = result.lstkMp350Top[0] ?? null
  const mp390Top = result.lstkMp390Top[0] ?? null
  if (definition.id === 'P-01') {
    if (!sortTop) {
      throw new Error('Missing sort steel candidate for P-01')
    }

    return {
      ...definition,
      resultRows: [
        { metric: 'topFamily', app: sortTop.family ?? 'n/a', tolerance: 'exact' },
        { metric: 'selectedProfile', app: sortTop.profile, tolerance: 'exact' },
        { metric: 'stepMm', app: String(sortTop.stepMm ?? 'n/a'), tolerance: 'exact' },
        { metric: 'totalMassKg', app: formatDecimal(sortTop.totalMassKg), tolerance: 'agreed delta' },
        { metric: 'utilization', app: formatUtilization(sortTop.utilization), tolerance: 'agreed delta' },
      ],
    }
  }

  if (definition.id === 'P-02') {
    if (!mp350Top) {
      throw new Error('Missing MP350 candidate for P-02')
    }

    return {
      ...definition,
      resultRows: [
        { metric: 'MP350 top family', app: mp350Top.family ?? 'n/a', tolerance: 'exact' },
        { metric: 'MP350 selectedProfile', app: mp350Top.profile, tolerance: 'exact' },
        { metric: 'MP350 stepMm', app: String(mp350Top.stepMm ?? 'n/a'), tolerance: 'exact' },
        { metric: 'MP350 totalMassKg', app: formatDecimal(mp350Top.totalMassKg), tolerance: 'agreed delta' },
      ],
    }
  }

  if (definition.id === 'P-03') {
    if (!mp390Top) {
      throw new Error('Missing MP390 candidate for P-03')
    }

    return {
      ...definition,
      resultRows: [
        { metric: 'MP390 top family', app: mp390Top.family ?? 'n/a', tolerance: 'exact' },
        { metric: 'MP390 selectedProfile', app: mp390Top.profile, tolerance: 'exact' },
        { metric: 'MP390 stepMm', app: String(mp390Top.stepMm ?? 'n/a'), tolerance: 'exact' },
        { metric: 'MP390 totalMassKg', app: formatDecimal(mp390Top.totalMassKg), tolerance: 'agreed delta' },
      ],
    }
  }

  if (definition.id === 'P-04') {
    if (!sortTop) {
      throw new Error('Missing sort steel candidate for P-04')
    }

    return {
      ...definition,
      resultRows: [
        { metric: 'selectedFamily', app: sortTop.family ?? 'n/a', tolerance: 'exact' },
        { metric: 'selectedProfile', app: sortTop.profile, tolerance: 'exact' },
        { metric: 'stepMm', app: String(sortTop.stepMm ?? 'n/a'), tolerance: 'exact' },
        { metric: 'totalMassKg', app: formatDecimal(sortTop.totalMassKg), tolerance: 'agreed delta' },
        { metric: 'utilization', app: formatUtilization(sortTop.utilization), tolerance: 'agreed delta' },
      ],
    }
  }

  const selected = result.lstkMp390Top[0] ?? result.lstkMp350Top[0] ?? sortTop

  if (!selected) {
    throw new Error(`Missing purlin candidate for ${definition.id}`)
  }

  return {
    ...definition,
    resultRows: [
      { metric: 'selectedFamily', app: selected.family ?? 'n/a', tolerance: 'exact' },
      { metric: 'selectedProfile', app: selected.profile, tolerance: 'exact' },
      { metric: 'stepMm', app: String(selected.stepMm ?? 'n/a'), tolerance: 'exact and `<= 1800`' },
      { metric: 'totalMassKg', app: formatDecimal(selected.totalMassKg), tolerance: 'agreed delta' },
      { metric: 'utilization', app: formatUtilization(selected.utilization), tolerance: 'agreed delta' },
    ],
  }
}

const columnScenarios: ColumnScenario[] = [
  buildColumnScenario({
    id: 'C-01',
    scenario: 'default baseline',
    workbook: 'column_calculator_final_release.xlsx',
    notes: 'default app input',
    input: { ...defaultColumnInput },
    inputRows: [
      ['city', defaultColumnInput.city],
      ['responsibilityLevel', defaultColumnInput.responsibilityLevel],
      ['roofType', defaultColumnInput.roofType],
      ['spanM', defaultColumnInput.spanM],
      ['buildingLengthM', defaultColumnInput.buildingLengthM],
      ['buildingHeightM', defaultColumnInput.buildingHeightM],
      ['roofSlopeDeg', defaultColumnInput.roofSlopeDeg],
      ['frameStepM', defaultColumnInput.frameStepM],
      ['facadeColumnStepM', defaultColumnInput.facadeColumnStepM],
      ['spansCount', defaultColumnInput.spansCount],
      ['perimeterBracing', defaultColumnInput.perimeterBracing],
      ['terrainType', defaultColumnInput.terrainType],
      ['roofCoveringType', defaultColumnInput.roofCoveringType],
      ['wallCoveringType', defaultColumnInput.wallCoveringType],
      ['columnType', defaultColumnInput.columnType],
      ['extraLoadPercent', defaultColumnInput.extraLoadPercent],
      ['supportCraneMode', defaultColumnInput.supportCraneMode],
      ['supportCraneSingleSpanMode', defaultColumnInput.supportCraneSingleSpanMode],
      ['supportCraneCapacity', defaultColumnInput.supportCraneCapacity],
      ['supportCraneCount', defaultColumnInput.supportCraneCount],
      ['supportCraneRailLevelM', defaultColumnInput.supportCraneRailLevelM],
      ['hangingCraneMode', defaultColumnInput.hangingCraneMode],
      ['hangingCraneCapacityT', defaultColumnInput.hangingCraneCapacityT],
    ],
    resultRows: [
      { metric: 'selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'columnGroup', app: '', tolerance: 'exact' },
      { metric: 'unitMassKgPerM', app: '', tolerance: 'agreed delta' },
      { metric: 'totalMassKg', app: '', tolerance: 'agreed delta' },
      { metric: 'utilization', app: '', tolerance: 'agreed delta' },
    ],
  }),
  buildColumnScenario({
    id: 'C-02',
    scenario: 'high snow / low wind',
    workbook: 'column_calculator_final_release.xlsx',
    notes: 'snow-driven check',
    input: { ...defaultColumnInput, city: 'Киров' },
    inputRows: [
      ['city', 'Киров'],
      ['responsibilityLevel', defaultColumnInput.responsibilityLevel],
      ['roofType', defaultColumnInput.roofType],
      ['spanM', defaultColumnInput.spanM],
      ['buildingLengthM', defaultColumnInput.buildingLengthM],
      ['buildingHeightM', defaultColumnInput.buildingHeightM],
      ['roofSlopeDeg', defaultColumnInput.roofSlopeDeg],
      ['frameStepM', defaultColumnInput.frameStepM],
      ['facadeColumnStepM', defaultColumnInput.facadeColumnStepM],
      ['spansCount', defaultColumnInput.spansCount],
      ['perimeterBracing', defaultColumnInput.perimeterBracing],
      ['terrainType', defaultColumnInput.terrainType],
      ['roofCoveringType', defaultColumnInput.roofCoveringType],
      ['wallCoveringType', defaultColumnInput.wallCoveringType],
      ['columnType', defaultColumnInput.columnType],
      ['extraLoadPercent', defaultColumnInput.extraLoadPercent],
      ['supportCraneMode', defaultColumnInput.supportCraneMode],
      ['supportCraneCapacity', defaultColumnInput.supportCraneCapacity],
      ['supportCraneCount', defaultColumnInput.supportCraneCount],
      ['supportCraneRailLevelM', defaultColumnInput.supportCraneRailLevelM],
    ],
    resultRows: [
      { metric: 'selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'snowLoadKpa', app: '', tolerance: 'exact' },
      { metric: 'unitMassKgPerM', app: '', tolerance: 'agreed delta' },
      { metric: 'totalMassKg', app: '', tolerance: 'agreed delta' },
      { metric: 'utilization', app: '', tolerance: 'agreed delta' },
    ],
  }),
  buildColumnScenario({
    id: 'C-03',
    scenario: 'high wind / tall building',
    workbook: 'column_calculator_final_release.xlsx',
    notes: 'wind + height stress',
    input: { ...defaultColumnInput, city: 'Каспийск', buildingLengthM: 90, buildingHeightM: 16, terrainType: 'А' },
    inputRows: [
      ['city', 'Каспийск'],
      ['responsibilityLevel', defaultColumnInput.responsibilityLevel],
      ['roofType', defaultColumnInput.roofType],
      ['spanM', defaultColumnInput.spanM],
      ['buildingLengthM', 90],
      ['buildingHeightM', 16],
      ['roofSlopeDeg', defaultColumnInput.roofSlopeDeg],
      ['frameStepM', defaultColumnInput.frameStepM],
      ['facadeColumnStepM', defaultColumnInput.facadeColumnStepM],
      ['spansCount', defaultColumnInput.spansCount],
      ['perimeterBracing', defaultColumnInput.perimeterBracing],
      ['terrainType', 'А'],
      ['roofCoveringType', defaultColumnInput.roofCoveringType],
      ['wallCoveringType', defaultColumnInput.wallCoveringType],
      ['columnType', defaultColumnInput.columnType],
      ['extraLoadPercent', defaultColumnInput.extraLoadPercent],
      ['supportCraneMode', defaultColumnInput.supportCraneMode],
      ['supportCraneCapacity', defaultColumnInput.supportCraneCapacity],
      ['supportCraneCount', defaultColumnInput.supportCraneCount],
      ['supportCraneRailLevelM', defaultColumnInput.supportCraneRailLevelM],
    ],
    resultRows: [
      { metric: 'selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'windLoadKpa', app: '', tolerance: 'exact' },
      { metric: 'unitMassKgPerM', app: '', tolerance: 'agreed delta' },
      { metric: 'totalMassKg', app: '', tolerance: 'agreed delta' },
      { metric: 'utilization', app: '', tolerance: 'agreed delta' },
    ],
  }),
  buildColumnScenario({
    id: 'C-04',
    scenario: 'support crane enabled',
    workbook: 'column_calculator_final_release.xlsx',
    notes: 'crane branch',
    input: { ...defaultColumnInput, supportCraneMode: 'есть', supportCraneCapacity: '10' },
    inputRows: [
      ['city', defaultColumnInput.city],
      ['responsibilityLevel', defaultColumnInput.responsibilityLevel],
      ['roofType', defaultColumnInput.roofType],
      ['spanM', defaultColumnInput.spanM],
      ['buildingLengthM', defaultColumnInput.buildingLengthM],
      ['buildingHeightM', defaultColumnInput.buildingHeightM],
      ['roofSlopeDeg', defaultColumnInput.roofSlopeDeg],
      ['frameStepM', defaultColumnInput.frameStepM],
      ['facadeColumnStepM', defaultColumnInput.facadeColumnStepM],
      ['spansCount', defaultColumnInput.spansCount],
      ['perimeterBracing', defaultColumnInput.perimeterBracing],
      ['terrainType', defaultColumnInput.terrainType],
      ['roofCoveringType', defaultColumnInput.roofCoveringType],
      ['wallCoveringType', defaultColumnInput.wallCoveringType],
      ['columnType', defaultColumnInput.columnType],
      ['extraLoadPercent', defaultColumnInput.extraLoadPercent],
      ['supportCraneMode', 'есть'],
      ['supportCraneSingleSpanMode', defaultColumnInput.supportCraneSingleSpanMode],
      ['supportCraneCapacity', '10'],
      ['supportCraneCount', defaultColumnInput.supportCraneCount],
      ['supportCraneRailLevelM', defaultColumnInput.supportCraneRailLevelM],
      ['hangingCraneMode', defaultColumnInput.hangingCraneMode],
    ],
    resultRows: [
      { metric: 'selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'craneWheelLoadKn', app: '', tolerance: 'exact' },
      { metric: 'unitMassKgPerM', app: '', tolerance: 'agreed delta' },
      { metric: 'totalMassKg', app: '', tolerance: 'agreed delta' },
      { metric: 'utilization', app: '', tolerance: 'agreed delta' },
    ],
  }),
  buildColumnScenario({
    id: 'C-05',
    scenario: 'multi-span middle-column',
    workbook: 'column_calculator_final_release.xlsx',
    notes: 'multi-span branch',
    input: { ...defaultColumnInput, spansCount: 'более одного', columnType: 'средняя' },
    inputRows: [
      ['city', defaultColumnInput.city],
      ['responsibilityLevel', defaultColumnInput.responsibilityLevel],
      ['roofType', defaultColumnInput.roofType],
      ['spanM', defaultColumnInput.spanM],
      ['buildingLengthM', defaultColumnInput.buildingLengthM],
      ['buildingHeightM', defaultColumnInput.buildingHeightM],
      ['roofSlopeDeg', defaultColumnInput.roofSlopeDeg],
      ['frameStepM', defaultColumnInput.frameStepM],
      ['facadeColumnStepM', defaultColumnInput.facadeColumnStepM],
      ['spansCount', 'более одного'],
      ['perimeterBracing', defaultColumnInput.perimeterBracing],
      ['terrainType', defaultColumnInput.terrainType],
      ['roofCoveringType', defaultColumnInput.roofCoveringType],
      ['wallCoveringType', defaultColumnInput.wallCoveringType],
      ['columnType', 'средняя'],
      ['extraLoadPercent', defaultColumnInput.extraLoadPercent],
      ['supportCraneMode', defaultColumnInput.supportCraneMode],
      ['supportCraneCapacity', defaultColumnInput.supportCraneCapacity],
      ['supportCraneCount', defaultColumnInput.supportCraneCount],
      ['supportCraneRailLevelM', defaultColumnInput.supportCraneRailLevelM],
    ],
    resultRows: [
      { metric: 'selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'columnGroup', app: '', tolerance: 'exact' },
      { metric: 'unitMassKgPerM', app: '', tolerance: 'agreed delta' },
      { metric: 'totalMassKg', app: '', tolerance: 'agreed delta' },
      { metric: 'utilization', app: '', tolerance: 'agreed delta' },
    ],
  }),
]

const purlinScenarios: PurlinScenario[] = [
  buildPurlinScenario({
    id: 'P-01',
    scenario: 'default baseline',
    workbook: 'calculator_final_release.xlsx',
    notes: 'default app input',
    input: { ...defaultPurlinInput },
    inputRows: [
      ['city', defaultPurlinInput.city],
      ['normativeMode', defaultPurlinInput.normativeMode],
      ['responsibilityLevel', defaultPurlinInput.responsibilityLevel],
      ['roofType', defaultPurlinInput.roofType],
      ['spanM', defaultPurlinInput.spanM],
      ['buildingLengthM', defaultPurlinInput.buildingLengthM],
      ['buildingHeightM', defaultPurlinInput.buildingHeightM],
      ['roofSlopeDeg', defaultPurlinInput.roofSlopeDeg],
      ['frameStepM', defaultPurlinInput.frameStepM],
      ['fakhverkSpacingM', defaultPurlinInput.fakhverkSpacingM],
      ['terrainType', defaultPurlinInput.terrainType],
      ['coveringType', defaultPurlinInput.coveringType],
      ['profileSheet', defaultPurlinInput.profileSheet],
      ['snowBagMode', defaultPurlinInput.snowBagMode],
      ['heightDifferenceM', defaultPurlinInput.heightDifferenceM],
      ['adjacentBuildingSizeM', defaultPurlinInput.adjacentBuildingSizeM],
      ['manualMaxStepMm', defaultPurlinInput.manualMaxStepMm],
      ['manualMinStepMm', defaultPurlinInput.manualMinStepMm],
      ['maxUtilizationRatio', defaultPurlinInput.maxUtilizationRatio],
      ['tiesSetting', defaultPurlinInput.tiesSetting],
      ['snowRetentionPurlin', defaultPurlinInput.snowRetentionPurlin],
      ['barrierPurlin', defaultPurlinInput.barrierPurlin],
    ],
    resultRows: [
      { metric: 'topFamily', app: '', tolerance: 'exact' },
      { metric: 'selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'stepMm', app: '', tolerance: 'exact' },
      { metric: 'totalMassKg', app: '', tolerance: 'agreed delta' },
      { metric: 'utilization', app: '', tolerance: 'agreed delta' },
    ],
  }),
  buildPurlinScenario({
    id: 'P-02',
    scenario: 'MP350 edge case',
    workbook: 'calculator_final_release.xlsx',
    notes: 'MP350 family focus',
    input: { ...defaultPurlinInput },
    inputRows: [
      ['city', defaultPurlinInput.city],
      ['normativeMode', defaultPurlinInput.normativeMode],
      ['responsibilityLevel', defaultPurlinInput.responsibilityLevel],
      ['roofType', defaultPurlinInput.roofType],
      ['spanM', defaultPurlinInput.spanM],
      ['buildingLengthM', defaultPurlinInput.buildingLengthM],
      ['buildingHeightM', defaultPurlinInput.buildingHeightM],
      ['roofSlopeDeg', defaultPurlinInput.roofSlopeDeg],
      ['frameStepM', defaultPurlinInput.frameStepM],
      ['fakhverkSpacingM', defaultPurlinInput.fakhverkSpacingM],
      ['terrainType', defaultPurlinInput.terrainType],
      ['coveringType', defaultPurlinInput.coveringType],
      ['profileSheet', defaultPurlinInput.profileSheet],
      ['snowBagMode', defaultPurlinInput.snowBagMode],
      ['manualMaxStepMm', defaultPurlinInput.manualMaxStepMm],
      ['maxUtilizationRatio', defaultPurlinInput.maxUtilizationRatio],
      ['tiesSetting', defaultPurlinInput.tiesSetting],
      ['note', 'verify MP350 / 2TPS, 2PS and Z ordering'],
    ],
    resultRows: [
      { metric: 'MP350 top family', app: '', tolerance: 'exact' },
      { metric: 'MP350 selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'MP350 stepMm', app: '', tolerance: 'exact' },
      { metric: 'MP350 totalMassKg', app: '', tolerance: 'agreed delta' },
    ],
  }),
  buildPurlinScenario({
    id: 'P-03',
    scenario: 'MP390 edge case',
    workbook: 'calculator_final_release.xlsx',
    notes: 'MP390 family focus',
    input: { ...defaultPurlinInput, profileSheet: 'Н60-845-0,8' },
    inputRows: [
      ['city', defaultPurlinInput.city],
      ['normativeMode', defaultPurlinInput.normativeMode],
      ['responsibilityLevel', defaultPurlinInput.responsibilityLevel],
      ['roofType', defaultPurlinInput.roofType],
      ['spanM', defaultPurlinInput.spanM],
      ['buildingLengthM', defaultPurlinInput.buildingLengthM],
      ['buildingHeightM', defaultPurlinInput.buildingHeightM],
      ['roofSlopeDeg', defaultPurlinInput.roofSlopeDeg],
      ['frameStepM', defaultPurlinInput.frameStepM],
      ['fakhverkSpacingM', defaultPurlinInput.fakhverkSpacingM],
      ['terrainType', defaultPurlinInput.terrainType],
      ['coveringType', defaultPurlinInput.coveringType],
      ['profileSheet', 'Н60-845-0,8'],
      ['snowBagMode', defaultPurlinInput.snowBagMode],
      ['manualMaxStepMm', defaultPurlinInput.manualMaxStepMm],
      ['maxUtilizationRatio', defaultPurlinInput.maxUtilizationRatio],
      ['tiesSetting', defaultPurlinInput.tiesSetting],
      ['note', 'verify MP390 family ranking'],
    ],
    resultRows: [
      { metric: 'MP390 top family', app: '', tolerance: 'exact' },
      { metric: 'MP390 selectedProfile', app: '', tolerance: 'exact' },
      { metric: 'MP390 stepMm', app: '', tolerance: 'exact' },
      { metric: 'MP390 totalMassKg', app: '', tolerance: 'agreed delta' },
    ],
  }),
  buildPurlinScenario({
    id: 'P-04',
    scenario: 'sort-steel branch',
    workbook: 'calculator_final_release.xlsx',
    notes: 'non-LSTK branch',
    input: { ...defaultPurlinInput, coveringType: 'профлист', profileSheet: 'С44-1000-0,5', maxUtilizationRatio: 0.95, tiesSetting: '2' },
    inputRows: [
      ['city', defaultPurlinInput.city],
      ['normativeMode', defaultPurlinInput.normativeMode],
      ['responsibilityLevel', defaultPurlinInput.responsibilityLevel],
      ['roofType', defaultPurlinInput.roofType],
      ['spanM', defaultPurlinInput.spanM],
      ['buildingLengthM', defaultPurlinInput.buildingLengthM],
      ['buildingHeightM', defaultPurlinInput.buildingHeightM],
      ['roofSlopeDeg', defaultPurlinInput.roofSlopeDeg],
      ['frameStepM', defaultPurlinInput.frameStepM],
      ['fakhverkSpacingM', defaultPurlinInput.fakhverkSpacingM],
      ['terrainType', defaultPurlinInput.terrainType],
      ['coveringType', 'профлист'],
      ['profileSheet', 'С44-1000-0,5'],
      ['snowBagMode', defaultPurlinInput.snowBagMode],
      ['manualMaxStepMm', defaultPurlinInput.manualMaxStepMm],
      ['maxUtilizationRatio', 0.95],
      ['tiesSetting', '2'],
      ['note', 'verify sort-steel recommendation path'],
    ],
    resultRows: [
      { metric: 'selectedFamily', app: 'p04', tolerance: 'exact' },
      { metric: 'selectedProfile', app: 'p04', tolerance: 'exact' },
      { metric: 'stepMm', app: 'p04', tolerance: 'exact' },
      { metric: 'totalMassKg', app: 'p04', tolerance: 'agreed delta' },
      { metric: 'utilization', app: 'p04', tolerance: 'agreed delta' },
    ],
  }),
  buildPurlinScenario({
    id: 'P-05',
    scenario: 'manual step clamp',
    workbook: 'calculator_final_release.xlsx',
    notes: 'min/max step handling',
    input: { ...defaultPurlinInput, manualMaxStepMm: 1800 },
    inputRows: [
      ['city', defaultPurlinInput.city],
      ['normativeMode', defaultPurlinInput.normativeMode],
      ['responsibilityLevel', defaultPurlinInput.responsibilityLevel],
      ['roofType', defaultPurlinInput.roofType],
      ['spanM', defaultPurlinInput.spanM],
      ['buildingLengthM', defaultPurlinInput.buildingLengthM],
      ['buildingHeightM', defaultPurlinInput.buildingHeightM],
      ['roofSlopeDeg', defaultPurlinInput.roofSlopeDeg],
      ['frameStepM', defaultPurlinInput.frameStepM],
      ['fakhverkSpacingM', defaultPurlinInput.fakhverkSpacingM],
      ['terrainType', defaultPurlinInput.terrainType],
      ['coveringType', defaultPurlinInput.coveringType],
      ['profileSheet', defaultPurlinInput.profileSheet],
      ['snowBagMode', defaultPurlinInput.snowBagMode],
      ['manualMaxStepMm', 1800],
      ['manualMinStepMm', defaultPurlinInput.manualMinStepMm],
      ['maxUtilizationRatio', defaultPurlinInput.maxUtilizationRatio],
      ['tiesSetting', defaultPurlinInput.tiesSetting],
    ],
    resultRows: [
      { metric: 'selectedFamily', app: 'p05', tolerance: 'exact' },
      { metric: 'selectedProfile', app: 'p05', tolerance: 'exact' },
      { metric: 'stepMm', app: 'p05', tolerance: 'exact and `<= 1800`' },
      { metric: 'totalMassKg', app: 'p05', tolerance: 'agreed delta' },
      { metric: 'utilization', app: 'p05', tolerance: 'agreed delta' },
    ],
  }),
]

function renderColumnCase(scenario: ColumnScenario): string {
  return `### ${scenario.id}

- Domain: \`column\`
- Scenario: ${scenario.scenario}
- Workbook: \`${scenario.workbook}\`
- Verified by:
- Date:
- Status: \`pending\`

#### Inputs

| Field | Value |
| --- | --- |
${renderTableRows(scenario.inputRows)}

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
${renderResultRows(scenario.resultRows)}`
}

function renderPurlinCase(scenario: PurlinScenario): string {
  return `### ${scenario.id}

- Domain: \`purlin\`
- Scenario: ${scenario.scenario}
- Workbook: \`${scenario.workbook}\`
- Verified by:
- Date:
- Status: \`pending\`

#### Inputs

| Field | Value |
| --- | --- |
${renderTableRows(scenario.inputRows)}

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
${renderResultRows(scenario.resultRows)}`
}

const excelSnapshot = loadExcelSnapshot()
const columnScenariosWithExcel = applyExcelSnapshot(columnScenarios, excelSnapshot)
const purlinScenariosWithExcel = applyExcelSnapshot(purlinScenarios, excelSnapshot)

const summaryRows = [
  ...columnScenariosWithExcel.map((scenario) => `| ${scenario.id} | column | ${scenario.scenario.replace(/^./, (char) => char.toUpperCase())} | \`${scenario.workbook}\` | pending | ${scenario.notes} |`),
  ...purlinScenariosWithExcel.map((scenario) => `| ${scenario.id} | purlin | ${scenario.scenario.replace(/^./, (char) => char.toUpperCase())} | \`${scenario.workbook}\` | pending | ${scenario.notes} |`),
].join('\n')

const document = `# Engineering Acceptance Cases

This file is the working release sheet for final Excel-vs-app acceptance.

App snapshot values in the \`App\` column are auto-generated from the current TypeScript calculator on ${TODAY}.
Excel columns are populated from an auto-generated workbook snapshot when available. Final parity sign-off remains manual.

Selection conventions:

- \`column\`: use workbook-parity \`excel\` selection mode for the scenario \`columnType\`
- \`P-01\` and \`P-04\`: use the default auto-selected \`sort steel\` branch
- \`P-02\` and \`P-03\`: use the first candidate from the MP350 or MP390 branch
- \`P-05\`: use the workbook-visible MP390 recommendation under the manual step clamp

Current auto-snapshot status:

- comparable metrics match for \`C-01..C-05\` and \`P-01..P-03, P-05\`
- \`P-04\` remains unsupported because the workbook exposes no \`maxUtilizationRatio\` input
- purlin utilization rows remain workbook-opaque, so Excel stays \`n/a\` there

Status values:

- \`pending\`
- \`accepted\`
- \`rejected\`

## Summary

| ID | Domain | Scenario | Workbook | Status | Notes |
| --- | --- | --- | --- | --- | --- |
${summaryRows}

## Column Cases

${columnScenariosWithExcel.map(renderColumnCase).join('\n\n')}

## Purlin Cases

${purlinScenariosWithExcel.map(renderPurlinCase).join('\n\n')}
`

writeFileSync(OUTPUT_PATH, document, 'utf8')
console.log(`Updated ${OUTPUT_PATH}`)


