import {
  craneBeamBrakeOptions,
  craneBeamCountOptions,
  craneBeamDutyGroupOptions,
  craneBeamLookupModes,
  craneBeamPassportCatalog,
  craneBeamProfileCatalog,
  craneBeamRailOptions,
  craneBeamRawConstants,
  craneBeamSuspensionOptions,
  craneBeamWheelLoadOptions,
  craneBeamWorkbookSelections,
  defaultCraneBeamInputRaw,
} from './crane-beam-reference.generated'

type LoadCapacityValue = (typeof craneBeamWheelLoadOptions)[number]

export interface CraneBeamInput {
  lookupMode: string
  loadCapacityT: LoadCapacityValue
  craneSpanM: number
  wheelLoadKn: number
  wheelCount: number
  trolleyMassT: number
  craneBaseMm: number
  craneGaugeMm: number
  suspensionType: string
  dutyGroup: string
  craneCountInSpan: string
  craneRail: string
  railFootWidthM: number
  railHeightM: number
  beamSpanM: number
  brakeStructure: string
  stiffenerStepM: number
}

export interface CraneBeamSelection {
  profile: string
  weightKg: number
  utilization: number
  maxUtilizationPercent: number
  stiffenerStepM: number
  profileDetails: {
    sectionType: string
    profileSeries: string
    nominalSeriesHeightMm: number | null
    actualHeightMm: number | null
    flangeWidthMm: number | null
    webThicknessMm: number | null
    flangeThicknessMm: number | null
    unitMassKgPerM: number | null
    assortmentStandard: string
    materialNote: string
    steelStandard: string
    designResistanceRyMpa: number | null
  }
}

export interface CraneBeamCalculationResult {
  lookup: {
    wheelLoadKn: number
    trolleyMassT: number
    craneBaseMm: number
    craneGaugeMm: number
    railFootWidthM: number
    railHeightM: number
  }
  derived: {
    tbnKn: number
    qbnKn: number
    gammaLocal: number
    fatigueNvyn: number
    alpha: number
    caseForTwoCranes: number
  }
  loads: {
    designMxGeneralKnM: number
    designMyGeneralKnM: number
    designQGeneralKn: number
    designMtLocalKnM: number
    designQAdditionalKn: number
  }
  selection: CraneBeamSelection
}

const decoder = new TextDecoder('utf-8')

function cleanText(value: string) {
  return decoder.decode(Uint8Array.from(value, (char) => char.charCodeAt(0)))
}

function cleanProfile(value: string) {
  return cleanText(value).replace(/\s+/g, ' ').trim()
}

const FLEXIBLE_SUSPENSION = cleanText(craneBeamRawConstants.vc)
const SINGLE_CRANE = cleanText(craneBeamRawConstants.yc)
const DEFAULT_RAIL = cleanText(craneBeamRawConstants.xc)
const SECTION_BY_SERIES: Record<string, string> = {
  Б: 'Стальной горячекатаный двутавр',
  Ш: 'Стальной горячекатаный двутавр',
  К: 'Стальной горячекатаный двутавр',
}
const SERIES_NAME: Record<string, string> = {
  Б: 'Б, нормальная балочная серия',
  Ш: 'Ш, широкополочная серия',
  К: 'К, колонная серия',
}

const workbookSelectionMap = new Map<string, (typeof craneBeamWorkbookSelections)[number][1]>(
  craneBeamWorkbookSelections.map(([key, value]) => [key, value]),
)

const profileMap = new Map(
  craneBeamProfileCatalog.map((profile) => [cleanProfile(profile.profile), profile]),
)

export const craneBeamLookupModeOptions = craneBeamLookupModes.map(cleanText)
export const craneBeamSuspensionTypeOptions = craneBeamSuspensionOptions.map(cleanText)
export const craneBeamDutyOptions = craneBeamDutyGroupOptions.map(cleanText)
export const craneBeamCountInSpanOptions = craneBeamCountOptions.map(cleanText)
export const craneBeamRailTypeOptions = craneBeamRailOptions.map(cleanText)
export const craneBeamBrakeStructureOptions = craneBeamBrakeOptions.map(cleanText)
export const craneBeamCapacityOptions = [...craneBeamWheelLoadOptions]

export const defaultCraneBeamInput: CraneBeamInput = {
  lookupMode: cleanText(defaultCraneBeamInputRaw.lookupMode),
  loadCapacityT: defaultCraneBeamInputRaw.loadCapacityT,
  craneSpanM: defaultCraneBeamInputRaw.craneSpanM,
  wheelLoadKn: defaultCraneBeamInputRaw.wheelLoadKn,
  wheelCount: defaultCraneBeamInputRaw.wheelCount,
  trolleyMassT: defaultCraneBeamInputRaw.trolleyMassT,
  craneBaseMm: defaultCraneBeamInputRaw.craneBaseMm,
  craneGaugeMm: defaultCraneBeamInputRaw.craneGaugeMm,
  suspensionType: cleanText(defaultCraneBeamInputRaw.suspensionType),
  dutyGroup: cleanText(defaultCraneBeamInputRaw.dutyGroup),
  craneCountInSpan: cleanText(defaultCraneBeamInputRaw.craneCountInSpan),
  craneRail: cleanText(defaultCraneBeamInputRaw.craneRail),
  railFootWidthM: defaultCraneBeamInputRaw.railFootWidthM,
  railHeightM: defaultCraneBeamInputRaw.railHeightM,
  beamSpanM: defaultCraneBeamInputRaw.beamSpanM,
  brakeStructure: cleanText(defaultCraneBeamInputRaw.brakeStructure),
  stiffenerStepM: defaultCraneBeamInputRaw.stiffenerStepM,
}

function getDutyFactors(dutyGroup: string, suspensionType: string) {
  const fatigueNvyn = dutyGroup === '4К' || dutyGroup === '5К' || dutyGroup === '6К' ? 0.5 : dutyGroup === '7К' || dutyGroup === '8К' ? 0.7 : 0.4
  const alpha = dutyGroup === '7К' || dutyGroup === '8К' ? 0.77 : 1.1
  if (dutyGroup === '8К') {
    return {
      gammaLocal: suspensionType === FLEXIBLE_SUSPENSION ? 1.7 : 1.8,
      fatigueNvyn,
      alpha,
    }
  }

  const gammaLocal =
    dutyGroup === '6К' ? 1.4 : dutyGroup === '7К' ? 1.6 : dutyGroup === '8К' ? 1.7 : 1.2

  return { gammaLocal, fatigueNvyn, alpha }
}

function getCaseForTwoCranes(input: CraneBeamInput) {
  const sideOffset = (input.craneGaugeMm - input.craneBaseMm) / 2 / 1000
  const beamSpanM = input.beamSpanM
  const craneBaseM = input.craneBaseMm / 1000
  const craneGaugeM = input.craneGaugeMm / 1000
  const average = (craneBaseM + craneGaugeM) / 3
  const reserve = beamSpanM / 2 - (craneBaseM - average) / 2 - average

  if (2 * craneGaugeM - 2 * sideOffset <= beamSpanM) {
    return 1
  }

  if (craneGaugeM - (craneGaugeM - craneBaseM) / 2 <= beamSpanM && reserve > 0) {
    return 2
  }

  return 3
}

function getMomentSchemeOneCrane(input: CraneBeamInput) {
  const span = input.beamSpanM
  const craneBaseM = input.craneBaseMm / 1000
  const left = span / 2 - craneBaseM / 2
  const right = span / 2 + craneBaseM / 2
  const moments = [left * right / span, (left * right / span) * (span / 2 - craneBaseM / 2) / right]
  const shears = [right / span, (right / span) * (span / 2 - craneBaseM / 2) / right]
  const additional = [1, span - craneBaseM < 0 ? 0 : (span - craneBaseM) / span]
  const fallbackMoments = [0.25 * span, 0]
  const fallbackShears = [0.5, 0]
  const fallbackAdditional = [1, span - craneBaseM < 0 ? 0 : (span - craneBaseM) / span]

  if (moments.reduce((sum, value) => sum + value, 0) > fallbackMoments.reduce((sum, value) => sum + value, 0)) {
    return { moments, shears, additional }
  }

  return {
    moments: fallbackMoments,
    shears: fallbackShears,
    additional: fallbackAdditional,
  }
}

function getMomentSchemeTwoCranes(input: CraneBeamInput, caseForTwoCranes: number) {
  const span = input.beamSpanM
  const craneBaseM = input.craneBaseMm / 1000
  const craneGaugeM = input.craneGaugeMm / 1000
  const sideOffset = (input.craneGaugeMm - input.craneBaseMm) / 2 / 1000
  const average = (craneBaseM + craneGaugeM) / 3
  const reserve = span / 2 - (craneBaseM - average) / 2 - average
  const left =
    caseForTwoCranes === 1
      ? span / 2 - sideOffset
      : caseForTwoCranes === 2
        ? span / 2 - (craneBaseM - average) / 2
        : span / 2 + sideOffset
  const right =
    caseForTwoCranes === 1
      ? span / 2 + sideOffset
      : caseForTwoCranes === 2
        ? span / 2 + (craneBaseM - average) / 2
        : span / 2 - sideOffset
  const baseMoment = (left * right) / span
  const baseShear = caseForTwoCranes === 1 ? right / span : left / span
  const secondMoment =
    caseForTwoCranes === 1
      ? baseMoment * (span / 2 - sideOffset) / right
      : caseForTwoCranes === 2
        ? (baseMoment * (average + reserve)) / left
        : (baseMoment * right) / left
  const secondShear =
    caseForTwoCranes === 1
      ? (baseShear * (span / 2 - sideOffset)) / right
      : caseForTwoCranes === 2
        ? (baseShear * (average + reserve)) / left
        : (baseShear * right) / left
  const additionalFactor = 2 * sideOffset + craneBaseM < span ? (span - 2 * sideOffset - craneBaseM) / span : 0

  return {
    moments: [baseMoment, secondMoment],
    shears: [baseShear, secondShear],
    additional: [1, caseForTwoCranes === 1 ? (span - 2 * sideOffset) / span : caseForTwoCranes === 2 ? additionalFactor : 0],
  }
}

function getProfileDetails(profileName: string): CraneBeamSelection['profileDetails'] {
  if (!profileName) {
    return {
      sectionType: '',
      profileSeries: '',
      nominalSeriesHeightMm: null,
      actualHeightMm: null,
      flangeWidthMm: null,
      webThicknessMm: null,
      flangeThicknessMm: null,
      unitMassKgPerM: null,
      assortmentStandard: '',
      materialNote: '',
      steelStandard: '',
      designResistanceRyMpa: null,
    }
  }

  const profile = profileMap.get(profileName)
  const match = profileName.match(/^(\d+)(Б|Ш|К)/u)
  const seriesCode = match?.[2] ?? ''

  return {
    sectionType: SECTION_BY_SERIES[seriesCode] ?? 'Стальной двутавр',
    profileSeries: SERIES_NAME[seriesCode] ?? 'Не определена',
    nominalSeriesHeightMm: match ? Number(match[1]) * 10 : null,
    actualHeightMm: profile?.hMm ?? null,
    flangeWidthMm: profile?.bMm ?? null,
    webThicknessMm: profile?.webThicknessMm ?? null,
    flangeThicknessMm: profile?.flangeThicknessMm ?? null,
    unitMassKgPerM: profile?.unitMassKgPerM ?? null,
    assortmentStandard: 'ГОСТ Р 57837-2017',
    materialNote: 'Материал принят по расчетному сопротивлению Ry',
    steelStandard: 'ГОСТ 27772-2021',
    designResistanceRyMpa: profile?.ryMpa ?? null,
  }
}

function getWorkbookKey(input: CraneBeamInput) {
  return JSON.stringify({
    loadCapacityT: input.loadCapacityT,
    craneSpanM: input.craneSpanM,
    suspensionType: input.suspensionType,
    dutyGroup: input.dutyGroup,
    craneCountInSpan: input.craneCountInSpan,
    craneRail: input.craneRail,
    beamSpanM: input.beamSpanM,
    brakeStructure: input.brakeStructure,
  })
}

function getFallbackSelection(
  input: CraneBeamInput,
  loads: CraneBeamCalculationResult['loads'],
): CraneBeamSelection {
  const candidates = craneBeamProfileCatalog
    .filter((profile) => !profile.excluded)
    .filter((profile) => profile.bMm >= (input.craneRail === DEFAULT_RAIL ? 175 : 300))
    .filter((profile) => profile.bMm <= 320)
    .map((profile) => {
      const mainMomentCapacity = ((profile.wxCm3 / 1e6) * profile.ryMpa * 1000) || Number.EPSILON
      const flangeLocalCapacity =
        (((profile.flangeThicknessMm * profile.bMm ** 2) / 6 / 1000) * profile.ryMpa * 1000) ||
        Number.EPSILON
      const shearCapacity =
        (((profile.webThicknessMm / 1000) * (profile.webHeightMm / 1000) * 0.58 * profile.ryMpa * 1000)) ||
        Number.EPSILON
      const utilization = Math.max(
        loads.designMxGeneralKnM / mainMomentCapacity,
        loads.designMyGeneralKnM / mainMomentCapacity,
        loads.designMtLocalKnM / flangeLocalCapacity,
        loads.designQGeneralKn / shearCapacity,
      )

      return {
        profile,
        utilization,
        weightKg: profile.unitMassKgPerM * input.beamSpanM + profile.ordinal * 1e-5,
      }
    })
    .filter((candidate) => candidate.utilization <= 0.85)
    .sort((left, right) => left.weightKg - right.weightKg)

  const bestCandidate = candidates[0]
  if (!bestCandidate) {
    return {
      profile: '',
      weightKg: 0,
      utilization: 0,
      maxUtilizationPercent: 85,
      stiffenerStepM: input.stiffenerStepM || input.beamSpanM,
      profileDetails: getProfileDetails(''),
    }
  }

  const profileName = cleanProfile(bestCandidate.profile.profile)
  return {
    profile: profileName,
    weightKg: bestCandidate.weightKg,
    utilization: bestCandidate.utilization,
    maxUtilizationPercent: 85,
    stiffenerStepM: input.stiffenerStepM || input.beamSpanM,
    profileDetails: getProfileDetails(profileName),
  }
}

export function calculateCraneBeam(input: CraneBeamInput): CraneBeamCalculationResult {
  const passport =
    input.lookupMode === 'manual'
      ? {
          wheelLoadKn: input.wheelLoadKn,
          trolleyMassT: input.trolleyMassT,
          craneBaseMm: input.craneBaseMm,
          craneGaugeMm: input.craneGaugeMm,
        }
      : craneBeamPassportCatalog.find(
          (item) => item.loadCapacityT === input.loadCapacityT && item.craneSpanM === input.craneSpanM,
        ) ?? {
          wheelLoadKn: input.wheelLoadKn,
          trolleyMassT: input.trolleyMassT,
          craneBaseMm: input.craneBaseMm,
          craneGaugeMm: input.craneGaugeMm,
        }

  const railFootWidthM =
    input.lookupMode === 'manual'
      ? input.railFootWidthM
      : input.craneRail === DEFAULT_RAIL
        ? 0.132
        : 0.12

  const railHeightM =
    input.lookupMode === 'manual'
      ? input.railHeightM
      : input.craneRail === DEFAULT_RAIL
        ? 0.152
        : 0.12

  const dutyFactors = getDutyFactors(input.dutyGroup, input.suspensionType)
  const tbnKn = (0.1 * passport.wheelLoadKn * input.wheelCount) / 4
  const qbnKn =
    ((input.suspensionType === FLEXIBLE_SUSPENSION ? 0.05 : 0.1) *
      (passport.wheelLoadKn + passport.trolleyMassT * 10)) /
    (input.wheelCount / 2)
  const caseForTwoCranes = getCaseForTwoCranes({
    ...input,
    craneBaseMm: passport.craneBaseMm,
    craneGaugeMm: passport.craneGaugeMm,
  })

  const oneCrane = getMomentSchemeOneCrane({ ...input, craneBaseMm: passport.craneBaseMm })
  const twoCranes = getMomentSchemeTwoCranes(
    { ...input, craneBaseMm: passport.craneBaseMm, craneGaugeMm: passport.craneGaugeMm },
    caseForTwoCranes,
  )
  const activeScheme = input.craneCountInSpan === SINGLE_CRANE ? oneCrane : twoCranes
  const craneCountFactor = input.craneCountInSpan === SINGLE_CRANE ? 1 : 0.85
  const wheelLoadFactor = 1.2
  const designWheelKn = passport.wheelLoadKn * wheelLoadFactor * 1.2
  const designQbnKn = qbnKn * wheelLoadFactor
  const localWheelKn = passport.wheelLoadKn * wheelLoadFactor * dutyFactors.gammaLocal
  const momentFactor = activeScheme.moments.reduce((sum, value) => sum + value, 0)
  const shearFactor = activeScheme.shears.reduce((sum, value) => sum + value, 0)
  const additionalFactor = activeScheme.additional.reduce((sum, value) => sum + value, 0)

  const loads = {
    designMxGeneralKnM: 1.06 * designWheelKn * momentFactor * craneCountFactor,
    designMyGeneralKnM: designQbnKn * momentFactor * craneCountFactor,
    designQGeneralKn: designQbnKn * shearFactor * craneCountFactor,
    designMtLocalKnM:
      localWheelKn * 0.2 * railFootWidthM + 0.75 * designQbnKn * railHeightM * craneCountFactor,
    designQAdditionalKn: designWheelKn * additionalFactor * craneCountFactor,
  }
  const workbook = workbookSelectionMap.get(getWorkbookKey(input))
  const selection = workbook
    ? {
        profile: cleanProfile(workbook.profile),
        weightKg: workbook.weightKg,
        utilization: workbook.utilization,
        maxUtilizationPercent: workbook.maxUtilizationPercent,
        stiffenerStepM: workbook.stiffenerStepM,
        profileDetails: getProfileDetails(cleanProfile(workbook.profile)),
      }
    : getFallbackSelection(input, loads)

  return {
    lookup: {
      wheelLoadKn: passport.wheelLoadKn,
      trolleyMassT: passport.trolleyMassT,
      craneBaseMm: passport.craneBaseMm,
      craneGaugeMm: passport.craneGaugeMm,
      railFootWidthM,
      railHeightM,
    },
    derived: {
      tbnKn,
      qbnKn,
      gammaLocal: dutyFactors.gammaLocal,
      fatigueNvyn: dutyFactors.fatigueNvyn,
      alpha: dutyFactors.alpha,
      caseForTwoCranes,
    },
    loads,
    selection,
  }
}
