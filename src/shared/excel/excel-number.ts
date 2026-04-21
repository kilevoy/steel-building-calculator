const DEFAULT_PRECISION = 15

export function normalizeExcelNumber(value: number, precision = DEFAULT_PRECISION): number {
  return Number.parseFloat(value.toPrecision(precision))
}

export function excelRound(value: number, digits = 0): number {
  const factor = 10 ** digits
  return normalizeExcelNumber(Math.round((value + Number.EPSILON) * factor) / factor)
}

export function excelRoundDown(value: number, digits = 0): number {
  const factor = 10 ** digits
  const scaled = value * factor
  return normalizeExcelNumber((scaled >= 0 ? Math.floor(scaled) : Math.ceil(scaled)) / factor)
}

export function excelRoundUp(value: number, digits = 0): number {
  const factor = 10 ** digits
  const scaled = value * factor
  return normalizeExcelNumber((scaled >= 0 ? Math.ceil(scaled) : Math.floor(scaled)) / factor)
}

export function excelClampMin(value: number, minValue: number): number {
  return value < minValue ? minValue : value
}
