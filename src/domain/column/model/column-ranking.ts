import type { CandidateResult } from '@/domain/common/model/candidate-result'
import {
  buildColumnDerivedContext,
  columnRankingConstants,
  type ColumnDerivedContext,
} from '@/domain/column/model/column-derived-context'
import { COLUMN_TYPE_FACHWERK, type ColumnInput, type ColumnType } from '@/domain/column/model/column-input'
import {
  columnBraceUnitMassKgPerM,
  columnCandidateCatalog,
} from '@/domain/column/model/column-reference.generated'

interface ColumnRankingOptions {
  analysisHeightM?: number
}

type ColumnCandidate = (typeof columnCandidateCatalog)[number]

const CONTROLLING_CRITERIA = [
  '\u043f\u043e sigm',
  '\u043f\u043e sigm \u0443\u0441\u0442 X',
  '\u043f\u043e sigm \u0443\u0441\u0442 Y',
  '\u043f\u043e \u0433\u0438\u0431\u043a X',
  '\u043f\u043e \u0433\u0438\u0431\u043a Y',
] as const

// Excel "Расчет!AU" uses 12 kg/m for brace mass in ranking objective.
const COLUMN_RANKING_BRACE_UNIT_MASS_KG_PER_M = 12
const COLUMN_RANKING_EPSILON_DENOMINATOR = 1_000_000

function safeSqrt(value: number): number {
  return Math.sqrt(Math.max(value, 0))
}

function resolveEffectiveSpacing(input: ColumnInput): number {
  return input.columnType === COLUMN_TYPE_FACHWERK ? input.facadeColumnStepM : input.frameStepM
}

function resolveColumnPriceRubPerKg(candidate: ColumnCandidate, input: ColumnInput): number {
  if (candidate.priceCategory === 'i_beam') {
    return input.iBeamS355PriceRubPerKg
  }

  return candidate.steelGrade === 'С245' ? input.tubeS245PriceRubPerKg : input.tubeS345PriceRubPerKg
}

function evaluateColumnCandidate(
  input: ColumnInput,
  derivedContext: ColumnDerivedContext,
  candidate: ColumnCandidate,
): CandidateResult | null {
  const { elasticModulusMpa, yieldCoefficient } = columnRankingConstants
  const axialLoadMn = derivedContext.axialLoadKn / 1000
  const bendingMomentMNm = derivedContext.bendingMomentKnM / 1000
  const areaM2 = candidate.areaCm2 / 10_000
  const sectionModulusXM3 = candidate.sectionModulusXCm3 / 1_000_000
  const radiusXM = candidate.radiusXcm / 100
  const radiusYM = candidate.radiusYcm / 100
  const stiffnessFactor = safeSqrt(candidate.strengthResistanceMpa / elasticModulusMpa)
  const lambdaX = (input.buildingHeightM * derivedContext.windHeightFactor) / radiusXM * stiffnessFactor
  const lambdaY = (input.buildingHeightM / (candidate.braceCount + 1)) / radiusYM * stiffnessFactor
  const deltaX = 9.87 * (1 - 0.04 + 0.09 * lambdaX) + lambdaX ** 2
  const phiX = 0.5 * (deltaX - safeSqrt(deltaX ** 2 - 39.48 * lambdaX ** 2)) / lambdaX ** 2
  const deltaY = 9.87 * (1 - 0.04 + 0.14 * lambdaY) + lambdaY ** 2
  const phiY = 0.5 * (deltaY - safeSqrt(deltaY ** 2 - 39.48 * lambdaY ** 2)) / lambdaY ** 2
  const sigma = axialLoadMn / areaM2 + bendingMomentMNm / sectionModulusXM3
  const utilizationSigma = sigma / (candidate.strengthResistanceMpa * yieldCoefficient)
  const sigmaStabilityX = Math.max(
    axialLoadMn / ((areaM2 * phiX) / 2),
    bendingMomentMNm / (0.7 * sectionModulusXM3),
  )
  const utilizationSigmaStabilityX = sigmaStabilityX / (candidate.strengthResistanceMpa * yieldCoefficient)
  const sectionModulusToAreaRatio = candidate.sectionModulusXCm3 / candidate.areaCm2
  const m = (derivedContext.bendingMomentKnM * 100 / derivedContext.axialLoadKn) / sectionModulusToAreaRatio
  const c = Math.min(1 / (1 + 0.7 * m), 1)
  const sigmaStabilityY = axialLoadMn / (areaM2 * phiY * c)
  const utilizationSigmaStabilityY = sigmaStabilityY / (candidate.strengthResistanceMpa * yieldCoefficient)
  const utilizationFlexibilityX =
    (derivedContext.windHeightFactor * input.buildingHeightM / radiusXM) /
    (180 -
      60 *
        Math.max(
          0.5,
          axialLoadMn / (phiX * areaM2 * candidate.strengthResistanceMpa * yieldCoefficient),
        ))
  const utilizationFlexibilityY =
    (input.buildingHeightM / (candidate.braceCount + 1) / radiusYM) /
    (180 -
      60 *
        Math.max(
          0.5,
          axialLoadMn / (phiY * areaM2 * candidate.strengthResistanceMpa * yieldCoefficient),
        ))

  const utilizations = [
    utilizationSigma,
    utilizationSigmaStabilityX,
    utilizationSigmaStabilityY,
    utilizationFlexibilityX,
    utilizationFlexibilityY,
  ] as const
  const maxUtilization = Math.max(...utilizations)

  if (candidate.excluded || maxUtilization > 1) {
    return null
  }

  const criterionIndex = utilizations.findIndex((value) => value === maxUtilization)
  const criterion = CONTROLLING_CRITERIA[Math.max(criterionIndex, 0)]
  const analysisHeightM = input.buildingHeightM
  const effectiveSpacingM = resolveEffectiveSpacing(input)

  // Workbook ranking key "Расчет!AU":
  // (unit_mass + epsilon) * height + brace_count * 12 * spacing * 1.15
  const rankingMassKg =
    candidate.unitMassKgPerM * analysisHeightM +
    candidate.braceCount * effectiveSpacingM * COLUMN_RANKING_BRACE_UNIT_MASS_KG_PER_M * 1.15
  const objectiveValue =
    rankingMassKg + (candidate.ordinal * analysisHeightM) / COLUMN_RANKING_EPSILON_DENOMINATOR

  // Workbook display mass "Сводка!I63":
  // unit_mass * height * 1.15 + brace_count * 9.6 * spacing * 1.15
  const braceMassKg = candidate.braceCount * effectiveSpacingM * columnBraceUnitMassKgPerM * 1.15
  const totalMassKg = candidate.unitMassKgPerM * analysisHeightM * 1.15 + braceMassKg

  // Workbook cost "Расчет!G11":
  // profile_price * (AU - brace_mass(9.6)) * 1.15 + brace_mass(9.6) * tube_S245_price
  const profilePriceRubPerKg = resolveColumnPriceRubPerKg(candidate, input)
  const profileMassForCostKg = (objectiveValue - braceMassKg) * 1.15
  const estimatedCostRub = profilePriceRubPerKg * profileMassForCostKg + braceMassKg * input.tubeS245PriceRubPerKg

  return {
    profile: candidate.profile,
    steelGrade: candidate.steelGrade,
    priceTonRub: profilePriceRubPerKg * 1000,
    criterion,
    braceCount: candidate.braceCount,
    utilization: maxUtilization,
    unitMassKg: candidate.unitMassKgPerM,
    totalMassKg,
    objectiveValue,
    estimatedCostRub,
    note: criterion,
  }
}

function rankColumnCandidates(candidates: CandidateResult[]): CandidateResult[] {
  return candidates
    .sort(
      (left, right) =>
        (left.objectiveValue ?? Number.POSITIVE_INFINITY) -
          (right.objectiveValue ?? Number.POSITIVE_INFINITY) ||
        left.unitMassKg - right.unitMassKg ||
        left.profile.localeCompare(right.profile),
    )
    .slice(0, 10)
}

export function calculateColumnTopCandidatesForType(
  input: ColumnInput,
  columnType: ColumnType,
  options: ColumnRankingOptions = {},
): CandidateResult[] {
  const inputForType: ColumnInput = {
    ...input,
    columnType,
    buildingHeightM: options.analysisHeightM ?? input.buildingHeightM,
  }
  const derivedContext = buildColumnDerivedContext(inputForType)

  const candidates = columnCandidateCatalog
    .map((candidate) => evaluateColumnCandidate(inputForType, derivedContext, candidate))
    .filter((candidate): candidate is CandidateResult => candidate !== null)

  return rankColumnCandidates(candidates)
}

export function calculateColumnTopCandidates(input: ColumnInput): CandidateResult[] {
  return calculateColumnTopCandidatesForType(input, input.columnType)
}
