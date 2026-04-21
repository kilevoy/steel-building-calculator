const STANDARD_GABLE_TRUSS_EAVE_DEPTH_BY_SPAN = new Map<number, number>([
  [12, 0.7],
  [15, 1],
  [18, 1.1],
  [21, 1.15],
  [24, 1.2],
  [27, 1.25],
  [30, 1.3],
  [33, 1.35],
  [36, 1.4],
  [40, 1.45],
  [45, 1.5],
])

export function getStandardGableTrussEaveDepthM(spanM: number): number | null {
  return STANDARD_GABLE_TRUSS_EAVE_DEPTH_BY_SPAN.get(spanM) ?? null
}
