import type { CalculationSnapshot } from '@/domain/common/model/candidate-result'
import { trussInputSchema, type TrussInput } from '@/domain/truss/model/truss-input'
import type {
  TrussCalculationResult,
  TrussEffortSummary,
  TrussGroupKey,
  TrussGroupResult,
  TrussLoadSummary,
} from '@/domain/truss/model/truss-output'
import {
  trussEffortCoefficients,
  trussList6Table,
  trussLimitsAndConstants,
  trussMemberKeys,
  trussProfileCatalog,
  trussSnapshotMeta,
} from '@/domain/truss/model/truss-reference.generated'

const ELASTICITY_MODULUS_MPA = 2.06 * 10 ** 5
const ALPHA = 0.03
const BETA = 0.06
const MASS_FACTOR = 1.15
const EXCEL_EPS = 1e-9

const GROUP_LABELS: Record<TrussGroupKey, string> = {
  vp: 'ВП',
  np: 'НП',
  orb: 'ОРб',
  or: 'ОР',
  rr: 'РР',
}

const VP_CHECKS = [
  { key: 'stability7', label: 'К-т исп по устойчивости (7)' },
  { key: 'strength106', label: 'К-т исп по прочности (106)' },
  { key: 'equivalent44', label: 'К-т исп по эквивалентным напряжениям (44)' },
  { key: 'stability109', label: 'К-т исп по устойчивости (109)' },
  { key: 'stability120', label: 'К-т исп по устойчивости (120)' },
] as const

const AXIAL_CHECKS = [
  { key: 'strength5', label: 'К-т исп по прочности (5)' },
  { key: 'stability7', label: 'К-т исп по устойчивости (7)' },
] as const

type MemberKey = (typeof trussMemberKeys)[number]
type TrussProfile = (typeof trussProfileCatalog)[number]

interface SpanBand {
  lowerM: number
  upperM: number
}

interface VpResult {
  result: TrussGroupResult
  selectedWidthMm: number | null
}

interface NpResult {
  result: TrussGroupResult
  selectedWidthMm: number | null
}

interface CandidateEvaluation {
  profile: TrussProfile
  utilization: number
  massObjective: number
  checks: ReadonlyArray<{ key: string; label: string; value: number }>
  criterion: string
  criterionValue: number
}

function toRadians(value: number): number {
  return (value / 180) * Math.PI
}

function parseResponsibilityLevel(value: string): number {
  const normalized = Number(value.trim().replace(',', '.'))
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`Unsupported responsibility level: ${value}`)
  }
  return normalized
}

function excelLte(left: number, right: number): boolean {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return false
  }
  return left <= right + EXCEL_EPS
}

function excelGte(left: number, right: number): boolean {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return false
  }
  return left + EXCEL_EPS >= right
}

function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return Number.POSITIVE_INFINITY
  }

  if (Math.abs(denominator) <= EXCEL_EPS) {
    return numerator >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
  }

  return numerator / denominator
}

function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step
}

function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step
}

function resolveSpanBand(spanM: number): SpanBand {
  return {
    lowerM: Math.max(18, floorToStep(spanM, 6)),
    upperM: Math.max(18, ceilToStep(spanM, 6)),
  }
}

function resolveCoefficient(component: keyof typeof trussEffortCoefficients, spanM: number, member: MemberKey): number {
  const band = resolveSpanBand(spanM)
  const componentData = trussEffortCoefficients[component]
  const lower = componentData[String(band.lowerM) as keyof typeof componentData]
  const upper = componentData[String(band.upperM) as keyof typeof componentData]

  if (!lower || !upper) {
    throw new Error(`No truss effort coefficients for span ${spanM} in component ${component}`)
  }

  const interpolationFactor = safeDivide(spanM - band.lowerM, 6)
  const left = lower[member]
  const right = upper[member]

  return left + (right - left) * interpolationFactor
}

function calculateEfforts(input: TrussInput): { loadSummary: TrussLoadSummary; efforts: TrussEffortSummary } {
  const responsibilityFactor = parseResponsibilityLevel(input.responsibilityLevel)
  const band = resolveSpanBand(input.spanM)

  const snowLineLoadKnPerM = input.designSnowKpa * input.frameStepM
  const windLineLoadKnPerM = input.windRoofKpa * input.frameStepM
  const coveringLineLoadKnPerM = input.coveringKpa * responsibilityFactor * input.frameStepM
  const extraLoadMultiplier = 1 + trussLimitsAndConstants.extraLoadPercent / 100

  const efforts = trussMemberKeys.reduce<Record<MemberKey, number>>((acc, memberKey) => {
    const snowCoefficient = resolveCoefficient('snow', input.spanM, memberKey)
    const coveringCoefficient = resolveCoefficient('covering', input.spanM, memberKey)
    const windACoefficient = resolveCoefficient('windA', input.spanM, memberKey)
    const windBCoefficient = resolveCoefficient('windB', input.spanM, memberKey)

    const baseValue =
      snowCoefficient * snowLineLoadKnPerM +
      coveringCoefficient * coveringLineLoadKnPerM +
      windACoefficient * windLineLoadKnPerM +
      windBCoefficient * windLineLoadKnPerM

    acc[memberKey] = baseValue * extraLoadMultiplier
    return acc
  }, {} as Record<MemberKey, number>)

  return {
    loadSummary: {
      spanM: input.spanM,
      frameStepM: input.frameStepM,
      roofSlopeDeg: input.roofSlopeDeg,
      spanLowerM: band.lowerM,
      spanUpperM: band.upperM,
      responsibilityFactor,
      snowLineLoadKnPerM,
      windLineLoadKnPerM,
      coveringLineLoadKnPerM,
      extraLoadPercent: trussLimitsAndConstants.extraLoadPercent,
    },
    efforts: {
      vpN: efforts.vpN,
      vpM: efforts.vpM,
      vpQ: efforts.vpQ,
      npNPlus: efforts.npNPlus,
      orbNPlus: efforts.orbNPlus,
      orbNMinus: efforts.orbNMinus,
      orNPlus: efforts.orNPlus,
      orNMinus: efforts.orNMinus,
      rrNPlus: efforts.rrNPlus,
      rrNMinus: efforts.rrNMinus,
    },
  }
}

function resolveStrengthResistanceMpa(thicknessMm: number): number {
  return (thicknessMm <= 10 ? 345 : 325) / 1.025
}

function resolveVpSlendernessMax(profile: TrussProfile, vpLeffY: number): number {
  const lambdaX = safeDivide(3, profile.ixRadiusCm / 100)
  const lambdaY = safeDivide(vpLeffY, profile.iyRadiusCm / 100)
  return Math.max(lambdaX, lambdaY)
}

function resolveReducedLambda(lambdaValue: number, strengthResistanceMpa: number): number {
  return lambdaValue * Math.sqrt(safeDivide(strengthResistanceMpa, ELASTICITY_MODULUS_MPA))
}

function resolveDelta(maxLambda: number): number {
  return 9.87 * (1 - ALPHA + BETA * maxLambda) + maxLambda ** 2
}

function resolvePhi(delta: number, maxLambda: number): number {
  if (maxLambda <= 0) {
    return 1
  }

  const radicand = delta ** 2 - 39.48 * maxLambda ** 2
  const normalized = Math.max(0, radicand)

  return safeDivide(0.5 * (delta - Math.sqrt(normalized)), maxLambda ** 2)
}

function resolveList6UpperBound(axis: readonly number[], target: number, fallback: number): number {
  if (target < axis[0] - EXCEL_EPS) {
    return fallback
  }

  let lowerIndex = -1
  for (let index = 0; index < axis.length; index += 1) {
    if (excelLte(axis[index], target)) {
      lowerIndex = index
    }
  }

  if (lowerIndex < 0 || lowerIndex + 1 >= axis.length) {
    return fallback
  }

  return axis[lowerIndex + 1]
}

function findAxisIndex(axis: readonly number[], value: number): number {
  return axis.findIndex((candidate) => Math.abs(candidate - value) <= EXCEL_EPS)
}

function resolvePanelCountForRr(spanUpperM: number): number {
  if (spanUpperM === 18) {
    return 4
  }

  if (spanUpperM === 24) {
    return 8
  }

  return 12
}

function pickBestCandidate(candidates: CandidateEvaluation[]): CandidateEvaluation | null {
  if (candidates.length === 0) {
    return null
  }

  return candidates.reduce((best, current) => {
    if (current.massObjective < best.massObjective - EXCEL_EPS) {
      return current
    }

    if (Math.abs(current.massObjective - best.massObjective) <= EXCEL_EPS && current.profile.ordinal < best.profile.ordinal) {
      return current
    }

    return best
  })
}

function buildNotFoundGroupResult(key: TrussGroupKey): TrussGroupResult {
  return {
    key,
    label: GROUP_LABELS[key],
    status: 'not-found',
    profile: null,
    utilization: null,
    massKg: null,
    objectiveMassKg: null,
    criterion: null,
    criterionValue: null,
    widthMm: null,
    thicknessMm: null,
    ordinal: null,
    checks: [],
  }
}

function toGroupResult(key: TrussGroupKey, candidate: CandidateEvaluation): TrussGroupResult {
  return {
    key,
    label: GROUP_LABELS[key],
    status: 'ok',
    profile: candidate.profile.profile,
    utilization: candidate.utilization,
    massKg: candidate.massObjective,
    objectiveMassKg: candidate.massObjective,
    criterion: candidate.criterion,
    criterionValue: candidate.criterionValue,
    widthMm: candidate.profile.bMm,
    thicknessMm: candidate.profile.tMm,
    ordinal: candidate.profile.ordinal,
    checks: candidate.checks,
  }
}

function resolveVpGroup(
  input: TrussInput,
  efforts: TrussEffortSummary,
  vpLeffY: number,
  minWidthMm: number,
): VpResult {
  const vpCandidates: CandidateEvaluation[] = []

  for (const profile of trussProfileCatalog) {
    const strengthResistanceMpa = resolveStrengthResistanceMpa(profile.tMm)
    const lambdaX = safeDivide(3, profile.ixRadiusCm / 100)
    const lambdaY = safeDivide(vpLeffY, profile.iyRadiusCm / 100)
    const reducedLambdaX = resolveReducedLambda(lambdaX, strengthResistanceMpa)
    const reducedLambdaY = resolveReducedLambda(lambdaY, strengthResistanceMpa)

    const deltaByMax = resolveDelta(Math.max(reducedLambdaX, reducedLambdaY))
    const deltaByY = resolveDelta(reducedLambdaY)
    const phiMin = resolvePhi(deltaByMax, Math.max(reducedLambdaX, reducedLambdaY))
    const phiY = resolvePhi(deltaByY, reducedLambdaY)

    const areaM2 = profile.areaCm2 / 10_000
    const wxM3 = profile.wxCm3 / 1_000_000
    const ixM4 = profile.ixCm4 / 100_000_000
    const sxM3 = profile.sxCm3 / 1_000_000
    const thicknessM = profile.tMm / 1000

    const checkStability7 = safeDivide(efforts.vpN, phiMin * areaM2 * strengthResistanceMpa * 1000)
    const sigmaCombinedMpa = safeDivide(efforts.vpN, areaM2) / 1000 + safeDivide(efforts.vpM, wxM3) / 1000
    const checkStrength106 = safeDivide(sigmaCombinedMpa, strengthResistanceMpa)
    const sigmaN = safeDivide(efforts.vpN, areaM2) / 1000
    const tau = safeDivide(efforts.vpQ * sxM3, ixM4 * 2 * thicknessM) / 1000
    const checkEquivalent44 = safeDivide(0.87 * Math.sqrt(sigmaN ** 2 + 3 * tau ** 2), strengthResistanceMpa)

    const lambdaForTable = Math.min(reducedLambdaX, reducedLambdaY)
    const lambdaTab = lambdaForTable < 0.5 ? 0.5 : resolveList6UpperBound(trussList6Table.lambdaAxis, lambdaForTable, 9)

    const eccentricity = safeDivide(efforts.vpM, efforts.vpN)
    const mCoefficient = eccentricity * safeDivide(areaM2, wxM3)
    const mEffective = mCoefficient * trussLimitsAndConstants.vpEta
    const mTab = resolveList6UpperBound(trussList6Table.mAxis, mEffective, 20)

    const lambdaIndex = findAxisIndex(trussList6Table.lambdaAxis, lambdaTab)
    const mIndex = findAxisIndex(trussList6Table.mAxis, mTab)
    const phiEValue =
      lambdaIndex >= 0 && mIndex >= 0
        ? (trussList6Table.phiE[lambdaIndex]?.[mIndex] ?? 0) / 1000
        : 0
    const phiE = Math.max(0.001, phiEValue)
    const checkStability109 = safeDivide(efforts.vpN, phiE * areaM2 * strengthResistanceMpa * 1000)

    const deltaX = Math.max(
      0.001,
      1 - safeDivide(0.1 * efforts.vpN * reducedLambdaX ** 2, areaM2 * strengthResistanceMpa * 1000),
    )
    const checkStability120 =
      safeDivide(efforts.vpN, phiY * areaM2 * strengthResistanceMpa * 1000) +
      safeDivide(efforts.vpM, trussLimitsAndConstants.vpBeFactor * deltaX * wxM3 * strengthResistanceMpa * 1000)

    const checks = [
      { key: VP_CHECKS[0].key, label: VP_CHECKS[0].label, value: checkStability7 },
      { key: VP_CHECKS[1].key, label: VP_CHECKS[1].label, value: checkStrength106 },
      { key: VP_CHECKS[2].key, label: VP_CHECKS[2].label, value: checkEquivalent44 },
      { key: VP_CHECKS[3].key, label: VP_CHECKS[3].label, value: checkStability109 },
      { key: VP_CHECKS[4].key, label: VP_CHECKS[4].label, value: checkStability120 },
    ]

    const governing = checks.reduce((best, current) => (current.value > best.value + EXCEL_EPS ? current : best))
    const maxSlenderness = Math.max(lambdaX, lambdaY)

    const passes =
      excelLte(governing.value, trussLimitsAndConstants.maxUtilization.vp) &&
      !profile.vpExcluded &&
      excelLte(maxSlenderness, 120) &&
      excelGte(profile.tMm, input.limits.minThicknessMm.vp) &&
      excelGte(profile.bMm, minWidthMm) &&
      excelLte(profile.bMm, input.limits.maxWidthMm.vp)

    if (!passes) {
      continue
    }

    const massObjective =
      safeDivide(input.spanM, Math.cos(toRadians(input.roofSlopeDeg))) * profile.unitMassKgPerM * MASS_FACTOR -
      profile.ordinal * 0.000001

    vpCandidates.push({
      profile,
      utilization: governing.value,
      massObjective,
      checks,
      criterion: governing.label,
      criterionValue: governing.value,
    })
  }

  const selected = pickBestCandidate(vpCandidates)
  if (!selected) {
    return {
      result: buildNotFoundGroupResult('vp'),
      selectedWidthMm: null,
    }
  }

  return {
    result: toGroupResult('vp', selected),
    selectedWidthMm: selected.profile.bMm,
  }
}

function resolveNpGroup(input: TrussInput, efforts: TrussEffortSummary, vpLeffY: number, minWidthMm: number): NpResult {
  const npCandidates: CandidateEvaluation[] = []

  for (const profile of trussProfileCatalog) {
    const strengthResistanceMpa = resolveStrengthResistanceMpa(profile.tMm)
    const areaM2 = profile.areaCm2 / 10_000
    const checkStrength5 = safeDivide(efforts.npNPlus, areaM2 * strengthResistanceMpa * 1000)
    const vpSlendernessMax = resolveVpSlendernessMax(profile, vpLeffY)

    const passes =
      excelLte(checkStrength5, trussLimitsAndConstants.maxUtilization.np) &&
      !profile.npExcluded &&
      excelLte(vpSlendernessMax, 400) &&
      excelGte(profile.tMm, input.limits.minThicknessMm.np) &&
      excelGte(profile.bMm, minWidthMm) &&
      excelLte(profile.bMm, input.limits.maxWidthMm.np)

    if (!passes) {
      continue
    }

    const massObjective = (input.spanM - 2.4) * profile.unitMassKgPerM * MASS_FACTOR + profile.ordinal * 0.000001
    npCandidates.push({
      profile,
      utilization: checkStrength5,
      massObjective,
      checks: [{ key: 'strength5', label: 'К-т исп по прочности (5)', value: checkStrength5 }],
      criterion: 'К-т исп по прочности (5)',
      criterionValue: checkStrength5,
    })
  }

  const selected = pickBestCandidate(npCandidates)
  if (!selected) {
    return {
      result: buildNotFoundGroupResult('np'),
      selectedWidthMm: null,
    }
  }

  return {
    result: toGroupResult('np', selected),
    selectedWidthMm: selected.profile.bMm,
  }
}

function resolveBracingGroup(
  key: Extract<TrussGroupKey, 'orb' | 'or' | 'rr'>,
  nPlusKn: number,
  nMinusKn: number,
  leffM: number,
  vpLeffY: number,
  vpSlendernessLimit: number,
  minWidthMm: number,
  maxWidthMm: number,
  minThicknessMm: number,
  maxUtilization: number,
  massBaseLengthM: number,
  exclusionFlag: keyof Pick<TrussProfile, 'orbExcluded' | 'orExcluded' | 'rrExcluded'>,
): TrussGroupResult {
  const candidates: CandidateEvaluation[] = []

  for (const profile of trussProfileCatalog) {
    const strengthResistanceMpa = resolveStrengthResistanceMpa(profile.tMm)
    const lambdaX = safeDivide(leffM, profile.ixRadiusCm / 100)
    const lambdaY = safeDivide(leffM, profile.iyRadiusCm / 100)
    const reducedLambdaX = resolveReducedLambda(lambdaX, strengthResistanceMpa)
    const reducedLambdaY = resolveReducedLambda(lambdaY, strengthResistanceMpa)
    const phi = resolvePhi(resolveDelta(Math.max(reducedLambdaX, reducedLambdaY)), Math.max(reducedLambdaX, reducedLambdaY))

    const areaM2 = profile.areaCm2 / 10_000
    const checkStrength5 = safeDivide(nPlusKn, areaM2 * strengthResistanceMpa * 1000)
    const checkStability7 = safeDivide(nMinusKn, phi * areaM2 * strengthResistanceMpa * 1000)
    const governing = checkStability7 > checkStrength5 + EXCEL_EPS
      ? { key: AXIAL_CHECKS[1].key, label: AXIAL_CHECKS[1].label, value: checkStability7 }
      : { key: AXIAL_CHECKS[0].key, label: AXIAL_CHECKS[0].label, value: checkStrength5 }

    const vpSlendernessMax = resolveVpSlendernessMax(profile, vpLeffY)
    const isExcluded = Boolean(profile[exclusionFlag])

    const passes =
      excelLte(governing.value, maxUtilization) &&
      !isExcluded &&
      excelLte(vpSlendernessMax, vpSlendernessLimit) &&
      excelGte(profile.tMm, minThicknessMm) &&
      excelLte(profile.bMm, maxWidthMm) &&
      excelGte(profile.bMm, minWidthMm)

    if (!passes) {
      continue
    }

    const massObjective = massBaseLengthM * profile.unitMassKgPerM * MASS_FACTOR + profile.ordinal * 0.000001

    candidates.push({
      profile,
      utilization: governing.value,
      massObjective,
      checks: [
        { key: AXIAL_CHECKS[0].key, label: AXIAL_CHECKS[0].label, value: checkStrength5 },
        { key: AXIAL_CHECKS[1].key, label: AXIAL_CHECKS[1].label, value: checkStability7 },
      ],
      criterion: governing.label,
      criterionValue: governing.value,
    })
  }

  const selected = pickBestCandidate(candidates)
  return selected ? toGroupResult(key, selected) : buildNotFoundGroupResult(key)
}

function calculateSnapshot(allGroupsResolved: boolean): CalculationSnapshot {
  return {
    sourceWorkbook: trussSnapshotMeta.sourceWorkbook,
    sourceSheets: ['Лист1', 'Единичные эпюры', 'Расчет ВП', 'Лист6', 'Расчет НП', 'Расчет ОРб', 'Расчет ОР', 'Расчет РР'],
    status: allGroupsResolved ? 'parity-verified' : 'in-progress',
    note: allGroupsResolved
      ? 'SP 20 branch is transferred with parity for group checks and total truss mass.'
      : 'SP 20 branch is calculated, but one or more groups have no suitable profile for current input.',
  }
}

export function calculateTruss(input: TrussInput): TrussCalculationResult {
  const validated = trussInputSchema.parse(input)
  const { loadSummary, efforts } = calculateEfforts(validated)
  const limits = validated.limits

  const vpLeffY = validated.purlinBracingStepMm > 0 ? validated.purlinBracingStepMm / 1000 : 3
  const requiredChordMinWidthMm = Math.max(limits.minWidthMm.orb, limits.minWidthMm.or, limits.minWidthMm.rr)
  const vp = resolveVpGroup(validated, efforts, vpLeffY, requiredChordMinWidthMm)
  const np = resolveNpGroup(validated, efforts, vpLeffY, requiredChordMinWidthMm)

  const chordMaxWidth =
    vp.selectedWidthMm !== null && np.selectedWidthMm !== null
      ? Math.min(vp.selectedWidthMm, np.selectedWidthMm)
      : Number.NEGATIVE_INFINITY

  const orb = resolveBracingGroup(
    'orb',
    efforts.orbNPlus,
    efforts.orbNMinus,
    1.9,
    vpLeffY,
    120,
    limits.minWidthMm.orb,
    chordMaxWidth,
    limits.minThicknessMm.orb,
    trussLimitsAndConstants.maxUtilization.orb,
    1.9 * 4,
    'orbExcluded',
  )

  const or = resolveBracingGroup(
    'or',
    efforts.orNPlus,
    efforts.orNMinus,
    2,
    vpLeffY,
    150,
    limits.minWidthMm.or,
    chordMaxWidth,
    limits.minThicknessMm.or,
    trussLimitsAndConstants.maxUtilization.or,
    2 * 4,
    'orExcluded',
  )

  const rr = resolveBracingGroup(
    'rr',
    efforts.rrNPlus,
    efforts.rrNMinus,
    2.5,
    vpLeffY,
    150,
    limits.minWidthMm.rr,
    chordMaxWidth,
    limits.minThicknessMm.rr,
    trussLimitsAndConstants.maxUtilization.rr,
    2.3 * resolvePanelCountForRr(loadSummary.spanUpperM),
    'rrExcluded',
  )

  const groups: Record<TrussGroupKey, TrussGroupResult> = {
    vp: vp.result,
    np: np.result,
    orb,
    or,
    rr,
  }

  const allGroupsResolved = Object.values(groups).every((group) => group.status === 'ok')
  const structuralMassKg = Object.values(groups).reduce((sum, group) => sum + (group.massKg ?? 0), 0)

  const totalMassKg = allGroupsResolved ? structuralMassKg + trussLimitsAndConstants.massAddConstantKg : null
  const specificMassKgPerM2 =
    totalMassKg === null ? null : safeDivide(totalMassKg, validated.frameStepM * validated.spanM)

  return {
    snapshot: calculateSnapshot(allGroupsResolved),
    loadSummary,
    efforts,
    groups,
    totalMassKg,
    specificMassKgPerM2,
  }
}

export type { TrussCalculationResult }
