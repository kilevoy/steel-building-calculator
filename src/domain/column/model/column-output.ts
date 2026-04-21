import type { CalculationSnapshot, CandidateResult } from '@/domain/common/model/candidate-result'
import type { ColumnDerivedContext } from '@/domain/column/model/column-derived-context'
import type { ColumnType } from '@/domain/column/model/column-input'

export type ColumnGroupKey = 'extreme' | 'fachwerk' | 'middle'

export interface ColumnTopCandidatesByType {
  extreme: CandidateResult[]
  fachwerk: CandidateResult[]
  middle: CandidateResult[]
}

export interface ColumnSelectionByType {
  extreme: number
  fachwerk: number
  middle: number
}

export interface ColumnGroupSpecification {
  key: ColumnGroupKey
  label: string
  columnType: ColumnType
  selectedIndex: number
  braceLengthM: number
  criticalHeightM: number
  columnsCount: number
  geometryLengthsM: number[]
  selectedCandidate: CandidateResult | null
  bracesTotalCount: number
  columnsMassKg: number
  bracesMassKg: number
  totalMassKg: number
  totalCostRub: number
  rows: ColumnSpecificationRow[]
}

export interface ColumnSpecificationRow {
  xM: number
  lengthM: number
  profile: string
  steelGrade: string
  braceCount: number
  branchesCount: number
  unitMassKg: number
  withBracesMassKg: number
  totalMassKg: number
  totalCostRub: number
}

export interface ColumnSpecificationSummary {
  groups: ColumnGroupSpecification[]
  totalMassKg: number
  totalCostRub: number
  totalBracesCount: number
}

export interface ColumnCalculationResult {
  snapshot: CalculationSnapshot
  derivedContext: ColumnDerivedContext
  topCandidates: CandidateResult[]
  topCandidatesByType: ColumnTopCandidatesByType
  selectedProfileByType: ColumnSelectionByType
  isManualMode: boolean
  specification: ColumnSpecificationSummary
}
