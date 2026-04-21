import type { UnifiedInputState } from './unified-input'
import { getStandardGableTrussEaveDepthM } from '@/domain/truss/model/standard-truss-eave-depth'

export interface HeightDerivations {
  eaveTrussDepthM: number
  eaveSupportHeightM: number
  roofRiseM: number
  maxBuildingHeightM: number
  windReferenceHeightM: number
  eaveTrussDepthSource: 'manual' | 'standard-table' | 'fallback'
}

interface HeightDerivationInput {
  roofType: UnifiedInputState['roofType']
  spanM: number
  roofSlopeDeg: number
  clearHeightToBottomChordM: number
  manualTrussEaveDepthM: number | null
}

const DEFAULT_FALLBACK_TRUSS_EAVE_DEPTH_M = 1.2

function toRadians(value: number): number {
  return (value / 180) * Math.PI
}

function isMonopitchRoof(roofType: string): boolean {
  return roofType.trim().toLowerCase().includes('односкат')
}

export function deriveHeights(input: HeightDerivationInput): HeightDerivations {
  const manualDepth = input.manualTrussEaveDepthM
  const standardDepth = isMonopitchRoof(input.roofType)
    ? null
    : getStandardGableTrussEaveDepthM(input.spanM)
  const eaveTrussDepthM =
    manualDepth ?? standardDepth ?? DEFAULT_FALLBACK_TRUSS_EAVE_DEPTH_M
  const eaveTrussDepthSource =
    manualDepth !== null
      ? 'manual'
      : standardDepth !== null
        ? 'standard-table'
        : 'fallback'
  const eaveSupportHeightM = input.clearHeightToBottomChordM + eaveTrussDepthM
  const slopePart = Math.tan(toRadians(input.roofSlopeDeg))
  const roofRiseM = isMonopitchRoof(input.roofType)
    ? slopePart * input.spanM
    : slopePart * (input.spanM / 2)
  const maxBuildingHeightM = eaveSupportHeightM + roofRiseM

  return {
    eaveTrussDepthM,
    eaveSupportHeightM,
    roofRiseM,
    maxBuildingHeightM,
    windReferenceHeightM: maxBuildingHeightM,
    eaveTrussDepthSource,
  }
}
