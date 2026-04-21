import {
  purlinCityLoads,
  purlinCoveringCatalog,
  purlinProfileSheetIndices,
  purlinSpRkEnCityFlags,
} from '@/domain/purlin/model/purlin-reference.generated'
import type { PurlinInput } from '@/domain/purlin/model/purlin-input'

export interface PurlinDerivedContext {
  windLoadKpa: number
  snowLoadKpa: number
  coveringLoadKpa: number
  snowBagFactor: number
  autoStepIndex: number
  hasSpRkEnCityFlag: boolean
}

function findCityLoad(city: string) {
  const record = purlinCityLoads.find((item) => item.city === city)

  if (!record) {
    throw new Error(`Unknown purlin city load record: ${city}`)
  }

  return record
}

function findCovering(coveringType: string) {
  const record = purlinCoveringCatalog.find((item) => item.name === coveringType)

  if (!record) {
    throw new Error(`Unknown purlin covering type: ${coveringType}`)
  }

  return record
}

function findProfileSheetIndex(profileSheet: string): number {
  const record = purlinProfileSheetIndices.find((item) => item.profileSheet === profileSheet)

  if (!record) {
    throw new Error(`Unknown purlin profile sheet: ${profileSheet}`)
  }

  return record.autoStepIndex
}

function resolveSnowBagFactor(input: PurlinInput, snowLoadKpa: number): number {
  if (input.snowBagMode === 'нет') {
    return input.normativeMode === 'по СП 20.13330.20ХХ' ? 1 : 0.8
  }

  const sourceLength =
    input.snowBagMode === 'вдоль здания' ? input.spanM : input.buildingLengthM

  const preliminaryFactor =
    1 + (0.4 * sourceLength + 0.4 * input.adjacentBuildingSizeM) / input.heightDifferenceM

  const limitFactor = Math.min((2 * input.heightDifferenceM) / snowLoadKpa, 4)

  return preliminaryFactor >= limitFactor ? limitFactor : preliminaryFactor
}

function resolveAutoStepIndex(coveringType: string, profileSheet: string): number {
  const covering = findCovering(coveringType)

  return covering.fixedAutoStepIndex ?? findProfileSheetIndex(profileSheet)
}

export function buildPurlinDerivedContext(input: PurlinInput): PurlinDerivedContext {
  const cityLoad = findCityLoad(input.city)
  const covering = findCovering(input.coveringType)

  return {
    windLoadKpa: cityLoad.windLoadKpa,
    snowLoadKpa: cityLoad.snowLoadKpa,
    coveringLoadKpa: covering.coveringLoadKpa,
    snowBagFactor: resolveSnowBagFactor(input, cityLoad.snowLoadKpa),
    autoStepIndex: resolveAutoStepIndex(input.coveringType, input.profileSheet),
    hasSpRkEnCityFlag: purlinSpRkEnCityFlags.some((item) => item.city === input.city),
  }
}
