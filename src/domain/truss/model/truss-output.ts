import type { CalculationSnapshot } from '@/domain/common/model/candidate-result'

export type TrussGroupKey = 'vp' | 'np' | 'orb' | 'or' | 'rr'

export interface TrussLoadSummary {
  spanM: number
  frameStepM: number
  roofSlopeDeg: number
  spanLowerM: number
  spanUpperM: number
  responsibilityFactor: number
  snowLineLoadKnPerM: number
  windLineLoadKnPerM: number
  coveringLineLoadKnPerM: number
  extraLoadPercent: number
}

export interface TrussEffortSummary {
  vpN: number
  vpM: number
  vpQ: number
  npNPlus: number
  orbNPlus: number
  orbNMinus: number
  orNPlus: number
  orNMinus: number
  rrNPlus: number
  rrNMinus: number
}

export interface TrussGroupResult {
  key: TrussGroupKey
  label: string
  status: 'ok' | 'not-found'
  profile: string | null
  utilization: number | null
  massKg: number | null
  objectiveMassKg: number | null
  criterion: string | null
  criterionValue: number | null
  widthMm: number | null
  thicknessMm: number | null
  ordinal: number | null
  checks: ReadonlyArray<{ key: string; label: string; value: number }>
}

export interface TrussCalculationResult {
  snapshot: CalculationSnapshot
  loadSummary: TrussLoadSummary
  efforts: TrussEffortSummary
  groups: Record<TrussGroupKey, TrussGroupResult>
  totalMassKg: number | null
  specificMassKgPerM2: number | null
}
