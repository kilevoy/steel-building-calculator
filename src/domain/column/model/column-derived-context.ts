import {
  columnCityLoads,
  columnCoveringCatalog,
  columnSupportCraneCatalog,
} from '@/domain/column/model/column-reference.generated'
import type { ColumnInput } from '@/domain/column/model/column-input'

export interface ColumnDerivedContext {
  windLoadKpa: number
  snowLoadKpa: number
  roofCoveringLoadKpa: number
  wallCoveringLoadKpa: number
  designSnowLoadKpa: number
  designWindLongKpa: number
  designWindShortKpa: number
  designWindPositiveKpa: number
  designWindForAxialLoadKpa: number
  designWindForMomentKpa: number
  designRoofCoveringLoadKpa: number
  designWallCoveringLoadKpa: number
  supportCraneVerticalLoadKn: number
  supportCraneMomentKnM: number
  hangingCraneVerticalLoadKn: number
  axialLoadKn: number
  bendingMomentKnM: number
  windHeightFactor: number
  windMomentFactor: number
}

type TerrainType = 'А' | 'В' | 'С'

const ELASTIC_MODULUS_MPA = 2.06 * 10 ** 5
const YIELD_COEFFICIENT = 0.95

const WIND_HEIGHT_TABLE = [
  { heightM: 5, kByTerrain: { А: 0.75, В: 0.5, С: 0.4 }, zetaByTerrain: { А: 0.85, В: 1.22, С: 1.78 } },
  { heightM: 10, kByTerrain: { А: 1, В: 0.65, С: 0.4 }, zetaByTerrain: { А: 0.76, В: 1.06, С: 1.78 } },
  { heightM: 20, kByTerrain: { А: 1.25, В: 0.85, С: 0.55 }, zetaByTerrain: { А: 0.69, В: 0.92, С: 1.5 } },
  { heightM: 40, kByTerrain: { А: 1.5, В: 1.1, С: 0.8 }, zetaByTerrain: { А: 0.62, В: 0.8, С: 1.26 } },
  { heightM: 60, kByTerrain: { А: 1.7, В: 1.3, С: 1 }, zetaByTerrain: { А: 0.58, В: 0.74, С: 1.14 } },
  { heightM: 80, kByTerrain: { А: 1.85, В: 1.45, С: 1.15 }, zetaByTerrain: { А: 0.56, В: 0.7, С: 1.06 } },
  { heightM: 100, kByTerrain: { А: 2, В: 1.6, С: 1.25 }, zetaByTerrain: { А: 0.54, В: 0.67, С: 1 } },
  { heightM: 150, kByTerrain: { А: 2.25, В: 1.9, С: 1.55 }, zetaByTerrain: { А: 0.51, В: 0.62, С: 0.9 } },
  { heightM: 200, kByTerrain: { А: 2.45, В: 2.1, С: 1.8 }, zetaByTerrain: { А: 0.49, В: 0.58, С: 0.84 } },
  { heightM: 250, kByTerrain: { А: 2.65, В: 2.3, С: 2 }, zetaByTerrain: { А: 0.47, В: 0.56, С: 0.8 } },
  { heightM: 300, kByTerrain: { А: 2.75, В: 2.5, С: 2.2 }, zetaByTerrain: { А: 0.46, В: 0.54, С: 0.76 } },
  { heightM: 350, kByTerrain: { А: 2.75, В: 2.75, С: 2.35 }, zetaByTerrain: { А: 0.46, В: 0.52, С: 0.73 } },
  { heightM: 480, kByTerrain: { А: 2.75, В: 2.75, С: 2.75 }, zetaByTerrain: { А: 0.46, В: 0.5, С: 0.68 } },
] as const

const NU_X_VALUES = [0.1, 5, 10, 20, 40, 80, 160] as const
const NU_Y_VALUES = [5, 10, 20, 40, 80, 160, 350] as const
const NU_GRID = [
  [0.95, 0.92, 0.88, 0.83, 0.76, 0.67, 0.56],
  [0.89, 0.87, 0.84, 0.8, 0.73, 0.65, 0.54],
  [0.85, 0.84, 0.81, 0.77, 0.71, 0.64, 0.53],
  [0.8, 0.78, 0.76, 0.73, 0.68, 0.61, 0.51],
  [0.72, 0.72, 0.7, 0.67, 0.63, 0.57, 0.48],
  [0.63, 0.63, 0.61, 0.59, 0.56, 0.51, 0.44],
  [0.53, 0.53, 0.52, 0.5, 0.47, 0.44, 0.38],
] as const

function degreesToRadians(value: number): number {
  return (value / 180) * Math.PI
}

function findCityLoad(city: string) {
  const record = columnCityLoads.find((item) => item.city === city)

  if (!record) {
    throw new Error(`Unknown column city load record: ${city}`)
  }

  return record
}

function findCovering(name: string) {
  const record = columnCoveringCatalog.find((item) => item.name === name)

  if (!record) {
    throw new Error(`Unknown column covering type: ${name}`)
  }

  return record
}

function resolveResponsibilityFactor(value: string): number {
  const parsed = Number(value.replace(',', '.'))

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Unsupported column responsibility level: ${value}`)
  }

  return parsed
}

function resolveTerrainType(value: string): TerrainType {
  if (value === 'А' || value === 'В' || value === 'С') {
    return value
  }

  throw new Error(`Unsupported column terrain type: ${value}`)
}

function interpolateByHeight(
  heightM: number,
  terrainType: TerrainType,
  key: 'kByTerrain' | 'zetaByTerrain',
): number {
  const exact = WIND_HEIGHT_TABLE.find((item) => item.heightM === heightM)

  if (exact) {
    return exact[key][terrainType]
  }

  for (let index = 0; index < WIND_HEIGHT_TABLE.length - 1; index += 1) {
    const left = WIND_HEIGHT_TABLE[index]
    const right = WIND_HEIGHT_TABLE[index + 1]

    if (heightM > left.heightM && heightM < right.heightM) {
      const leftValue = left[key][terrainType]
      const rightValue = right[key][terrainType]
      const ratio = (heightM - left.heightM) / (right.heightM - left.heightM)

      return leftValue + (rightValue - leftValue) * ratio
    }
  }

  throw new Error(`Height ${heightM} m is outside the supported wind interpolation range`)
}

function findBoundingPair(values: readonly number[] | number[], target: number): [number, number] {
  for (let index = 0; index < values.length - 1; index += 1) {
    const left = values[index]
    const right = values[index + 1]

    if (target === left) {
      return [left, right]
    }

    if (target > left && target < right) {
      return [left, right]
    }
  }

  const lastIndex = values.length - 1
  if (target === values[lastIndex]) {
    return [values[lastIndex - 1], values[lastIndex]]
  }

  throw new Error(`Target ${target} is outside interpolation bounds`)
}

function gridValue(x: number, y: number): number {
  const rowIndex = (Array.from(NU_X_VALUES) as number[]).indexOf(x)
  const columnIndex = (Array.from(NU_Y_VALUES) as number[]).indexOf(y)

  if (rowIndex === -1 || columnIndex === -1) {
    throw new Error(`Missing nu grid point x=${x}, y=${y}`)
  }

  return NU_GRID[rowIndex][columnIndex]
}

function interpolateNu(x: number, y: number): number {
  const [x0, x1] = findBoundingPair(NU_X_VALUES, x)
  const [y0, y1] = findBoundingPair(NU_Y_VALUES, y)
  const q11 = gridValue(x0, y0)
  const q12 = gridValue(x0, y1)
  const q21 = gridValue(x1, y0)
  const q22 = gridValue(x1, y1)
  const valueAtY0 = ((x - x0) / (x1 - x0)) * (q21 - q11) + q11
  const valueAtY1 = ((x - x0) / (x1 - x0)) * (q22 - q12) + q12

  return ((y1 - y) / (y1 - y0)) * (valueAtY1 - valueAtY0) + valueAtY0
}

function calculateWindZonePressure(
  windLoadKpa: number,
  kZe: number,
  zetaZe: number,
  aerodynamicCoefficient: number,
  nu: number,
): number {
  const averageComponent = Math.abs(windLoadKpa * kZe * aerodynamicCoefficient * 1.4)
  return averageComponent + averageComponent * zetaZe * nu
}

function resolveRoofTributaryArea(input: ColumnInput): number {
  if (input.columnType === 'крайняя') {
    return (input.spanM / 2) * input.frameStepM
  }

  if (input.columnType === 'средняя') {
    return input.spanM * input.frameStepM
  }

  return (input.facadeColumnStepM * input.frameStepM) / 2
}

function resolveWallTributaryArea(input: ColumnInput): number {
  if (input.columnType === 'фахверковая') {
    return input.buildingHeightM * input.facadeColumnStepM
  }

  return input.buildingHeightM * input.frameStepM
}

function resolveWindReductionFactor(input: ColumnInput): number {
  if (input.perimeterBracing === 'есть') {
    if (input.spansCount === 'один') {
      return input.columnType === 'фахверковая' ? 0.25 : 0.55
    }

    if (input.columnType === 'крайняя') {
      return 0.3
    }

    if (input.columnType === 'средняя') {
      return 0.1
    }

    return 0.25
  }

  if (input.spansCount === 'один') {
    return input.columnType === 'фахверковая' ? 0.25 : 1
  }

  if (input.columnType === 'крайняя') {
    return 0.9
  }

  if (input.columnType === 'средняя') {
    return 0.6
  }

  return 0.25
}

function resolveWindHeightFactor(input: ColumnInput): number {
  if (input.columnType === 'фахверковая') {
    return 0.7
  }

  if (input.spansCount === 'один') {
    return 2
  }

  return input.perimeterBracing === 'есть' ? 0.7 : 1.5
}

function resolveRoundedCraneSpanM(spanM: number): number {
  return Math.ceil(spanM / 6) * 6
}

function normalizeSupportCraneCapacity(value: string): string {
  return value.replace(/\s+/g, '').replace(',', '.')
}

function resolveSupportCraneRecord(input: ColumnInput) {
  const roundedSpanM = resolveRoundedCraneSpanM(input.spanM)
  const normalizedCapacity = normalizeSupportCraneCapacity(input.supportCraneCapacity)
  const record = columnSupportCraneCatalog.find(
    (item) =>
      normalizeSupportCraneCapacity(item.capacityLabel) === normalizedCapacity && item.spanM === roundedSpanM,
  )

  if (!record) {
    throw new Error(
      `Unsupported support crane combination: ${input.supportCraneCapacity} t / ${roundedSpanM} m`,
    )
  }

  return record
}

function resolveMultiSpanCraneFactor(input: ColumnInput, singleSpanMode: string): number {
  return input.spansCount === 'более одного' && input.columnType === 'средняя'
    ? singleSpanMode === 'нет'
      ? 2
      : 1
    : 1
}

function calculateSupportCraneVerticalLoadKn(input: ColumnInput): number {
  if (input.supportCraneMode !== 'есть') {
    return 0
  }

  const crane = resolveSupportCraneRecord(input)
  const wheelDistributionFactors = [
    1,
    (input.frameStepM - crane.baseM) / input.frameStepM,
  ]

  if (input.supportCraneCount === 'два') {
    wheelDistributionFactors.push((input.frameStepM - (crane.gaugeM - crane.baseM)) / input.frameStepM)
    wheelDistributionFactors.push((input.frameStepM - crane.gaugeM) / input.frameStepM)
  }

  return (
    crane.wheelLoadKn *
    wheelDistributionFactors.reduce((total, factor) => total + factor, 0) *
    1.3 *
    1.06 *
    resolveMultiSpanCraneFactor(input, input.supportCraneSingleSpanMode)
  )
}

function calculateSupportCraneMomentKnM(
  input: ColumnInput,
  supportCraneVerticalLoadKn: number,
): number {
  if (supportCraneVerticalLoadKn === 0) {
    return 0
  }

  const horizontalCraneLoadKn = 0.05 * supportCraneVerticalLoadKn
  const multiSpanFactor = resolveMultiSpanCraneFactor(input, input.supportCraneSingleSpanMode)

  if (input.columnType === 'средняя') {
    return supportCraneVerticalLoadKn * 0.75 / multiSpanFactor + horizontalCraneLoadKn * input.supportCraneRailLevelM
  }

  return supportCraneVerticalLoadKn * 0.75 + horizontalCraneLoadKn * input.supportCraneRailLevelM
}

function calculateHangingCraneVerticalLoadKn(input: ColumnInput): number {
  if (input.hangingCraneMode !== 'есть') {
    return 0
  }

  return (
    (input.hangingCraneCapacityT * 10 + 0.5 * 10) *
    1.2 *
    1.1 *
    resolveMultiSpanCraneFactor(input, input.hangingCraneSingleSpanMode)
  )
}

export function buildColumnDerivedContext(input: ColumnInput): ColumnDerivedContext {
  const cityLoad = findCityLoad(input.city)
  const roofCovering = findCovering(input.roofCoveringType)
  const wallCovering = findCovering(input.wallCoveringType)
  const responsibilityFactor = resolveResponsibilityFactor(input.responsibilityLevel)
  const terrainType = resolveTerrainType(input.terrainType)
  const kZe = interpolateByHeight(input.buildingHeightM, terrainType, 'kByTerrain')
  const zetaZe = interpolateByHeight(input.buildingHeightM, terrainType, 'zetaByTerrain')
  const nuLong = interpolateNu(0.4 * input.spanM, input.buildingHeightM)
  const nuShort = interpolateNu(0.4 * input.buildingLengthM, input.buildingHeightM)
  const designSnowLoadKpa =
    1.4 * 0.7 * cityLoad.snowLoadKpa * Math.cos(degreesToRadians(input.roofSlopeDeg)) * responsibilityFactor
  const designWindLongKpa = calculateWindZonePressure(cityLoad.windLoadKpa, kZe, zetaZe, -0.8, nuLong)
  const designWindShortKpa = calculateWindZonePressure(cityLoad.windLoadKpa, kZe, zetaZe, -0.8, nuShort)
  const designWindPositiveKpa = calculateWindZonePressure(cityLoad.windLoadKpa, kZe, zetaZe, 0.2, nuLong)
  const designRoofCoveringLoadKpa = roofCovering.loadKpa * responsibilityFactor
  const designWallCoveringLoadKpa = wallCovering.loadKpa * responsibilityFactor
  const roofTributaryArea = resolveRoofTributaryArea(input)
  const wallTributaryArea = resolveWallTributaryArea(input)
  const designWindForMomentKpa = Math.max(designWindLongKpa, designWindShortKpa) + designWindPositiveKpa
  const supportCraneVerticalLoadKn = calculateSupportCraneVerticalLoadKn(input)
  const supportCraneMomentKnM = calculateSupportCraneMomentKnM(input, supportCraneVerticalLoadKn)
  const hangingCraneVerticalLoadKn = calculateHangingCraneVerticalLoadKn(input)
  const axialLoadKn =
    (
      (designSnowLoadKpa + designWindPositiveKpa + designRoofCoveringLoadKpa) * roofTributaryArea +
      designWallCoveringLoadKpa * wallTributaryArea +
      supportCraneVerticalLoadKn
    ) *
      (1 + input.extraLoadPercent / 100) +
    hangingCraneVerticalLoadKn
  const effectiveWindSpacingM = input.columnType === 'фахверковая' ? input.facadeColumnStepM : input.frameStepM
  const bendingMomentKnM =
    (designWindForMomentKpa * effectiveWindSpacingM * input.buildingHeightM ** 2) / 2 *
      (input.columnType === 'фахверковая' ? 0.35 : resolveWindReductionFactor(input)) +
    supportCraneMomentKnM

  return {
    windLoadKpa: cityLoad.windLoadKpa,
    snowLoadKpa: cityLoad.snowLoadKpa,
    roofCoveringLoadKpa: roofCovering.loadKpa,
    wallCoveringLoadKpa: wallCovering.loadKpa,
    designSnowLoadKpa,
    designWindLongKpa,
    designWindShortKpa,
    designWindPositiveKpa,
    designWindForAxialLoadKpa: designWindPositiveKpa,
    designWindForMomentKpa,
    designRoofCoveringLoadKpa,
    designWallCoveringLoadKpa,
    supportCraneVerticalLoadKn,
    supportCraneMomentKnM,
    hangingCraneVerticalLoadKn,
    axialLoadKn,
    bendingMomentKnM,
    windHeightFactor: resolveWindHeightFactor(input),
    windMomentFactor: resolveWindReductionFactor(input),
  }
}

export const columnRankingConstants = {
  elasticModulusMpa: ELASTIC_MODULUS_MPA,
  yieldCoefficient: YIELD_COEFFICIENT,
} as const
