import { purlinCityLoads } from '@/domain/purlin/model/purlin-reference.generated'
import {
  defaultWindowRigelInput,
  windowRigelCandidateCatalog,
  windowRigelConstants,
  windowRigelConstructionCatalog,
  windowRigelNuGrid,
  windowRigelNuXValues,
  windowRigelNuYValues,
  windowRigelWindHeightTable,
  windowRigelWindShape,
  windowRigelWindowTypeFactors,
} from './window-rigel-reference.generated'

export interface WindowRigelInput {
  city: string
  responsibilityLevel: number
  windowHeightM: number
  frameStepM: number
  windowType: number
  buildingHeightM: number
  buildingSpanM: number
  buildingLengthM: number
  terrainType: 'А' | 'В' | 'С'
  windowConstruction: string
  maxUtilization: number
  tubeS245PriceRubPerKg: number
  tubeS345PriceRubPerKg: number
}

export interface WindowRigelCandidateResult {
  ordinal: number
  profile: string
  steelGrade: string
  massKg: number
  rankScore: number
  utilization: {
    flexibility: number
    strength: number
    deflection: number
  }
  passes: boolean
}

export interface WindowRigelCalculationResult {
  input: WindowRigelInput
  loads: {
    windLoadKpa: number
    verticalLoadKpa: number
    horizontalLoadCase1Kpa: number
    horizontalLoadCase2Kpa: number
  }
  lengths: {
    outOfPlaneM: number
    inPlaneM: number
  }
  bottomCandidates: WindowRigelCandidateResult[]
  topCandidates: WindowRigelCandidateResult[]
  workbookPrimaryCandidates: WindowRigelCandidateResult[]
  workbookType1TopCandidates: WindowRigelCandidateResult[]
  workbookEffectiveTopCandidates: WindowRigelCandidateResult[]
}

const DEFAULT_S245_PRICE = 92
const DEFAULT_S345_PRICE = 98
const ELASTIC_MODULUS_PA = windowRigelConstants.elasticModulusPa
const legacyDecoder = new TextDecoder('utf-8')

const cleanText = (value: string): string => {
  try {
    return legacyDecoder.decode(Uint8Array.from(value, (character) => character.charCodeAt(0)))
  } catch {
    return value
  }
}

export const defaultWindowRigelDemoInput: WindowRigelInput = {
  city: 'Новый Уренгой',
  responsibilityLevel: Number(defaultWindowRigelInput.responsibilityLevel),
  windowHeightM: Number(defaultWindowRigelInput.windowHeightM),
  frameStepM: Number(defaultWindowRigelInput.frameStepM),
  windowType: Number(defaultWindowRigelInput.windowType),
  buildingHeightM: Number(defaultWindowRigelInput.buildingHeightM),
  buildingSpanM: Number(defaultWindowRigelInput.buildingSpanM),
  buildingLengthM: Number(defaultWindowRigelInput.buildingLengthM),
  terrainType: 'А',
  windowConstruction: '2-й стеклопакет',
  maxUtilization: Number(defaultWindowRigelInput.maxUtilization),
  tubeS245PriceRubPerKg: DEFAULT_S245_PRICE,
  tubeS345PriceRubPerKg: DEFAULT_S345_PRICE,
}

export const windowRigelConstructionOptions = [
  { name: '1-й стеклопакет', loadKpa: windowRigelConstructionCatalog[0].loadKpa },
  { name: '2-й стеклопакет', loadKpa: windowRigelConstructionCatalog[1].loadKpa },
  { name: '3-й стеклопакет', loadKpa: windowRigelConstructionCatalog[2].loadKpa },
] as const

export const windowRigelWindowTypeOptions = windowRigelWindowTypeFactors.map((item) => item.windowType)
export const windowRigelCityOptions = Array.from(new Set(purlinCityLoads.map((item) => item.city)))

const candidateCatalog = windowRigelCandidateCatalog.map((candidate) => ({
  ...candidate,
  profile: cleanText(candidate.profile),
  steelGrade: cleanText(candidate.steelGrade),
}))

const interpolate = (value: number, lower: number, upper: number, lowerValue: number, upperValue: number) => {
  if (Math.abs(upper - lower) < 1e-9) {
    return lowerValue
  }

  return ((value - lower) / (upper - lower)) * (upperValue - lowerValue) + lowerValue
}

const getBounds = (value: number, axis: readonly number[]) => {
  if (value <= axis[0]) {
    return { lowerIndex: 0, upperIndex: 0 }
  }

  const lastIndex = axis.length - 1
  if (value >= axis[lastIndex]) {
    return { lowerIndex: lastIndex, upperIndex: lastIndex }
  }

  for (let index = 0; index < axis.length - 1; index += 1) {
    const lower = axis[index]
    const upper = axis[index + 1]
    if (value >= lower && value <= upper) {
      return { lowerIndex: index, upperIndex: index + 1 }
    }
  }

  return { lowerIndex: lastIndex, upperIndex: lastIndex }
}

const interpolateNu = (xValue: number, yValue: number) => {
  const xBounds = getBounds(xValue, windowRigelNuXValues)
  const yBounds = getBounds(yValue, windowRigelNuYValues)
  const xLower = windowRigelNuXValues[xBounds.lowerIndex]
  const xUpper = windowRigelNuXValues[xBounds.upperIndex]
  const yLower = windowRigelNuYValues[yBounds.lowerIndex]
  const yUpper = windowRigelNuYValues[yBounds.upperIndex]
  const v00 = windowRigelNuGrid[xBounds.lowerIndex][yBounds.lowerIndex]
  const v01 = windowRigelNuGrid[xBounds.lowerIndex][yBounds.upperIndex]
  const v10 = windowRigelNuGrid[xBounds.upperIndex][yBounds.lowerIndex]
  const v11 = windowRigelNuGrid[xBounds.upperIndex][yBounds.upperIndex]

  if (xBounds.lowerIndex === xBounds.upperIndex && yBounds.lowerIndex === yBounds.upperIndex) {
    return v00
  }

  if (xBounds.lowerIndex === xBounds.upperIndex) {
    return ((yUpper - yValue) / (yUpper - yLower)) * (v01 - v00) + v00
  }

  if (yBounds.lowerIndex === yBounds.upperIndex) {
    return interpolate(xValue, xLower, xUpper, v00, v10)
  }

  const lowerInterpolated = interpolate(xValue, xLower, xUpper, v00, v10)
  const upperInterpolated = interpolate(xValue, xLower, xUpper, v01, v11)
  return ((yUpper - yValue) / (yUpper - yLower)) * (upperInterpolated - lowerInterpolated) + lowerInterpolated
}

const interpolateWindHeightValue = (
  heightM: number,
  terrainType: WindowRigelInput['terrainType'],
  key: 'kByTerrain' | 'zetaByTerrain',
) => {
  const lower = windowRigelWindHeightTable[0]
  if (heightM <= lower.heightM) {
    return lower[key][terrainType]
  }

  const upper = windowRigelWindHeightTable[windowRigelWindHeightTable.length - 1]
  if (heightM >= upper.heightM) {
    return upper[key][terrainType]
  }

  for (let index = 0; index < windowRigelWindHeightTable.length - 1; index += 1) {
    const current = windowRigelWindHeightTable[index]
    const next = windowRigelWindHeightTable[index + 1]

    if (heightM >= current.heightM && heightM <= next.heightM) {
      return interpolate(heightM, current.heightM, next.heightM, current[key][terrainType], next[key][terrainType])
    }
  }

  return upper[key][terrainType]
}

const getWindLoadKpa = (city: string) => {
  const normalized = city.trim().toLowerCase()
  const match = purlinCityLoads.find((item) => item.city.trim().toLowerCase() === normalized)
  if (!match) {
    throw new Error(`Unknown window rigel city: ${city}`)
  }

  return match.windLoadKpa
}

const getConstructionLoadKpa = (name: string) => {
  const normalized = name.trim().toLowerCase()
  const match = windowRigelConstructionOptions.find((item) => item.name.trim().toLowerCase() === normalized)
  if (!match) {
    throw new Error(`Unsupported window construction: ${name}`)
  }

  return match.loadKpa
}

const getWindowTypeFactor = (windowType: number) => {
  const match = windowRigelWindowTypeFactors.find((item) => item.windowType === windowType)
  if (!match) {
    throw new Error(`Unsupported window type: ${windowType}`)
  }

  return match
}

const getWindPressure = (
  coefficient: number,
  windLoadKpa: number,
  kByTerrain: number,
  zetaByTerrain: number,
  nuValue: number,
) => {
  const basePressure = Math.abs(windLoadKpa * kByTerrain * coefficient * windowRigelWindShape.gustFactor)
  return basePressure + basePressure * zetaByTerrain * nuValue
}

const buildContext = (input: WindowRigelInput) => {
  const windLoadKpa = getWindLoadKpa(input.city)
  const verticalLoadKpa = getConstructionLoadKpa(input.windowConstruction)
  const windowTypeFactor = getWindowTypeFactor(input.windowType)
  const kByTerrain = interpolateWindHeightValue(input.buildingHeightM, input.terrainType, 'kByTerrain')
  const zetaByTerrain = interpolateWindHeightValue(input.buildingHeightM, input.terrainType, 'zetaByTerrain')
  const nuValue = interpolateNu(0.4 * input.buildingSpanM, input.buildingHeightM)
  const negativeEdge = getWindPressure(windowRigelWindShape.negativeEdge, windLoadKpa, kByTerrain, zetaByTerrain, nuValue)
  const negativeMiddle = getWindPressure(
    windowRigelWindShape.negativeMiddle,
    windLoadKpa,
    kByTerrain,
    zetaByTerrain,
    nuValue,
  )
  const positive = getWindPressure(windowRigelWindShape.positive, windLoadKpa, kByTerrain, zetaByTerrain, nuValue)
  const horizontalLoadCase1Kpa = (negativeEdge + positive) * input.responsibilityLevel
  const horizontalLoadCase2Kpa = ((negativeMiddle / 1.4) + positive / 1.4) * input.responsibilityLevel

  return {
    input,
    reference: { candidateCatalog },
    windLoadKpa,
    verticalLoadKpa,
    horizontalLoadCase1Kpa,
    horizontalLoadCase2Kpa,
    outOfPlaneLengthM: input.frameStepM,
    inPlaneLengthM: input.frameStepM * windowTypeFactor.lengthFactor,
    lowerStrengthMoment:
      (verticalLoadKpa * input.windowHeightM + windowRigelConstants.lowerMomentLoadKpa) *
      input.frameStepM ** 2 *
      windowTypeFactor.momentFactor,
    upperStrengthMoment:
      windowRigelConstants.upperMomentLoadKpa * input.frameStepM ** 2 * windowTypeFactor.momentFactor,
    horizontalStrengthMoment:
      horizontalLoadCase1Kpa * ((input.windowHeightM + 1.2) / 2) * input.frameStepM ** 2 * windowTypeFactor.momentFactor,
    lowerServiceVerticalKpa: verticalLoadKpa * input.windowHeightM + windowRigelConstants.lowerServiceLoadKpa,
    upperServiceVerticalKpa: windowRigelConstants.upperServiceLoadKpa,
    lowerServiceHorizontalKpa: horizontalLoadCase1Kpa * ((input.windowHeightM + 1.2) / 2),
    upperServiceHorizontalKpa: horizontalLoadCase2Kpa * ((input.windowHeightM + 1.2) / 2),
    windowTypeFactor,
  }
}

const calculateFlexibilityUtilization = (
  candidate: (typeof candidateCatalog)[number],
  context: ReturnType<typeof buildContext>,
) => Math.max(
  (context.inPlaneLengthM * 100) / candidate.radiusXcm,
  (context.outOfPlaneLengthM * 100) / candidate.radiusYcm,
) / 200

const calculateStrengthUtilization = (
  candidate: (typeof candidateCatalog)[number],
  context: ReturnType<typeof buildContext>,
) =>
  (((context.lowerStrengthMoment +
    candidate.unitMassKgPerM * context.input.frameStepM ** 2 * context.windowTypeFactor.momentFactor / 100) /
    (candidate.sectionModulusXCm3 / 1_000_000) +
    context.horizontalStrengthMoment / (candidate.sectionModulusYCm3 / 1_000_000)) /
    1000) /
  candidate.strengthResistanceMpa

const calculateDeflectionUtilization = (
  candidate: (typeof candidateCatalog)[number],
  context: ReturnType<typeof buildContext>,
  side: 'bottom' | 'top',
) => {
  const verticalServiceKpa =
    side === 'bottom' ? context.lowerServiceVerticalKpa : context.upperServiceVerticalKpa
  const horizontalServiceKpa =
    side === 'bottom' ? context.lowerServiceHorizontalKpa : context.upperServiceHorizontalKpa
  const span = context.outOfPlaneLengthM
  const verticalDeflection =
    (5 / 384) *
    (verticalServiceKpa + candidate.unitMassKgPerM / 100) *
    span ** 4 /
    (ELASTIC_MODULUS_PA * (candidate.momentOfInertiaXCm4 / 100_000_000))
  const horizontalDeflection =
    (5 / 384) *
    horizontalServiceKpa *
    span ** 4 /
    (ELASTIC_MODULUS_PA * (candidate.momentOfInertiaYCm4 / 100_000_000))

  return Math.max(
    verticalDeflection / ((span / 300) * context.windowTypeFactor.deflectionFactor),
    horizontalDeflection / (span / 200),
  )
}

const rankCandidates = (context: ReturnType<typeof buildContext>, side: 'bottom' | 'top') =>
  context.reference.candidateCatalog
    .map((candidate) => {
      const flexibility = calculateFlexibilityUtilization(candidate, context)
      const strength = calculateStrengthUtilization(candidate, context)
      const deflection = calculateDeflectionUtilization(candidate, context, side)
      const passes =
        !candidate.excluded &&
        flexibility <= 1 &&
        strength <= context.input.maxUtilization &&
        deflection <= 1

      return {
        ordinal: candidate.ordinal,
        profile: candidate.profile,
        steelGrade: candidate.steelGrade,
        massKg: passes ? candidate.unitMassKgPerM * context.input.frameStepM + 0.0001 * candidate.ordinal : 999999999,
        rankScore: passes ? candidate.unitMassKgPerM * context.input.frameStepM + 0.0001 * candidate.ordinal : 999999999,
        utilization: {
          flexibility,
          strength,
          deflection,
        },
        passes,
      }
    })
    .filter((candidate) => candidate.passes)
    .sort((left, right) => left.rankScore - right.rankScore)
    .slice(0, 10)

export function calculateWindowRigel(input: WindowRigelInput): WindowRigelCalculationResult {
  const context = buildContext(input)
  const bottomCandidates = rankCandidates(context, 'bottom')
  const topCandidates = rankCandidates(context, 'top')

  return {
    input,
    loads: {
      windLoadKpa: context.windLoadKpa,
      verticalLoadKpa: context.verticalLoadKpa,
      horizontalLoadCase1Kpa: context.horizontalLoadCase1Kpa,
      horizontalLoadCase2Kpa: context.horizontalLoadCase2Kpa,
    },
    lengths: {
      outOfPlaneM: context.outOfPlaneLengthM,
      inPlaneM: context.inPlaneLengthM,
    },
    bottomCandidates,
    topCandidates,
    workbookPrimaryCandidates: bottomCandidates,
    workbookType1TopCandidates: topCandidates,
    workbookEffectiveTopCandidates: topCandidates,
  }
}
