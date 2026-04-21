import type { CalculationSnapshot, CandidateResult } from '@/domain/common/model/candidate-result'
import type { PurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'

export interface PurlinLoadSummary {
  frameStepM: number
  snowRegionKpa: number
  windRegionKpa: number
  coveringKpa: number
  snowBagFactor: number
  designSnowKpa: number
  windRoofKpa: number
  windFacadeKpa: number
  serviceKpa: number
  designTotalKpa: number
  autoMaxStepMm: number
  manualMinStepMm: number
  manualMaxStepMm: number
}

export interface PurlinCalculationResult {
  snapshot: CalculationSnapshot
  derivedContext: PurlinDerivedContext
  autoMaxStepMm: number
  loadSummary: PurlinLoadSummary
  sortSteelTop10: CandidateResult[]
  lstkMp350Top: CandidateResult[]
  lstkMp390Top: CandidateResult[]
}
