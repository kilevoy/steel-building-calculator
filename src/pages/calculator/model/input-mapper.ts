import type { ColumnInput } from '@/domain/column/model/column-input'
import type { PurlinInput } from '@/domain/purlin/model/purlin-input'
import type { PurlinCalculationResult } from '@/domain/purlin/model/purlin-output'
import type { TrussInput } from '@/domain/truss/model/truss-input'
import { defaultUnifiedInput, type UnifiedInputState } from './unified-input'
import { deriveHeights } from './height-derivations'
import { DEFAULT_NORMATIVE_MODE } from './unified-input-options'

export function mapToPurlinInput(state: UnifiedInputState): PurlinInput {
  const heights = deriveHeights(state)

  return {
    city: state.city,
    normativeMode: DEFAULT_NORMATIVE_MODE,
    responsibilityLevel: state.responsibilityLevel,
    roofType: state.roofType,
    spanM: state.spanM,
    buildingLengthM: state.buildingLengthM,
    buildingHeightM: heights.windReferenceHeightM,
    roofSlopeDeg: state.roofSlopeDeg,
    frameStepM: state.frameStepM,
    fakhverkSpacingM: state.fakhverkStepM,
    terrainType: state.terrainType,
    coveringType: state.roofCoveringType,
    profileSheet: state.profileSheet,
    snowBagMode: state.snowBagMode,
    heightDifferenceM: state.heightDifferenceM,
    adjacentBuildingSizeM: state.adjacentBuildingSizeM,
    manualMaxStepMm: state.manualMaxStepMm,
    manualMinStepMm: state.manualMinStepMm,
    maxUtilizationRatio: state.maxUtilizationRatio,
    tiesSetting: defaultUnifiedInput.tiesSetting,
    braceSpacingM: state.braceSpacingM,
    snowRetentionPurlin: state.snowRetentionPurlin,
    barrierPurlin: state.barrierPurlin,
    iBeamS255PriceRubPerKg: state.iBeamS255PriceRubPerKg,
    iBeamS355PriceRubPerKg: state.iBeamS355PriceRubPerKg,
    tubeS245PriceRubPerKg: state.tubeS245PriceRubPerKg,
    tubeS345PriceRubPerKg: state.tubeS345PriceRubPerKg,
    channelS245PriceRubPerKg: state.channelS245PriceRubPerKg,
    channelS345PriceRubPerKg: state.channelS345PriceRubPerKg,
    lstkMp350PriceRubPerKg: state.lstkMp350PriceRubPerKg,
    lstkMp390PriceRubPerKg: state.lstkMp390PriceRubPerKg,
  }
}

export function mapToColumnInput(state: UnifiedInputState): ColumnInput {
  const heights = deriveHeights(state)

  return {
    city: state.city,
    responsibilityLevel: state.responsibilityLevel,
    roofType: state.roofType,
    spanM: state.spanM,
    buildingLengthM: state.buildingLengthM,
    buildingHeightM: heights.eaveSupportHeightM,
    roofSlopeDeg: state.roofSlopeDeg,
    frameStepM: state.frameStepM,
    facadeColumnStepM: state.fakhverkStepM,
    spansCount: state.spansCount,
    perimeterBracing: state.perimeterBracing,
    terrainType: state.terrainType,
    roofCoveringType: state.roofCoveringType,
    wallCoveringType: state.wallCoveringType,
    columnType: state.columnType,
    columnSelectionMode: state.columnSelectionMode,
    extraLoadPercent: state.extraLoadPercent,
    supportCraneMode: state.supportCraneMode,
    supportCraneSingleSpanMode: state.supportCraneSingleSpanMode,
    supportCraneCapacity: state.supportCraneCapacity,
    supportCraneCount: state.supportCraneCount,
    supportCraneRailLevelM: state.supportCraneRailLevelM,
    hangingCraneMode: state.hangingCraneMode,
    hangingCraneSingleSpanMode: state.hangingCraneSingleSpanMode,
    hangingCraneCapacityT: state.hangingCraneCapacityT,
    iBeamS255PriceRubPerKg: state.iBeamS255PriceRubPerKg,
    iBeamS355PriceRubPerKg: state.iBeamS355PriceRubPerKg,
    tubeS245PriceRubPerKg: state.tubeS245PriceRubPerKg,
    tubeS345PriceRubPerKg: state.tubeS345PriceRubPerKg,
    selectedProfileExtreme: state.selectedProfileExtreme,
    selectedProfileFachwerk: state.selectedProfileFachwerk,
    selectedProfileMiddle: state.selectedProfileMiddle,
    isManualMode: state.isManualMode,
  }
}

export function mapToTrussInput(
  state: UnifiedInputState,
  purlinResult: PurlinCalculationResult,
): TrussInput {
  return {
    // TODO: extend truss input with clear height / support-node geometry in a follow-up refactor.
    spanM: state.spanM,
    frameStepM: state.frameStepM,
    roofSlopeDeg: state.roofSlopeDeg,
    responsibilityLevel: state.responsibilityLevel,
    designSnowKpa: purlinResult.loadSummary.designSnowKpa,
    windRoofKpa: purlinResult.loadSummary.windRoofKpa,
    coveringKpa: purlinResult.loadSummary.coveringKpa,
    purlinBracingStepMm: 0,
    limits: {
      minThicknessMm: {
        vp: state.trussMinThicknessVpMm,
        np: state.trussMinThicknessNpMm,
        orb: state.trussMinThicknessOrbMm,
        or: state.trussMinThicknessOrMm,
        rr: state.trussMinThicknessRrMm,
      },
      maxWidthMm: {
        vp: state.trussMaxWidthVpMm,
        np: state.trussMaxWidthNpMm,
      },
      minWidthMm: {
        orb: state.trussMinWidthOrbMm,
        or: state.trussMinWidthOrMm,
        rr: state.trussMinWidthRrMm,
      },
    },
  }
}
