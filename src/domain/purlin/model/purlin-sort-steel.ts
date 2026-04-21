import type { CandidateResult } from '@/domain/common/model/candidate-result'
import type { PurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import type { PurlinInput } from '@/domain/purlin/model/purlin-input'
import {
  calculatePurlinAutoMaxStepMm,
  calculatePurlinDesignLoad,
  calculatePurlinFacadeWindPressure,
  calculatePurlinServiceLoad,
} from '@/domain/purlin/model/purlin-load-chain'
import {
  purlinSortSteelProfiles,
  purlinSortSteelStabilityGrid,
  purlinSortSteelStabilityLambdaAxis,
  purlinSortSteelStabilityMefAxis,
  purlinSortSteelStepAxis,
} from '@/domain/purlin/model/purlin-reference.generated'

const ELASTIC_MODULUS_MPA = 2.06 * 10 ** 5
const DEFLECTION_ELASTIC_MODULUS_KN_PER_M2 = 2.06 * 10 ** 8
const INVALID_OBJECTIVE = 999_999_999_999
const NO_VALUE = 'нет'
const SNOW_BAG_ALONG_BUILDING = 'вдоль здания'
const SNOW_BAG_ACROSS_BUILDING = 'поперек здания'
const DUAL_SLOPE_ROOF = 'двускатная'

type SortSteelCandidate = (typeof purlinSortSteelProfiles)[number]

interface SortSteelPreparedContext {
  designLoadKpa: number
  serviceLoadKpa: number
  windForceKn: number
  effectiveOutOfPlaneLengthM: number
  allowedMaxStepMm: number
  manualMinStepMm: number
  maxUtilizationRatio: number
  buildingMassLengthM: number
}

interface SortSteelStepEvaluation {
  stepMm: number
  objectiveValue: number
  utilization: number
  criterion: string
  buildingMassKg: number
  estimatedCostRub: number
  priceTonRub: number
}

interface SortSteelRankedCandidate {
  stepIndex: number
  result: CandidateResult
}

function excelCeilingToHalf(value: number): number {
  return Math.ceil(value / 0.5) * 0.5
}

function findExactIndex(values: readonly number[], target: number): number {
  return values.findIndex((value) => Math.abs(value - target) < 1e-9)
}

function normalizeModeText(value: string): string {
  return value.trim().toLowerCase().replaceAll('ё', 'е')
}

function resolvePriceRubPerKg(candidate: SortSteelCandidate, input: PurlinInput): number {
  if (candidate.priceCategory === 'i_beam') {
    return candidate.steelGrade === 'С255Б' ? input.iBeamS255PriceRubPerKg : input.iBeamS355PriceRubPerKg
  }

  if (candidate.priceCategory === 'tube') {
    return candidate.steelGrade === 'С245' ? input.tubeS245PriceRubPerKg : input.tubeS345PriceRubPerKg
  }

  return candidate.steelGrade === 'С245' ? input.channelS245PriceRubPerKg : input.channelS345PriceRubPerKg
}

function resolveRoofSideMultiplier(roofType: string): number {
  return normalizeModeText(roofType) === DUAL_SLOPE_ROOF ? 2 : 1
}

function resolveTieRowsCount(value: string): number {
  const normalized = normalizeModeText(value)

  if (normalized === NO_VALUE) {
    return 0
  }

  const parsed = Number(normalized.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function resolveRoofRunLengthM(input: PurlinInput): number {
  const roofSideMultiplier = resolveRoofSideMultiplier(input.roofType)

  return ((input.spanM - 0.3) / roofSideMultiplier) / Math.cos((input.roofSlopeDeg / 180) * Math.PI)
}

function resolvePurlinTotalLengthPerStepM(input: PurlinInput, stepMm: number): number {
  const roofSideMultiplier = resolveRoofSideMultiplier(input.roofType)
  const runsPerRoofSide = Math.ceil(resolveRoofRunLengthM(input) / (stepMm / 1000)) + 1

  return input.frameStepM * runsPerRoofSide * roofSideMultiplier
}

function resolveSnowbagLengthM(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  const snowBagMode = normalizeModeText(input.snowBagMode)

  if (snowBagMode === NO_VALUE) {
    return input.spanM
  }

  const preliminaryFactor =
    1 +
    (0.4 * (snowBagMode === SNOW_BAG_ALONG_BUILDING ? input.spanM : input.buildingLengthM) +
      0.4 * input.adjacentBuildingSizeM) /
      input.heightDifferenceM

  const snowLimitFactor = (2 * input.heightDifferenceM) / derivedContext.snowLoadKpa
  const baseLengthM =
    input.adjacentBuildingSizeM === 0
      ? 2 * input.heightDifferenceM
      : preliminaryFactor <= snowLimitFactor
        ? Math.min(2 * input.heightDifferenceM, 16)
        : Math.min(
            ((preliminaryFactor - 1 + 2 * 0.4) / (snowLimitFactor - 1 + 2 * 0.4)) * 2 * input.heightDifferenceM,
            5 * input.heightDifferenceM,
            16,
          )

  if (snowBagMode === SNOW_BAG_ACROSS_BUILDING) {
    return Math.ceil(baseLengthM / input.frameStepM) * input.frameStepM
  }

  return baseLengthM
}

function resolveBuildingMassLengthM(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  return normalizeModeText(input.snowBagMode) === SNOW_BAG_ACROSS_BUILDING
    ? resolveSnowbagLengthM(input, derivedContext)
    : input.buildingLengthM
}

function resolveEffectiveOutOfPlaneLengthM(input: PurlinInput): number {
  if (input.coveringType.toLowerCase() === '\u043f\u0440\u043e\u0444\u043b\u0438\u0441\u0442') {
    return 0.4
  }

  const tieRowsCount = resolveTieRowsCount(input.tiesSetting)
  return tieRowsCount === 0 ? input.frameStepM : input.frameStepM / (tieRowsCount + 1)
}

function lookupStabilityCoefficient(lambdaBar: number, mef: number): number {
  const lambdaIndex = findExactIndex(purlinSortSteelStabilityLambdaAxis, lambdaBar)
  const mefIndex = findExactIndex(purlinSortSteelStabilityMefAxis, mef)

  if (lambdaIndex === -1 || mefIndex === -1) {
    return 0.001
  }

  return purlinSortSteelStabilityGrid[lambdaIndex][mefIndex] ?? 0.001
}

function buildPreparedContext(input: PurlinInput, derivedContext: PurlinDerivedContext): SortSteelPreparedContext {
  const designFacadeWindKpa = calculatePurlinFacadeWindPressure(input, derivedContext)

  return {
    designLoadKpa: calculatePurlinDesignLoad(input, derivedContext),
    serviceLoadKpa: calculatePurlinServiceLoad(input, derivedContext),
    windForceKn: (designFacadeWindKpa * input.buildingHeightM * input.fakhverkSpacingM) / 2,
    effectiveOutOfPlaneLengthM: resolveEffectiveOutOfPlaneLengthM(input),
    allowedMaxStepMm: input.manualMaxStepMm > 0 ? input.manualMaxStepMm : calculatePurlinAutoMaxStepMm(input, derivedContext),
    manualMinStepMm: input.manualMinStepMm,
    maxUtilizationRatio: input.maxUtilizationRatio,
    buildingMassLengthM: resolveBuildingMassLengthM(input, derivedContext),
  }
}

function buildCriterionMap(
  strengthUtilization: number,
  stabilityUtilization: number,
  flexibilityUtilization: number,
  deflectionUtilization: number,
) {
  return [
    { criterion: 'по прочности', utilization: strengthUtilization },
    { criterion: 'по устойчивости', utilization: stabilityUtilization },
    { criterion: 'по гибкости', utilization: flexibilityUtilization },
    { criterion: 'по прогибам', utilization: deflectionUtilization },
  ] as const
}

function evaluateCandidateAtStep(
  candidate: SortSteelCandidate,
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
  preparedContext: SortSteelPreparedContext,
  stepMm: number,
): SortSteelStepEvaluation {
  const slopeTan = Math.tan((input.roofSlopeDeg / 180) * Math.PI)
  const kzStrengthFactor = derivedContext.hasSpRkEnCityFlag ? 1 / 1.05 : 1
  const kzStabilityFactor = derivedContext.hasSpRkEnCityFlag ? 1.25 : 1
  const verticalLineLoadKnPerM = preparedContext.designLoadKpa * (stepMm / 1000)
  const serviceLineLoadKnPerM = preparedContext.serviceLoadKpa * (stepMm / 1000)
  const selfWeightKnPerM = candidate.unitMassKgPerM / 100
  const verticalMomentKnM = (verticalLineLoadKnPerM * input.frameStepM ** 2) / 8
  const selfWeightMomentKnM = (selfWeightKnPerM * input.frameStepM ** 2) / 8
  const flexibilityUtilization =
    Math.max(
      (input.frameStepM * 100) / candidate.radiusXcm,
      (preparedContext.effectiveOutOfPlaneLengthM * 100) / candidate.radiusYcm,
    ) / 200
  const conditionalFlexibility = excelCeilingToHalf(
    (Math.min(input.frameStepM, preparedContext.effectiveOutOfPlaneLengthM) / candidate.radiusYcm) *
      Math.sqrt(candidate.strengthResistanceMpa / ELASTIC_MODULUS_MPA) *
      100,
  )
  const strengthUtilization =
    ((preparedContext.windForceKn / (candidate.areaCm2 / 10_000) +
      (verticalMomentKnM + selfWeightMomentKnM) / (candidate.sectionModulusXCm3 / 1_000_000) +
      (verticalMomentKnM * slopeTan) / (candidate.sectionModulusYCm3 / 1_000_000)) /
      1000) /
    (candidate.strengthResistanceMpa * kzStrengthFactor)
  const mefStrength = excelCeilingToHalf(
    ((verticalMomentKnM / preparedContext.windForceKn) *
      candidate.areaCm2 /
      candidate.sectionModulusXCm3 *
      100 *
      candidate.eta),
  )
  const mefStability = excelCeilingToHalf(
    (((verticalMomentKnM + selfWeightMomentKnM) / preparedContext.windForceKn) *
      candidate.areaCm2 /
      candidate.sectionModulusXCm3 *
      100 *
      candidate.eta),
  )
  const phiE = lookupStabilityCoefficient(conditionalFlexibility, mefStrength)
  const stabilityUtilization =
    (mefStability > 20
      ? (verticalMomentKnM + selfWeightMomentKnM) /
        (candidate.psi * (candidate.sectionModulusXCm3 / 1_000_000) * candidate.strengthResistanceMpa * 1000)
      : preparedContext.windForceKn /
        (phiE * (candidate.areaCm2 / 10_000) * candidate.strengthResistanceMpa * 1000)) *
    kzStabilityFactor
  const deflectionUtilization =
    ((5 / 384) *
      (serviceLineLoadKnPerM + selfWeightKnPerM) *
      input.frameStepM ** 4 /
      (DEFLECTION_ELASTIC_MODULUS_KN_PER_M2 * (candidate.momentOfInertiaXCm4 / 100_000_000))) /
    (input.frameStepM / 200)
  const criterionMap = buildCriterionMap(
    strengthUtilization,
    stabilityUtilization,
    flexibilityUtilization,
    deflectionUtilization,
  )
  const controllingResult = criterionMap.reduce((best, current) =>
    current.utilization > best.utilization ? current : best,
  )
  const strengthStabilityUtilization = Math.max(strengthUtilization, stabilityUtilization)

  if (
    candidate.excluded ||
    candidate.priceCategory === 'i_beam' ||
    stepMm > preparedContext.allowedMaxStepMm ||
    (preparedContext.manualMinStepMm > 0 && stepMm < preparedContext.manualMinStepMm) ||
    strengthStabilityUtilization > preparedContext.maxUtilizationRatio ||
    flexibilityUtilization > 1 ||
    deflectionUtilization > 1
  ) {
    return {
      stepMm,
      objectiveValue: INVALID_OBJECTIVE,
      utilization: controllingResult.utilization,
      criterion: controllingResult.criterion,
      buildingMassKg: 0,
      estimatedCostRub: 0,
      priceTonRub: 0,
    }
  }

  const profilePriceRubPerKg = resolvePriceRubPerKg(candidate, input)
  const massPerStepKg = resolvePurlinTotalLengthPerStepM(input, stepMm) * candidate.unitMassKgPerM
  const buildingMassKg =
    massPerStepKg * 1.03 * (preparedContext.buildingMassLengthM / input.frameStepM)
  const roundedCostThousandsRub = Math.round(
    (massPerStepKg * profilePriceRubPerKg) / 1000,
  )
  const estimatedCostRub = Math.round(buildingMassKg * profilePriceRubPerKg)

  return {
    stepMm,
    objectiveValue: roundedCostThousandsRub + 0.001 * candidate.ordinal - 0.000001 * stepMm,
    utilization: controllingResult.utilization,
    criterion: controllingResult.criterion,
    buildingMassKg,
    estimatedCostRub,
    priceTonRub: profilePriceRubPerKg * 1000,
  }
}

function buildCandidateResult(
  candidate: SortSteelCandidate,
  evaluation: SortSteelStepEvaluation,
): CandidateResult {
  return {
    family: 'Sort steel',
    profile: candidate.profile,
    steelGrade: candidate.steelGrade,
    criterion: evaluation.criterion,
    stepMm: evaluation.stepMm,
    utilization: evaluation.utilization,
    unitMassKg: candidate.unitMassKgPerM,
    totalMassKg: evaluation.buildingMassKg,
    priceTonRub: evaluation.priceTonRub,
    estimatedCostRub: evaluation.estimatedCostRub,
    objectiveValue: evaluation.objectiveValue,
    excelMetrics: {
      displayCostThousandsRub: Math.round(evaluation.objectiveValue * 10) / 10,
    },
    note: 'Transferred from the sort steel workbook branch',
  }
}

function compareCandidateResults(left: SortSteelRankedCandidate, right: SortSteelRankedCandidate): number {
  const leftObjective = left.result.objectiveValue ?? Number.POSITIVE_INFINITY
  const rightObjective = right.result.objectiveValue ?? Number.POSITIVE_INFINITY

  if (leftObjective !== rightObjective) {
    return leftObjective - rightObjective
  }

  return left.stepIndex - right.stepIndex
}

function rankCandidatesForStep(
  stepMm: number,
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
  preparedContext: SortSteelPreparedContext,
): CandidateResult[] {
  return purlinSortSteelProfiles
    .map((candidate: SortSteelCandidate) => ({
      candidate,
      evaluation: evaluateCandidateAtStep(candidate, input, derivedContext, preparedContext, stepMm),
    }))
    .sort((left, right) => {
      if (left.evaluation.objectiveValue !== right.evaluation.objectiveValue) {
        return left.evaluation.objectiveValue - right.evaluation.objectiveValue
      }

      return left.candidate.ordinal - right.candidate.ordinal
    })
    .map(({ candidate, evaluation }) => buildCandidateResult(candidate, evaluation))
}

export function calculateSortSteelTopCandidates(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
): CandidateResult[] {
  const preparedContext = buildPreparedContext(input, derivedContext)
  const rankedCandidatesByStep = purlinSortSteelStepAxis.map((stepMm: number) =>
    rankCandidatesForStep(stepMm, input, derivedContext, preparedContext),
  )

  return Array.from({ length: 10 }, (_, rankIndex) =>
    rankedCandidatesByStep
      .map(
        (candidates, stepIndex): SortSteelRankedCandidate => ({
          stepIndex,
          result: candidates[rankIndex],
        }),
      )
      .sort(compareCandidateResults)[0],
  )
    .map((rankedCandidate) => rankedCandidate?.result)
    .filter(
      (candidate: CandidateResult | undefined): candidate is CandidateResult =>
        candidate !== undefined && (candidate.objectiveValue ?? Number.POSITIVE_INFINITY) < INVALID_OBJECTIVE,
    )
}

