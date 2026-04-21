import type { EnclosingInput } from './enclosing-input'

interface UnifiedInputLike {
  roofType: string
  spanM: number
  buildingLengthM: number
  buildingHeightM: number
  frameStepM?: number
  roofPurlinStepM?: number
  roofSlopeDeg: number
  wallCoveringType: string
  roofCoveringType: string
  doubleDoorAreaM2?: number
  singleDoorCount?: number
  entranceBlockAreaM2?: number
  tambourDoorAreaM2?: number
  windowsAreaM2?: number
  gatesAreaM2?: number
}

const DEFAULT_WALL_PANEL_THICKNESS_MM = 100
const DEFAULT_ROOF_PANEL_THICKNESS_MM = 150
const DEFAULT_SINGLE_DOOR_AREA_M2 = 2
const DEFAULT_FRAME_STEP_M = 6
const DEFAULT_ROOF_PURLIN_STEP_M = 1.5

function normalizeNonNegative(value: unknown): number {
  if (typeof value !== 'number') {
    return 0
  }
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function parsePanelThicknessMm(covering: string, fallback: number): number {
  const match = covering.match(/(\d{2,3})/)
  if (!match) {
    return fallback
  }

  const thickness = Number(match[1])
  return Number.isFinite(thickness) && thickness > 0 ? thickness : fallback
}

function resolveOpeningsAreaM2(input: UnifiedInputLike): number {
  const singleDoorAreaM2 = normalizeNonNegative(input.singleDoorCount) * DEFAULT_SINGLE_DOOR_AREA_M2
  return (
    normalizeNonNegative(input.doubleDoorAreaM2) +
    singleDoorAreaM2 +
    normalizeNonNegative(input.entranceBlockAreaM2) +
    normalizeNonNegative(input.tambourDoorAreaM2) +
    normalizeNonNegative(input.windowsAreaM2) +
    normalizeNonNegative(input.gatesAreaM2)
  )
}

export function mapUnifiedInputToEnclosingInput(input: UnifiedInputLike): EnclosingInput {
  const frameStepM = normalizeNonNegative(input.frameStepM)
  const roofPurlinStepM = normalizeNonNegative(input.roofPurlinStepM)

  return {
    roofType: input.roofType,
    spanM: normalizeNonNegative(input.spanM),
    buildingLengthM: normalizeNonNegative(input.buildingLengthM),
    buildingHeightM: normalizeNonNegative(input.buildingHeightM),
    frameStepM: frameStepM > 0 ? frameStepM : DEFAULT_FRAME_STEP_M,
    roofPurlinStepM: roofPurlinStepM > 0 ? roofPurlinStepM : DEFAULT_ROOF_PURLIN_STEP_M,
    roofSlopeDeg: normalizeNonNegative(input.roofSlopeDeg),
    wallPanelThicknessMm: parsePanelThicknessMm(input.wallCoveringType, DEFAULT_WALL_PANEL_THICKNESS_MM),
    roofPanelThicknessMm: parsePanelThicknessMm(input.roofCoveringType, DEFAULT_ROOF_PANEL_THICKNESS_MM),
    openingsAreaM2: resolveOpeningsAreaM2(input),
  }
}
