import type { CandidateResult } from '@/domain/common/model/candidate-result'
import type { PurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import type { PurlinInput } from '@/domain/purlin/model/purlin-input'
import { calculatePurlinAutoMaxStepMm, calculatePurlinDesignLoad } from '@/domain/purlin/model/purlin-load-chain'

const NO_VALUE = 'нет'
const DUAL_SLOPE_ROOF = 'двускатная'
const STEP_SELECTION_INVALID_VALUE = 99_999
const PROFILE_OBJECTIVE_INVALID_VALUE = 9_999_999
const UTILIZATION_INVALID_VALUE = 999_999
const PLATEAU_SHIFT_THRESHOLD = 3
const Z_RUN_CONNECTOR_KG = 1.72
const BRACE_UNIT_MASS_KG_PER_M = 9.6
const TWO_TPS_ALLOWED_COVERINGS = new Set<string>([
  'наше 100 мм',
  'наше 150 мм',
  'наше 200 мм',
  'наше 250 мм',
  'наше 150 мм 1 слой гвл',
  'наше 150 мм 2 слоя гвл',
  'наше 200 мм 1 слой гвл',
  'наше 200 мм 2 слоя гвл',
  'наше 250 мм 1 слой гвл',
  'наше 250 мм 2 слоя гвл',
])

export interface LstkProfile {
  profile: string
  requiredPanelThicknessMm: number | null
  momentResistance: number
  unitMassKgPerM: number
}

export interface LstkFamilyConfig {
  family: string
  profiles: readonly LstkProfile[]
  objectiveKind: 'standard' | 'z'
  requiresPanelFilter: boolean
}

interface LstkPreparedContext {
  designLoad: number
  responsibilityFactor: number
  roofSideMultiplier: number
  panelThicknessFilterMm: number
  hasLayeredAssemblyCovering: boolean
  frameBayCount: number
  manualMinStepMm: number
}

interface LstkStepEvaluation {
  objectiveValue: number
  profile: LstkProfile
  utilization: number
}

function normalizeModeText(value: string): string {
  return value.trim().toLowerCase().replaceAll('ё', 'е')
}

function resolveLstkPriceRubPerKg(input: PurlinInput, family: string): number {
  if (family.startsWith('MP350')) {
    return input.lstkMp350PriceRubPerKg
  }

  if (family.startsWith('MP390')) {
    return input.lstkMp390PriceRubPerKg
  }

  return 0
}

function resolveLstkSteelGrade(family: string): string {
  if (family.startsWith('MP350')) {
    return 'MP350'
  }

  if (family.startsWith('MP390')) {
    return 'MP390'
  }

  return 'LSTK'
}

function resolveResponsibilityFactor(value: string): number {
  const numericValue = Number(value.replace(',', '.'))

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`Unsupported purlin responsibility level: ${value}`)
  }

  return numericValue
}

function resolveRoofSideMultiplier(roofType: string): number {
  return normalizeModeText(roofType) === normalizeModeText(DUAL_SLOPE_ROOF) ? 2 : 1
}

function resolveLineLabel(family: string): string {
  if (family.endsWith('/ 2TPS')) {
    return '2TPS'
  }

  if (family.endsWith('/ 2PS')) {
    return '2PS'
  }

  if (family.endsWith('/ Z')) {
    return 'Z'
  }

  return family
}

function resolveLineElementCount(lineLabel: string): number {
  return lineLabel === 'Z' ? 1 : 2
}

function resolveRunCount(input: PurlinInput, baseRunCount: number, objectiveKind: LstkFamilyConfig['objectiveKind']): number {
  const snowRetentionExtra = normalizeModeText(input.snowRetentionPurlin) === NO_VALUE
    ? 1
    : objectiveKind === 'z'
      ? 2
      : 1.5
  const barrierExtra = normalizeModeText(input.barrierPurlin) === NO_VALUE
    ? 0
    : objectiveKind === 'z'
      ? 1
      : 0.5

  return baseRunCount + snowRetentionExtra + barrierExtra
}

function resolveSnowbagLengthM(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  if (normalizeModeText(input.snowBagMode) === NO_VALUE) {
    return input.spanM
  }

  const alongBuildingMode = '\u0432\u0434\u043e\u043b\u044c \u0437\u0434\u0430\u043d\u0438\u044f'
  const acrossBuildingMode = '\u043f\u043e\u043f\u0435\u0440\u0435\u043a \u0437\u0434\u0430\u043d\u0438\u044f'
  const sourceLength =
    normalizeModeText(input.snowBagMode) === alongBuildingMode ? input.spanM : input.buildingLengthM

  const preliminaryFactor =
    1 + (0.4 * sourceLength + 0.4 * input.adjacentBuildingSizeM) / input.heightDifferenceM
  const snowLimitFactor = (2 * input.heightDifferenceM) / derivedContext.snowLoadKpa
  const baseLengthM =
    input.adjacentBuildingSizeM === 0
      ? 2 * input.heightDifferenceM
      : preliminaryFactor <= snowLimitFactor
        ? Math.min(2 * input.heightDifferenceM, 16)
        : Math.min(
            ((preliminaryFactor - 1 + 0.8) / (snowLimitFactor - 1 + 0.8)) * 2 * input.heightDifferenceM,
            5 * input.heightDifferenceM,
            16,
          )

  if (normalizeModeText(input.snowBagMode) === acrossBuildingMode) {
    return Math.ceil(baseLengthM / input.frameStepM) * input.frameStepM
  }

  return baseLengthM
}

function resolveBraceDesignSpanM(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  const alongBuildingMode = '\u0432\u0434\u043e\u043b\u044c \u0437\u0434\u0430\u043d\u0438\u044f'
  return normalizeModeText(input.snowBagMode) === alongBuildingMode
    ? resolveSnowbagLengthM(input, derivedContext)
    : input.spanM
}

function resolvePanelThicknessFilterMm(coveringType: string): number {
  const match = /^наше\s+(\d+)\s*мм/i.exec(coveringType.trim())
  return match ? Number(match[1]) : 0
}

function hasLayeredAssemblyCovering(coveringType: string): boolean {
  return TWO_TPS_ALLOWED_COVERINGS.has(normalizeModeText(coveringType))
}

function resolveAllowedMaxStepMm(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  if (input.manualMaxStepMm > 0) {
    return input.manualMaxStepMm
  }

  return calculatePurlinAutoMaxStepMm(input, derivedContext)
}

function resolveBaseRunCount(input: PurlinInput, stepMm: number): number {
  const roofSideMultiplier = resolveRoofSideMultiplier(input.roofType)
  const effectiveRoofRunM = (input.spanM - 0.3) / roofSideMultiplier
  return Math.ceil(effectiveRoofRunM / (stepMm / 1000))
}

function resolveFrameBayCount(input: PurlinInput): number {
  return input.buildingLengthM / input.frameStepM
}

function buildPreparedContext(input: PurlinInput, derivedContext: PurlinDerivedContext): LstkPreparedContext {
  return {
    designLoad: calculatePurlinDesignLoad(input, derivedContext),
    responsibilityFactor: resolveResponsibilityFactor(input.responsibilityLevel),
    roofSideMultiplier: resolveRoofSideMultiplier(input.roofType),
    panelThicknessFilterMm: resolvePanelThicknessFilterMm(input.coveringType),
    hasLayeredAssemblyCovering: hasLayeredAssemblyCovering(input.coveringType),
    frameBayCount: resolveFrameBayCount(input),
    manualMinStepMm: input.manualMinStepMm,
  }
}

function resolveStandardObjectiveValue(
  profile: LstkProfile,
  input: PurlinInput,
  preparedContext: LstkPreparedContext,
  baseRunCount: number,
): number {
  const runCount = resolveRunCount(input, baseRunCount, 'standard')

  return (
    runCount *
    profile.unitMassKgPerM *
    input.frameStepM *
    preparedContext.roofSideMultiplier *
    preparedContext.frameBayCount
  )
}

function resolveZObjectiveValue(
  profile: LstkProfile,
  input: PurlinInput,
  preparedContext: LstkPreparedContext,
  baseRunCount: number,
): number {
  const runCount = resolveRunCount(input, baseRunCount, 'z')
  const runMassKg = profile.unitMassKgPerM * input.frameStepM + Z_RUN_CONNECTOR_KG

  return runCount * runMassKg * preparedContext.roofSideMultiplier * preparedContext.frameBayCount
}

function evaluateProfileAtStep(
  profile: LstkProfile,
  input: PurlinInput,
  preparedContext: LstkPreparedContext,
  stepMm: number,
  config: LstkFamilyConfig,
): LstkStepEvaluation {
  const linearLoad = preparedContext.designLoad * (stepMm / 1000)
  const selfWeightLoad = (profile.unitMassKgPerM / 100) * preparedContext.responsibilityFactor
  const utilization =
    ((linearLoad + selfWeightLoad) * input.frameStepM ** 2) / 8 / profile.momentResistance

  if (utilization > 1) {
    return {
      objectiveValue: UTILIZATION_INVALID_VALUE,
      profile,
      utilization,
    }
  }

  if (
    config.requiresPanelFilter &&
    (
      !preparedContext.hasLayeredAssemblyCovering ||
      preparedContext.panelThicknessFilterMm !== profile.requiredPanelThicknessMm
    )
  ) {
    return {
      objectiveValue: PROFILE_OBJECTIVE_INVALID_VALUE,
      profile,
      utilization,
    }
  }

  const baseRunCount = resolveBaseRunCount(input, stepMm)
  const objectiveValue =
    config.objectiveKind === 'z'
      ? resolveZObjectiveValue(profile, input, preparedContext, baseRunCount)
      : resolveStandardObjectiveValue(profile, input, preparedContext, baseRunCount)

  return {
    objectiveValue,
    profile,
    utilization,
  }
}

function selectStepIndexByExcelPlateau(stepEvaluations: readonly LstkStepEvaluation[]): number {
  const objectiveValues = stepEvaluations.map((item) => item.objectiveValue)
  const bestObjectiveValue = Math.min(...objectiveValues)
  const firstBestIndex = objectiveValues.findIndex((item) => item === bestObjectiveValue)

  if (firstBestIndex === -1) {
    throw new Error('Failed to locate the first LSTK objective minimum')
  }

  let plateauLength = 1
  for (let index = firstBestIndex + 1; index < objectiveValues.length; index += 1) {
    if (objectiveValues[index] !== bestObjectiveValue) {
      break
    }

    plateauLength += 1
  }

  if (plateauLength < PLATEAU_SHIFT_THRESHOLD) {
    return firstBestIndex
  }

  return firstBestIndex + plateauLength - 1
}

function calculateFamilyCandidate(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
  preparedContext: LstkPreparedContext,
  stepAxis: readonly number[],
  config: LstkFamilyConfig,
): CandidateResult | null {
  const allowedMaxStepMm = resolveAllowedMaxStepMm(input, derivedContext)

  const stepEvaluations = stepAxis.map((stepMm) => {
    if (stepMm > allowedMaxStepMm || (preparedContext.manualMinStepMm > 0 && stepMm < preparedContext.manualMinStepMm)) {
      return {
        objectiveValue: PROFILE_OBJECTIVE_INVALID_VALUE,
        profile: config.profiles[0],
        utilization: 0,
      }
    }

    const profileEvaluations = config.profiles.map((profile) =>
      evaluateProfileAtStep(profile, input, preparedContext, stepMm, config),
    )

    const bestObjectiveValue = Math.min(...profileEvaluations.map((item) => item.objectiveValue))
    return profileEvaluations.find((item) => item.objectiveValue === bestObjectiveValue) ?? profileEvaluations[0]
  })

  const chosenStepIndex = selectStepIndexByExcelPlateau(stepEvaluations)
  const chosenEvaluation = stepEvaluations[chosenStepIndex]

  if (chosenEvaluation.objectiveValue > STEP_SELECTION_INVALID_VALUE) {
    return null
  }

  const stepMm = stepAxis[chosenStepIndex]
  const baseRunCount = resolveBaseRunCount(input, stepMm)
  const runCount = resolveRunCount(input, baseRunCount, config.objectiveKind)
  const lineLabel = resolveLineLabel(config.family)
  const lineElementCount = resolveLineElementCount(lineLabel)
  const totalRunLengthM = runCount * input.frameStepM * preparedContext.roofSideMultiplier * preparedContext.frameBayCount
  const unitMassPerMeterKg = chosenEvaluation.profile.unitMassKgPerM
  const massPerMeterKg = chosenEvaluation.profile.unitMassKgPerM / lineElementCount
  const blackMassKg = config.objectiveKind === 'z'
    ? runCount * preparedContext.roofSideMultiplier * preparedContext.frameBayCount * Z_RUN_CONNECTOR_KG
    : null
  const galvanizedMassKg = blackMassKg === null ? null : chosenEvaluation.objectiveValue - blackMassKg
  const developedLengthM = blackMassKg === null ? totalRunLengthM * lineElementCount : totalRunLengthM
  const braceMassKg =
    BRACE_UNIT_MASS_KG_PER_M * Math.ceil(resolveBraceDesignSpanM(input, derivedContext) / input.braceSpacingM) * input.buildingLengthM
  const lstkPriceRubPerKg = resolveLstkPriceRubPerKg(input, config.family)
  const estimatedCostRub = Math.round(chosenEvaluation.objectiveValue * lstkPriceRubPerKg)

  return {
    family: config.family,
    profile: chosenEvaluation.profile.profile,
    steelGrade: resolveLstkSteelGrade(config.family),
    stepMm,
    utilization: chosenEvaluation.utilization,
    unitMassKg: chosenEvaluation.profile.unitMassKgPerM,
    totalMassKg: chosenEvaluation.objectiveValue,
    estimatedCostRub,
    objectiveValue: chosenEvaluation.objectiveValue,
    excelMetrics: {
      lineLabel,
      unitMassPerMeterKg,
      massPerMeterKg,
      massPerStepKg: chosenEvaluation.objectiveValue / preparedContext.frameBayCount,
      developedLengthM,
      massWithBracesKg: chosenEvaluation.objectiveValue + braceMassKg,
      blackMassKg,
      galvanizedMassKg,
    },
    note: 'Transferred from the LSTK workbook branch',
  }
}

export function calculateLstkFamilyCandidates(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
  stepAxis: readonly number[],
  familyConfigs: readonly LstkFamilyConfig[],
): CandidateResult[] {
  const preparedContext = buildPreparedContext(input, derivedContext)

  return familyConfigs
    .map((config) => calculateFamilyCandidate(input, derivedContext, preparedContext, stepAxis, config))
    .filter((candidate): candidate is CandidateResult => candidate !== null)
}

