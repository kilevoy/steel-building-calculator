import {
  purlinAutoStepCapacityTable,
  purlinNuGrid,
  purlinNuXValues,
  purlinNuYValues,
  purlinWindHeightTable,
} from '@/domain/purlin/model/purlin-reference.generated'
import type { PurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import type { PurlinInput } from '@/domain/purlin/model/purlin-input'

export interface PurlinWindDebug {
  kZe: number
  zetaZe: number
  nu: number
  averageComponent: number
}

function degreesToRadians(value: number): number {
  return (value / 180) * Math.PI
}

function resolveResponsibilityFactor(value: string): number {
  const numericValue = Number(value.replace(',', '.'))

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`Unsupported purlin responsibility level: ${value}`)
  }

  return numericValue
}

function lookupTerrainColumn(terrainType: string): 'А' | 'В' | 'С' {
  if (terrainType === 'А' || terrainType === 'В' || terrainType === 'С') {
    return terrainType
  }

  throw new Error(`Unsupported terrain type for purlin wind calculation: ${terrainType}`)
}

function interpolateByHeight(
  heightM: number,
  terrainType: 'А' | 'В' | 'С',
  key: 'kByTerrain' | 'zetaByTerrain',
): number {
  const rows = purlinWindHeightTable
  const exact = rows.find((item) => item.heightM === heightM)

  if (exact) {
    return exact[key][terrainType]
  }

  for (let index = 0; index < rows.length - 1; index += 1) {
    const left = rows[index]
    const right = rows[index + 1]

    if (heightM > left.heightM && heightM < right.heightM) {
      const leftValue = left[key][terrainType]
      const rightValue = right[key][terrainType]
      const ratio = (heightM - left.heightM) / (right.heightM - left.heightM)

      return leftValue + (rightValue - leftValue) * ratio
    }
  }

  throw new Error(`Height ${heightM} m is outside the supported wind interpolation range`)
}

function findBoundingPair(values: readonly number[], target: number): [number, number] {
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
  const rowIndex = (Array.from(purlinNuXValues) as number[]).indexOf(x)
  const columnIndex = (Array.from(purlinNuYValues) as number[]).indexOf(y)

  if (rowIndex === -1 || columnIndex === -1) {
    throw new Error(`Missing nu grid point x=${x}, y=${y}`)
  }

  return purlinNuGrid[rowIndex][columnIndex]
}

function interpolateNu(x: number, y: number): number {
  const [x0, x1] = findBoundingPair(purlinNuXValues, x)
  const [y0, y1] = findBoundingPair(purlinNuYValues, y)
  const q11 = gridValue(x0, y0)
  const q12 = gridValue(x0, y1)
  const q21 = gridValue(x1, y0)
  const q22 = gridValue(x1, y1)
  const valueAtY0 = ((x - x0) / (x1 - x0)) * (q21 - q11) + q11
  const valueAtY1 = ((x - x0) / (x1 - x0)) * (q22 - q12) + q12

  return ((y1 - y) / (y1 - y0)) * (valueAtY1 - valueAtY0) + valueAtY0
}

function calculateWindPressure(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
  aerodynamicCoefficient: number,
  windSpanM: number,
): number {
  const terrain = lookupTerrainColumn(input.terrainType)
  const kZe = interpolateByHeight(input.buildingHeightM, terrain, 'kByTerrain')
  const zetaZe = interpolateByHeight(input.buildingHeightM, terrain, 'zetaByTerrain')
  const nu = interpolateNu(0.4 * windSpanM, input.buildingHeightM)
  const averageComponent = Math.abs(derivedContext.windLoadKpa * kZe * aerodynamicCoefficient * 1.4)
  const responsibilityFactor = resolveResponsibilityFactor(input.responsibilityLevel)

  return (averageComponent + averageComponent * zetaZe * nu) * responsibilityFactor
}

export function calculatePurlinWindPressure(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  return calculateWindPressure(input, derivedContext, 0.2, input.spanM)
}

export function calculatePurlinFacadeWindPressure(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  return calculateWindPressure(input, derivedContext, -0.8, input.buildingLengthM)
}

export function debugPurlinWindComponents(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
): PurlinWindDebug {
  const terrain = lookupTerrainColumn(input.terrainType)
  const kZe = interpolateByHeight(input.buildingHeightM, terrain, 'kByTerrain')
  const zetaZe = interpolateByHeight(input.buildingHeightM, terrain, 'zetaByTerrain')
  const nu = interpolateNu(0.4 * input.spanM, input.buildingHeightM)
  const averageComponent = Math.abs(derivedContext.windLoadKpa * kZe * 0.2 * 1.4)

  return {
    kZe,
    zetaZe,
    nu,
    averageComponent,
  }
}

export function calculatePurlinDesignSnowLoad(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  const baseFactor =
    input.normativeMode === 'по СП РК EN'
      ? 1
      : derivedContext.hasSpRkEnCityFlag
        ? 1.4 * 0.7 * 1.13
        : 1.4 * 1.1 * 1.13

  return (
    baseFactor *
    derivedContext.snowBagFactor *
    derivedContext.snowLoadKpa *
    Math.cos(degreesToRadians(input.roofSlopeDeg)) *
    resolveResponsibilityFactor(input.responsibilityLevel)
  )
}

export function calculatePurlinServiceLoad(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  const responsibilityFactor = resolveResponsibilityFactor(input.responsibilityLevel)
  const snowFactor =
    input.normativeMode === 'по СП РК EN'
      ? 0.5 * 0.8
      : derivedContext.hasSpRkEnCityFlag
        ? 0.5 * 1 * 0.7
        : 0.5 * 1 * 1.1

  const serviceSnowLoad =
    snowFactor *
    derivedContext.snowLoadKpa *
    Math.cos(degreesToRadians(input.roofSlopeDeg)) *
    responsibilityFactor

  return serviceSnowLoad + (derivedContext.coveringLoadKpa * responsibilityFactor) / 1.2
}

export function calculatePurlinDesignLoad(input: PurlinInput, derivedContext: PurlinDerivedContext): number {
  return (
    calculatePurlinDesignSnowLoad(input, derivedContext) +
    calculatePurlinWindPressure(input, derivedContext) +
    derivedContext.coveringLoadKpa * resolveResponsibilityFactor(input.responsibilityLevel)
  )
}

export function calculatePurlinAutoMaxStepMm(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
): number {
  const lookupValue =
    (calculatePurlinDesignLoad(input, derivedContext) -
      derivedContext.coveringLoadKpa * resolveResponsibilityFactor(input.responsibilityLevel)) *
    1.15

  const matchingRow = [...purlinAutoStepCapacityTable].reverse().find((item) => {
    const capacity = item.capacityByIndex[derivedContext.autoStepIndex - 1]
    return capacity >= lookupValue
  })

  if (!matchingRow) {
    // Overload beyond table range: clamp to the minimum supported step
    // so selection stays conservative but still attempts profile matching.
    const minimumStepMm = purlinAutoStepCapacityTable.reduce(
      (minimum, row) => Math.min(minimum, row.stepMm),
      Number.POSITIVE_INFINITY,
    )

    return Number.isFinite(minimumStepMm) ? minimumStepMm : 0
  }

  return matchingRow.stepMm
}
