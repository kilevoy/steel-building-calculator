import type { CandidateResult } from '@/domain/common/model/candidate-result'
import { buildColumnDerivedContext } from '@/domain/column/model/column-derived-context'
import {
  COLUMN_TYPE_EXTREME,
  COLUMN_TYPE_FACHWERK,
  COLUMN_TYPE_MIDDLE,
  columnInputSchema,
  type ColumnInput,
  type ColumnType,
} from '@/domain/column/model/column-input'
import { calculateColumnTopCandidatesForType } from '@/domain/column/model/column-ranking'
import type {
  ColumnCalculationResult,
  ColumnGroupKey,
  ColumnGroupSpecification,
  ColumnSelectionByType,
  ColumnSpecificationRow,
  ColumnTopCandidatesByType,
} from '@/domain/column/model/column-output'
import { columnBraceUnitMassKgPerM } from '@/domain/column/model/column-reference.generated'

export type { ColumnCalculationResult }

const COLUMN_GROUPS: ReadonlyArray<{
  key: ColumnGroupKey
  type: ColumnType
  label: string
}> = [
  {
    key: 'extreme',
    type: COLUMN_TYPE_EXTREME,
    label: 'Крайние колонны',
  },
  {
    key: 'fachwerk',
    type: COLUMN_TYPE_FACHWERK,
    label: 'Фахверковые колонны',
  },
  {
    key: 'middle',
    type: COLUMN_TYPE_MIDDLE,
    label: 'Внутренние колонны',
  },
]

interface GeometryRow {
  xM: number
  lengthM: number
  branchesCount: number
}

interface ColumnGroupGeometry {
  key: ColumnGroupKey
  type: ColumnType
  label: string
  rows: GeometryRow[]
  columnsCount: number
  geometryLengthsM: number[]
  criticalHeightM: number
  braceLengthM: number
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function isSingleSpan(spansCount: string): boolean {
  const normalized = normalizeText(spansCount)
  return normalized.includes('один') || normalized.includes('single') || normalized === '1'
}

function isMonopitchRoof(roofType: string): boolean {
  const normalized = normalizeText(roofType)
  return normalized.includes('односкат') || normalized.includes('monopitch') || normalized.includes('mono')
}

function toRadians(value: number): number {
  return (value / 180) * Math.PI
}

function resolveColumnHeightAtX(input: ColumnInput, xM: number): number {
  const slopePart = Math.tan(toRadians(input.roofSlopeDeg))

  if (isMonopitchRoof(input.roofType)) {
    return input.buildingHeightM + xM * slopePart
  }

  return input.buildingHeightM + Math.min(xM, input.spanM - xM) * slopePart
}

function resolveInteriorFrameCount(input: ColumnInput): number {
  return Math.max(0, Math.floor(input.buildingLengthM / input.frameStepM) - 1)
}

function resolveExtremeRows(input: ColumnInput): GeometryRow[] {
  const interiorFrameCount = resolveInteriorFrameCount(input)

  if (interiorFrameCount <= 0) {
    return []
  }

  const lowRow: GeometryRow = {
    xM: 0,
    lengthM: resolveColumnHeightAtX(input, 0),
    branchesCount: interiorFrameCount,
  }
  const highRow: GeometryRow = {
    xM: input.spanM,
    lengthM: resolveColumnHeightAtX(input, input.spanM),
    branchesCount: interiorFrameCount,
  }

  if (Math.abs(lowRow.lengthM - highRow.lengthM) < 1e-6) {
    return [
      {
        xM: 0,
        lengthM: lowRow.lengthM,
        branchesCount: lowRow.branchesCount + highRow.branchesCount,
      },
    ]
  }

  return [lowRow, highRow]
}

function resolveFachwerkRows(input: ColumnInput): GeometryRow[] {
  const countPerEnd = Math.max(1, Math.floor(input.spanM / input.facadeColumnStepM) + 1)
  const rows: GeometryRow[] = []

  for (let index = 0; index < countPerEnd; index += 1) {
    const xM = Math.min(index * input.facadeColumnStepM, input.spanM)
    rows.push({
      xM,
      lengthM: resolveColumnHeightAtX(input, xM),
      branchesCount: 2,
    })
  }

  return rows
}

function resolveMiddleRows(input: ColumnInput): GeometryRow[] {
  if (isSingleSpan(input.spansCount)) {
    return []
  }

  const interiorFrameCount = resolveInteriorFrameCount(input)

  if (interiorFrameCount <= 0) {
    return []
  }

  return [
    {
      xM: input.spanM / 2,
      lengthM: resolveColumnHeightAtX(input, input.spanM / 2),
      branchesCount: interiorFrameCount,
    },
  ]
}

function flattenGeometryLengths(rows: GeometryRow[]): number[] {
  return rows.flatMap((row) => Array.from({ length: row.branchesCount }, () => row.lengthM))
}

function buildGroupGeometries(input: ColumnInput): ColumnGroupGeometry[] {
  const byKey: Record<ColumnGroupKey, { rows: GeometryRow[]; braceLengthM: number }> = {
    extreme: {
      rows: resolveExtremeRows(input),
      braceLengthM: input.frameStepM,
    },
    fachwerk: {
      rows: resolveFachwerkRows(input),
      braceLengthM: input.facadeColumnStepM,
    },
    middle: {
      rows: resolveMiddleRows(input),
      braceLengthM: input.frameStepM,
    },
  }

  return COLUMN_GROUPS.map((group) => {
    const data = byKey[group.key]
    const geometryLengthsM = flattenGeometryLengths(data.rows)

    return {
      key: group.key,
      type: group.type,
      label: group.label,
      rows: data.rows,
      columnsCount: data.rows.reduce((sum, row) => sum + row.branchesCount, 0),
      geometryLengthsM,
      criticalHeightM: geometryLengthsM.length > 0 ? Math.max(...geometryLengthsM) : input.buildingHeightM,
      braceLengthM: data.braceLengthM,
    }
  })
}

function resolveAnalysisHeightM(
  group: ColumnGroupGeometry,
  input: ColumnInput,
): number {
  return input.columnSelectionMode === 'excel' ? input.buildingHeightM : group.criticalHeightM
}

function clampSelectedIndex(index: number, listLength: number): number {
  if (!Number.isFinite(index) || listLength <= 0) {
    return 0
  }

  const normalized = Math.trunc(index)
  return Math.min(Math.max(normalized, 0), listLength - 1)
}

function resolveSelectedProfiles(
  input: ColumnInput,
  topCandidatesByType: ColumnTopCandidatesByType,
): ColumnSelectionByType {
  if (!input.isManualMode) {
    return {
      extreme: 0,
      fachwerk: 0,
      middle: 0,
    }
  }

  return {
    extreme: clampSelectedIndex(input.selectedProfileExtreme, topCandidatesByType.extreme.length),
    fachwerk: clampSelectedIndex(input.selectedProfileFachwerk, topCandidatesByType.fachwerk.length),
    middle: clampSelectedIndex(input.selectedProfileMiddle, topCandidatesByType.middle.length),
  }
}

function resolveGroupKey(columnType: ColumnType): ColumnGroupKey {
  if (columnType === COLUMN_TYPE_EXTREME) {
    return 'extreme'
  }

  if (columnType === COLUMN_TYPE_FACHWERK) {
    return 'fachwerk'
  }

  return 'middle'
}

function buildGroupSpecification(
  group: ColumnGroupGeometry,
  selectedIndex: number,
  candidates: CandidateResult[],
): ColumnGroupSpecification {
  const selectedCandidate = candidates[selectedIndex] ?? null

  if (!selectedCandidate) {
    return {
      key: group.key,
      label: group.label,
      columnType: group.type,
      selectedIndex,
      braceLengthM: group.braceLengthM,
      criticalHeightM: group.criticalHeightM,
      columnsCount: group.columnsCount,
      geometryLengthsM: group.geometryLengthsM,
      selectedCandidate: null,
      bracesTotalCount: 0,
      columnsMassKg: 0,
      bracesMassKg: 0,
      totalMassKg: 0,
      totalCostRub: 0,
      rows: [],
    }
  }

  const braceCount = selectedCandidate.braceCount ?? 0
  const braceMassPerColumnKg = braceCount * group.braceLengthM * columnBraceUnitMassKgPerM * 1.15
  const priceTonRub = selectedCandidate.priceTonRub ?? 0

  const rows: ColumnSpecificationRow[] = group.rows.map((row) => {
    const unitMassKg = selectedCandidate.unitMassKg * row.lengthM * 1.15
    const withBracesMassKg = unitMassKg + braceMassPerColumnKg
    const totalMassKg = unitMassKg * row.branchesCount
    const totalMassWithBracesKg = withBracesMassKg * row.branchesCount
    const totalCostRub =
      priceTonRub > 0
        ? (totalMassWithBracesKg / 1000) * priceTonRub
        : (selectedCandidate.estimatedCostRub ?? 0) * row.branchesCount

    return {
      xM: row.xM,
      lengthM: row.lengthM,
      profile: selectedCandidate.profile,
      steelGrade: selectedCandidate.steelGrade,
      braceCount,
      branchesCount: row.branchesCount,
      unitMassKg,
      withBracesMassKg,
      totalMassKg,
      totalCostRub,
    }
  })

  const columnsMassKg = rows.reduce((sum, row) => sum + row.totalMassKg, 0)
  const bracesMassKg = braceMassPerColumnKg * group.columnsCount
  const totalMassKg = columnsMassKg + bracesMassKg
  const totalCostRub = rows.reduce((sum, row) => sum + row.totalCostRub, 0)

  return {
    key: group.key,
    label: group.label,
    columnType: group.type,
    selectedIndex,
    braceLengthM: group.braceLengthM,
    criticalHeightM: group.criticalHeightM,
    columnsCount: group.columnsCount,
    geometryLengthsM: group.geometryLengthsM,
    selectedCandidate,
    bracesTotalCount: braceCount * group.columnsCount,
    columnsMassKg,
    bracesMassKg,
    totalMassKg,
    totalCostRub,
    rows,
  }
}

export function calculateColumn(
  input: ColumnInput,
): ColumnCalculationResult {
  const validated = columnInputSchema.parse(input)
  const derivedContext = buildColumnDerivedContext(validated)
  const groupGeometries = buildGroupGeometries(validated)

  const topCandidatesByType = groupGeometries.reduce<ColumnTopCandidatesByType>(
    (acc, group) => {
      acc[group.key] = calculateColumnTopCandidatesForType(validated, group.type, {
        analysisHeightM: resolveAnalysisHeightM(group, validated),
      })
      return acc
    },
    {
      extreme: [],
      fachwerk: [],
      middle: [],
    },
  )

  const selectedProfileByType = resolveSelectedProfiles(validated, topCandidatesByType)
  const specificationGroups = groupGeometries.map((group) =>
    buildGroupSpecification(group, selectedProfileByType[group.key], topCandidatesByType[group.key]),
  )

  const activeGroupKey = resolveGroupKey(validated.columnType)

  return {
    snapshot: {
      sourceWorkbook: 'column_calculator_final_release.xlsx',
      sourceSheets: ['Summary', 'Calculation', 'Wind SP', 'Loads SP 20'],
      status: 'in-progress',
      note: `Column logic uses H_max selection for ${validated.city} with group-level manual override.`,
    },
    derivedContext,
    topCandidates: topCandidatesByType[activeGroupKey],
    topCandidatesByType,
    selectedProfileByType,
    isManualMode: validated.isManualMode,
    specification: {
      groups: specificationGroups,
      totalMassKg: specificationGroups.reduce((sum, group) => sum + group.totalMassKg, 0),
      totalCostRub: specificationGroups.reduce((sum, group) => sum + group.totalCostRub, 0),
      totalBracesCount: specificationGroups.reduce((sum, group) => sum + group.bracesTotalCount, 0),
    },
  }
}
