import { enclosingInputSchema, type EnclosingInput, type EnclosingInputRaw } from './enclosing-input'
import type {
  EnclosingAccessoryRow,
  EnclosingCalculationResult,
  EnclosingClassSpecification,
  EnclosingFastenerRow,
  EnclosingPanelSpecificationRow,
  EnclosingSealantRow,
  EnclosingSectionSpecification,
} from './enclosing-output'
import {
  ENCLOSING_CLASS_KEYS,
  enclosingAccessoriesReference,
  enclosingPanelPriceRubPerM2,
  type EnclosingClassKey,
} from './enclosing-reference.generated'
import { loadEnclosingPricingOverrides, type EnclosingPricingOverrideValues } from './enclosing-pricing-overrides'

const STEEL_DENSITY_KG_PER_M3 = 7850
const FACING_STEEL_THICKNESS_M = 0.0005
const PANEL_WORKING_WIDTH_M = 1

const ACCESSORY_BASE_FLAT_SHEET_PRICE_RUB_PER_M2 = 500
const STARTER_BASE_FLAT_SHEET_2MM_PRICE_RUB_PER_M2 = 1559.76

const HARPOON_PANEL_FASTENER_PRICE_RUB_BY_LENGTH_MM: Record<number, number> = {
  105: 39.1,
  115: 43.1,
  140: 51.9,
  160: 71.1,
  190: 94.8,
  240: 145.7,
  285: 188.9,
  350: 271.2,
}
const ACCESSORY_FASTENER_PRICE_RUB = 4.55
const ACCESSORY_FASTENER_LENGTH_MM = 28
const SOCLE_ANCHOR_BOLT_LENGTH_MM = 100
const SOCLE_ANCHOR_BOLT_PRICE_RUB = 35
const SOCLE_ANCHOR_STEP_M = 0.6
const LOCK_GASKET_PACK_LENGTH_M = 30
const LOCK_GASKET_PACK_PRICE_RUB = 90
const ROOF_PROFILE_GASKET_PIECE_LENGTH_M = 1
const ROOF_PROFILE_GASKET_PRICE_RUB = 55

const WALL_PANEL_FASTENERS_PER_ROW = 3
const WALL_PANEL_FASTENER_ROWS_PER_PANEL = 2
const FACADE_FASTENER_STEP_M = 0.3
const ROOF_PANEL_FASTENER_STEP_ACROSS_WIDTH_M = 0.5
const ROOF_PANEL_FASTENER_STEP_EAVE_M = 0.25
const ROOF_LAP_FASTENER_STEP_M = 0.5
const DEFAULT_ROOF_PURLIN_STEP_M = 1.5

const WALL_FASTENER_LENGTH_MM_BY_THICKNESS_ATR: Record<number, number> = {
  50: 115,
  60: 115,
  80: 140,
  100: 170,
  120: 190,
  150: 210,
  170: 240,
  180: 240,
  200: 285,
  250: 305,
}
const ROOF_FASTENER_LENGTH_MM_BY_THICKNESS_ATR: Record<number, number> = {
  50: 140,
  60: 170,
  80: 190,
  100: 190,
  120: 210,
  150: 240,
  170: 285,
  180: 285,
  200: 285,
  250: 305,
}

const WALL_JOINT_COVER_FI11_DEV_WIDTH_M = 0.208
const WALL_OUTER_CORNER_FI10_DEV_WIDTH_M_BY_THICKNESS: Record<number, number> = {
  50: 0.416,
  80: 0.469,
  100: 0.469,
  120: 0.5,
  150: 0.625,
  200: 0.664,
  250: 0.75,
}
const WALL_STARTER_FIU6_DEV_WIDTH_M_BY_THICKNESS: Record<number, number> = {
  50: 0.111,
  80: 0.141,
  100: 0.161,
  120: 0.181,
  150: 0.211,
  200: 0.261,
  250: 0.311,
}
const WALL_STARTER_FIU6_THICKNESS_MM = 2.0
const WALL_SOCLE_DRIP_DEV_WIDTH_M = 0.07
const WALL_SOCLE_DRIP_LENGTH_M = 2
const WALL_SOCLE_DRIP_PRICE_RUB_PER_PIECE = 765

const ROOF_RIDGE_FI28_DEV_WIDTH_M = 0.416
const ROOF_RIDGE_FI29_DEV_WIDTH_M = 0.178
const ROOF_EAVE_FI35_DEV_WIDTH_M_BY_THICKNESS: Record<number, number> = {
  50: 0.178,
  80: 0.208,
  100: 0.25,
  120: 0.25,
  150: 0.312,
  200: 0.312,
  250: 0.36,
}
const ROOF_EAVE_CORNER_FI7_DEV_WIDTH_M = 0.156
const ROOF_END_FI34_DEV_WIDTH_M_BY_THICKNESS: Record<number, number> = {
  50: 0.625,
  80: 0.625,
  100: 0.625,
  120: 0.625,
  150: 0.625,
  200: 0.834,
  250: 0.834,
}

interface EnclosingPricingRuntime {
  accessoryBaseFlatSheetPriceRubPerM2: number
  starterBaseFlatSheet2mmPriceRubPerM2: number
  harpoonPanelFastenerPriceRubByLengthMm: Record<number, number>
  accessoryFastenerPriceRub: number
  lockGasketPackPriceRub: number
  roofProfileGasketPriceRub: number
  wallSocleDripPriceRubPerPiece: number
  socleAnchorBoltPriceRub: number
}

function resolveEnclosingPricingRuntime(): EnclosingPricingRuntime {
  const stored = loadEnclosingPricingOverrides()?.values ?? {}
  const typed = stored as Partial<EnclosingPricingOverrideValues>

  return {
    accessoryBaseFlatSheetPriceRubPerM2:
      typed.accessoryBaseFlatSheetPriceRubPerM2 ?? ACCESSORY_BASE_FLAT_SHEET_PRICE_RUB_PER_M2,
    starterBaseFlatSheet2mmPriceRubPerM2:
      typed.starterBaseFlatSheet2mmPriceRubPerM2 ?? STARTER_BASE_FLAT_SHEET_2MM_PRICE_RUB_PER_M2,
    harpoonPanelFastenerPriceRubByLengthMm: {
      ...HARPOON_PANEL_FASTENER_PRICE_RUB_BY_LENGTH_MM,
      ...(typed.harpoonPanelFastenerPriceRubByLengthMm ?? {}),
    },
    accessoryFastenerPriceRub: typed.accessoryFastenerPriceRub ?? ACCESSORY_FASTENER_PRICE_RUB,
    lockGasketPackPriceRub: typed.lockGasketPackPriceRub ?? LOCK_GASKET_PACK_PRICE_RUB,
    roofProfileGasketPriceRub: typed.roofProfileGasketPriceRub ?? ROOF_PROFILE_GASKET_PRICE_RUB,
    wallSocleDripPriceRubPerPiece: typed.wallSocleDripPriceRubPerPiece ?? WALL_SOCLE_DRIP_PRICE_RUB_PER_PIECE,
    socleAnchorBoltPriceRub: typed.socleAnchorBoltPriceRub ?? SOCLE_ANCHOR_BOLT_PRICE_RUB,
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function roundRub(value: number): number {
  return Math.round(value)
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function isGableRoof(roofType: string): boolean {
  const normalized = normalizeText(roofType)
  return normalized.includes('двуск') || normalized.includes('gable')
}

function resolveRoofAreaM2(input: EnclosingInput): number {
  const angleRad = toRadians(input.roofSlopeDeg)
  const cosine = Math.max(Math.cos(angleRad), 0.2)
  return (input.spanM * input.buildingLengthM) / cosine
}

function resolveWallAreaGrossM2(input: EnclosingInput): number {
  const perimeterArea = 2 * (input.spanM + input.buildingLengthM) * input.buildingHeightM
  if (!isGableRoof(input.roofType)) {
    return perimeterArea
  }

  const riseM = (input.spanM / 2) * Math.tan(toRadians(input.roofSlopeDeg))
  return perimeterArea + input.spanM * riseM
}

function resolveRoofPanelLengthM(input: EnclosingInput): number {
  const angleRad = toRadians(input.roofSlopeDeg)
  const cosine = Math.max(Math.cos(angleRad), 0.2)
  return isGableRoof(input.roofType) ? input.spanM / (2 * cosine) : input.spanM / cosine
}

function resolveNearestThickness(availableThicknesses: number[], requestedThicknessMm: number): number {
  return availableThicknesses
    .slice()
    .sort((left, right) => left - right)
    .reduce((best, current) => {
      const bestDelta = Math.abs(best - requestedThicknessMm)
      const currentDelta = Math.abs(current - requestedThicknessMm)
      if (currentDelta < bestDelta) {
        return current
      }
      if (currentDelta === bestDelta) {
        return Math.min(best, current)
      }
      return best
    })
}

function resolveClosestNotLess(availableValues: number[], requestedValue: number): number {
  const sorted = availableValues.slice().sort((left, right) => left - right)
  const resolved = sorted.find((value) => value >= requestedValue)
  return resolved ?? sorted[sorted.length - 1] ?? 0
}

function resolvePricedThickness(
  table: Record<number, number>,
  requestedThicknessMm: number,
): { requestedThicknessMm: number; resolvedThicknessMm: number; unitPriceRubPerM2: number } {
  const thicknesses = Object.keys(table).map(Number)
  const resolvedThicknessMm = table[requestedThicknessMm]
    ? requestedThicknessMm
    : resolveNearestThickness(thicknesses, requestedThicknessMm)

  return {
    requestedThicknessMm,
    resolvedThicknessMm,
    unitPriceRubPerM2: table[resolvedThicknessMm] ?? table[thicknesses[0] ?? 0] ?? 0,
  }
}

function resolveFastenerLengthByThickness(table: Record<number, number>, requestedThicknessMm: number) {
  const thicknesses = Object.keys(table).map(Number)
  const resolvedThicknessMm = table[requestedThicknessMm]
    ? requestedThicknessMm
    : resolveClosestNotLess(thicknesses, requestedThicknessMm)

  return {
    requestedThicknessMm,
    resolvedThicknessMm,
    lengthMm: table[resolvedThicknessMm] ?? 0,
  }
}

function resolveFastenerPriceByLength(table: Record<number, number>, requestedLengthMm: number) {
  const lengths = Object.keys(table).map(Number)
  const resolvedLengthMm = table[requestedLengthMm]
    ? requestedLengthMm
    : resolveClosestNotLess(lengths, requestedLengthMm)

  return {
    requestedLengthMm,
    resolvedLengthMm,
    unitPriceRub: table[resolvedLengthMm] ?? table[lengths[0] ?? 0] ?? 0,
  }
}

function resolveDevelopedWidthByThickness(table: Record<number, number>, requestedThicknessMm: number): number {
  const thicknesses = Object.keys(table).map(Number)
  const resolvedThicknessMm = resolveClosestNotLess(thicknesses, requestedThicknessMm)
  return table[resolvedThicknessMm] ?? 0
}

function calcFacingSteelMassKgPerM2(): number {
  return 2 * FACING_STEEL_THICKNESS_M * STEEL_DENSITY_KG_PER_M3
}

function calcUnitMassKgPerM2(densityKgPerM3: number, thicknessMm: number): number {
  const coreMass = densityKgPerM3 * (thicknessMm / 1000)
  return coreMass + calcFacingSteelMassKgPerM2()
}

function calcPanelsCount(areaM2: number, panelLengthM: number, panelWorkingWidthM = PANEL_WORKING_WIDTH_M): number {
  const panelArea = panelWorkingWidthM * Math.max(panelLengthM, 0.1)
  if (panelArea <= 0) {
    return 0
  }
  return Math.max(1, Math.ceil(areaM2 / panelArea))
}

function calcRoofFastenersPerSupportLine(panelWorkingWidthM = PANEL_WORKING_WIDTH_M): number {
  return Math.max(2, Math.floor(panelWorkingWidthM / ROOF_PANEL_FASTENER_STEP_ACROSS_WIDTH_M) + 1)
}

function calcRoofFastenersPerEaveLine(panelWorkingWidthM = PANEL_WORKING_WIDTH_M): number {
  return Math.max(3, Math.floor(panelWorkingWidthM / ROOF_PANEL_FASTENER_STEP_EAVE_M) + 1)
}

function calcRoofSupportLinesPerPanel(panelLengthM: number, purlinStepM: number): number {
  const safeStepM = purlinStepM > 0 ? purlinStepM : DEFAULT_ROOF_PURLIN_STEP_M
  return Math.max(2, Math.ceil(panelLengthM / safeStepM) + 1)
}

function calcAccessoryRow(
  key: string,
  section: 'walls' | 'roof',
  item: string,
  lengthM: number,
  developedWidthM: number,
  derivedUnitPriceRubPerM2: number,
): EnclosingAccessoryRow | null {
  if (lengthM <= 0 || developedWidthM <= 0) {
    return null
  }
  const areaM2 = lengthM * developedWidthM
  return {
    key,
    section,
    item,
    unit: 'м2',
    requiredLengthM: lengthM,
    quantity: areaM2,
    developedWidthM,
    unitPriceRub: roundRub(derivedUnitPriceRubPerM2),
    totalRub: roundRub(areaM2 * derivedUnitPriceRubPerM2),
    note: 'Расчет по площади фасонного изделия (развертка × длина).',
  }
}

function calcRollSealantRow(
  key: string,
  section: 'walls' | 'roof',
  item: string,
  requiredLengthM: number,
  packLengthM: number,
  packPriceRub: number,
): EnclosingSealantRow | null {
  if (requiredLengthM <= 0 || packLengthM <= 0) {
    return null
  }
  const quantity = Math.max(1, Math.ceil(requiredLengthM / packLengthM))
  return {
    key,
    section,
    item,
    unit: 'уп.',
    quantity,
    unitPriceRub: packPriceRub,
    totalRub: roundRub(quantity * packPriceRub),
    note: `Расчет по длине ${requiredLengthM.toFixed(2)} м.п., упаковка ${packLengthM} м.`,
  }
}

function calcPieceSealantRow(
  key: string,
  section: 'walls' | 'roof',
  item: string,
  requiredLengthM: number,
  pieceLengthM: number,
  piecePriceRub: number,
): EnclosingSealantRow | null {
  if (requiredLengthM <= 0 || pieceLengthM <= 0) {
    return null
  }
  const quantity = Math.max(1, Math.ceil(requiredLengthM / pieceLengthM))
  return {
    key,
    section,
    item,
    unit: 'шт',
    quantity,
    unitPriceRub: piecePriceRub,
    totalRub: roundRub(quantity * piecePriceRub),
    note: `Расчет по длине ${requiredLengthM.toFixed(2)} м.п., элемент ${pieceLengthM} м.`,
  }
}

function sumRub<T extends { totalRub: number }>(rows: T[]): number {
  return rows.reduce((sum, row) => sum + row.totalRub, 0)
}

function sumMass<T extends { totalMassKg: number }>(rows: T[]): number {
  return rows.reduce((sum, row) => sum + row.totalMassKg, 0)
}

function buildSectionSpecification(params: {
  classKey: EnclosingClassKey
  classLabel: string
  section: 'walls' | 'roof'
  densityKgPerM3: number
  requestedThicknessMm: number
  areaM2: number
  panelLengthM: number
  standard: string
  panelType: string
  mark: string
  workingWidthMm: string
  unit: string
  priceTable: Record<number, number>
  accessoryRows: EnclosingAccessoryRow[]
  sealantRows: EnclosingSealantRow[]
  panelWorkingWidthM?: number
  panelFastenerLengthByThicknessMm: Record<number, number>
  panelFastenerPriceRubByLengthMm: Record<number, number>
  accessoryFastenerPriceRub: number
  panelFastenerQuantity: number
  accessoryFastenerQuantity: number
  extraFastenerRows?: EnclosingFastenerRow[]
  notes: string[]
}): EnclosingSectionSpecification {
  const priced = resolvePricedThickness(params.priceTable, params.requestedThicknessMm)
  if (priced.requestedThicknessMm !== priced.resolvedThicknessMm) {
    params.notes.push(
      `${params.classLabel}: для раздела ${params.section === 'walls' ? 'стены' : 'кровля'} толщина ${priced.requestedThicknessMm} мм заменена на ${priced.resolvedThicknessMm} мм.`,
    )
  }

  const unitMassKgPerM2 = calcUnitMassKgPerM2(params.densityKgPerM3, priced.resolvedThicknessMm)
  const panelSpecification: EnclosingPanelSpecificationRow[] = [
    {
      key: `${params.classKey}-${params.section}-panel`,
      section: params.section,
      classKey: params.classKey,
      classLabel: params.classLabel,
      panelType: params.panelType,
      mark: params.mark,
      workingWidthMm: params.workingWidthMm,
      unit: params.unit,
      thicknessMm: priced.resolvedThicknessMm,
      standard: params.standard,
      densityKgPerM3: params.densityKgPerM3,
      areaM2: params.areaM2,
      panelLengthM: params.panelLengthM,
      panelsCount: calcPanelsCount(params.areaM2, params.panelLengthM, params.panelWorkingWidthM ?? PANEL_WORKING_WIDTH_M),
      unitMassKgPerM2,
      totalMassKg: params.areaM2 * unitMassKgPerM2,
      unitPriceRubPerM2: priced.unitPriceRubPerM2,
      totalRub: roundRub(params.areaM2 * priced.unitPriceRubPerM2),
    },
  ]

  const accessories = params.accessoryRows
  const sealants = params.sealantRows
  const panelFastener = resolveFastenerLengthByThickness(
    params.panelFastenerLengthByThicknessMm,
    priced.resolvedThicknessMm,
  )
  const panelFastenerPrice = resolveFastenerPriceByLength(
    params.panelFastenerPriceRubByLengthMm,
    panelFastener.lengthMm,
  )
  if (panelFastener.requestedThicknessMm !== panelFastener.resolvedThicknessMm) {
    params.notes.push(
      `${params.classLabel}: для крепежа раздела ${params.section === 'walls' ? 'стены' : 'кровля'} применена ближайшая большая толщина ${panelFastener.resolvedThicknessMm} мм вместо ${panelFastener.requestedThicknessMm} мм.`,
    )
  }
  if (panelFastenerPrice.requestedLengthMm !== panelFastenerPrice.resolvedLengthMm) {
    params.notes.push(
      `${params.classLabel}: для крепежа раздела ${params.section === 'walls' ? 'стены' : 'кровля'} применена ближайшая большая длина ${panelFastenerPrice.resolvedLengthMm} мм вместо ${panelFastenerPrice.requestedLengthMm} мм (по доступным позициям прайса).`,
    )
  }

  const fasteners: EnclosingFastenerRow[] = [
    {
      key: `${params.classKey}-${params.section}-panel-fastener`,
      section: params.section,
      item:
        params.section === 'walls'
          ? 'Самонарезающий винт с ЭПДМ-прокладкой для МП ТСП-Z (по АТР ТСП)'
          : 'Самонарезающий винт с ЭПДМ-прокладкой для МП ТСП-К (по АТР ТСП)',
      unit: 'шт',
      quantity: params.panelFastenerQuantity,
      lengthMm: panelFastenerPrice.resolvedLengthMm,
      unitPriceRub: panelFastenerPrice.unitPriceRub,
      totalRub: roundRub(params.panelFastenerQuantity * panelFastenerPrice.unitPriceRub),
      note: 'Количество и длина подбираются по АТР/техкаталогу ТСП; цена по прайсу №12.4 (Гарпун).',
    },
    {
      key: `${params.classKey}-${params.section}-accessory-fastener`,
      section: params.section,
      item: 'Саморез Ø4,8х19(28) с ЭПДМ-прокладкой для крепления фасонных изделий (по АТР ТСП)',
      unit: 'шт',
      quantity: params.accessoryFastenerQuantity,
      lengthMm: ACCESSORY_FASTENER_LENGTH_MM,
      unitPriceRub: params.accessoryFastenerPriceRub,
      totalRub: roundRub(params.accessoryFastenerQuantity * params.accessoryFastenerPriceRub),
      note: 'Шаг крепления фасонных элементов принят 300 мм по узлам АТР ТСП.',
    },
  ]
  if (params.extraFastenerRows && params.extraFastenerRows.length > 0) {
    fasteners.push(...params.extraFastenerRows)
  }

  const panelsRub = sumRub(panelSpecification)
  const accessoriesRub = sumRub(accessories)
  const sealantsRub = sumRub(sealants)
  const fastenersRub = sumRub(fasteners)

  return {
    panelSpecification,
    accessories,
    sealants,
    fasteners,
    totals: {
      panelsRub,
      accessoriesRub,
      sealantsRub,
      fastenersRub,
      sectionRub: panelsRub + accessoriesRub + sealantsRub + fastenersRub,
      panelMassKg: sumMass(panelSpecification),
    },
  }
}

function buildClassSpecification(params: {
  classKey: EnclosingClassKey
  input: EnclosingInput
  wallAreaNetM2: number
  roofAreaM2: number
  roofPanelLengthM: number
  roofPurlinStepM: number
  pricing: EnclosingPricingRuntime
  derivedAccessoryPriceRubPerM2: number
  selectedWallWorkingWidthMm: number
  notes: string[]
}): EnclosingClassSpecification {
  const classLabel = params.classKey === 'class-1-gost' ? 'Класс 1' : 'Класс 2'
  const densityKgPerM3 = params.classKey === 'class-1-gost' ? 105 : 95

  const wallWorkingWidthM = params.selectedWallWorkingWidthMm / 1000
  const perimeterM = 2 * (params.input.spanM + params.input.buildingLengthM)
  const wallRowsCount = Math.max(1, Math.ceil(params.input.buildingHeightM / wallWorkingWidthM))
  const wallHorizontalLockJointLengthM = perimeterM * Math.max(0, wallRowsCount - 1)
  const wallPanelLengthM = Math.max(params.input.frameStepM, 0.1)
  const longWallPanelsPerRow = Math.max(1, Math.ceil(params.input.buildingLengthM / wallPanelLengthM))
  const shortWallPanelsPerRow = Math.max(1, Math.ceil(params.input.spanM / wallPanelLengthM))
  const wallVerticalJointLinesCount =
    2 * Math.max(0, longWallPanelsPerRow - 1) + 2 * Math.max(0, shortWallPanelsPerRow - 1)
  const wallVerticalStitchJointLengthM = wallVerticalJointLinesCount * params.input.buildingHeightM
  const wallPanelsCount = calcPanelsCount(params.wallAreaNetM2, params.input.frameStepM, wallWorkingWidthM)

  const wallAccessories = [
    calcAccessoryRow(
      `${params.classKey}-walls-starter-fiu6`,
      'walls',
      `Стартовая планка (опорный элемент ФИУ6хA, t=${WALL_STARTER_FIU6_THICKNESS_MM.toFixed(1).replace('.', ',')} мм, узел 1.3.4, АТР ТСП)`,
      perimeterM,
      resolveDevelopedWidthByThickness(WALL_STARTER_FIU6_DEV_WIDTH_M_BY_THICKNESS, params.input.wallPanelThicknessMm),
      params.pricing.starterBaseFlatSheet2mmPriceRubPerM2 * enclosingAccessoriesReference.flatSheetMultiplier,
    ),
    calcAccessoryRow(
      `${params.classKey}-walls-joint-cover`,
      'walls',
      'Нащельник стыка ФИ11 (узел 1.2.3, АТР ТСП)',
      wallVerticalStitchJointLengthM,
      WALL_JOINT_COVER_FI11_DEV_WIDTH_M,
      params.derivedAccessoryPriceRubPerM2,
    ),
    calcAccessoryRow(
      `${params.classKey}-walls-outer-corner`,
      'walls',
      'Угловой элемент наружный ФИ10хA (узел 1.5.2/1.5.4, АТР ТСП)',
      4 * params.input.buildingHeightM,
      resolveDevelopedWidthByThickness(WALL_OUTER_CORNER_FI10_DEV_WIDTH_M_BY_THICKNESS, params.input.wallPanelThicknessMm),
      params.derivedAccessoryPriceRubPerM2,
    ),
    calcAccessoryRow(
      `${params.classKey}-walls-socle-drip`,
      'walls',
      'Планка отлива цоколя 50х20х2000 (прайс №3.5)',
      perimeterM,
      WALL_SOCLE_DRIP_DEV_WIDTH_M,
      params.pricing.wallSocleDripPriceRubPerPiece / (WALL_SOCLE_DRIP_LENGTH_M * WALL_SOCLE_DRIP_DEV_WIDTH_M),
    ),
  ].filter((row): row is EnclosingAccessoryRow => row !== null)

  const wallSealants = [
    calcRollSealantRow(
      `${params.classKey}-walls-lock-gasket`,
      'walls',
      'Уплотнитель замкового соединения ТСП (8 мм x 30 м)',
      wallHorizontalLockJointLengthM,
      LOCK_GASKET_PACK_LENGTH_M,
      params.pricing.lockGasketPackPriceRub,
    ),
  ].filter((row): row is EnclosingSealantRow => row !== null)

  const roofEdgeLengthM = isGableRoof(params.input.roofType)
    ? 4 * params.roofPanelLengthM
    : 2 * params.roofPanelLengthM

  const roofAccessories = [
    calcAccessoryRow(
      `${params.classKey}-roof-ridge-fi28`,
      'roof',
      'Стыковочный элемент конька ФИ28 (узел 3.2, АТР ТСП)',
      isGableRoof(params.input.roofType) ? params.input.buildingLengthM : 0,
      ROOF_RIDGE_FI28_DEV_WIDTH_M,
      params.derivedAccessoryPriceRubPerM2,
    ),
    calcAccessoryRow(
      `${params.classKey}-roof-ridge-fi29`,
      'roof',
      'Стыковочный элемент конька ФИ29 (узел 3.2, АТР ТСП)',
      isGableRoof(params.input.roofType) ? params.input.buildingLengthM : 0,
      ROOF_RIDGE_FI29_DEV_WIDTH_M,
      params.derivedAccessoryPriceRubPerM2,
    ),
    calcAccessoryRow(
      `${params.classKey}-roof-eave-fi35`,
      'roof',
      'Стыковочный элемент карниза ФИ35хA (узел 3.4.4/3.4.6, АТР ТСП)',
      2 * params.input.buildingLengthM,
      resolveDevelopedWidthByThickness(ROOF_EAVE_FI35_DEV_WIDTH_M_BY_THICKNESS, params.input.roofPanelThicknessMm),
      params.derivedAccessoryPriceRubPerM2,
    ),
    calcAccessoryRow(
      `${params.classKey}-roof-eave-fi7`,
      'roof',
      'Угловой элемент карниза ФИ7 (узел 3.4.4/3.4.6, АТР ТСП)',
      2 * params.input.buildingLengthM,
      ROOF_EAVE_CORNER_FI7_DEV_WIDTH_M,
      params.derivedAccessoryPriceRubPerM2,
    ),
    calcAccessoryRow(
      `${params.classKey}-roof-end`,
      'roof',
      'Стыковочный элемент торца ФИ34хA (узел 3.4.3, АТР ТСП)',
      roofEdgeLengthM,
      resolveDevelopedWidthByThickness(ROOF_END_FI34_DEV_WIDTH_M_BY_THICKNESS, params.input.roofPanelThicknessMm),
      params.derivedAccessoryPriceRubPerM2,
    ),
  ].filter((row): row is EnclosingAccessoryRow => row !== null)

  const roofSlopesCount = isGableRoof(params.input.roofType) ? 2 : 1
  const roofPanelsPerSlope = Math.max(1, Math.ceil(params.input.buildingLengthM / PANEL_WORKING_WIDTH_M))
  const roofLockJointLengthM = roofSlopesCount * Math.max(0, roofPanelsPerSlope - 1) * params.roofPanelLengthM
  const ridgeLengthM = isGableRoof(params.input.roofType) ? params.input.buildingLengthM : 0
  const eaveLengthM = 2 * params.input.buildingLengthM

  const roofSealants = [
    calcRollSealantRow(
      `${params.classKey}-roof-lock-gasket`,
      'roof',
      'Уплотнитель замкового соединения ТСП (8 мм x 30 м)',
      roofLockJointLengthM,
      LOCK_GASKET_PACK_LENGTH_M,
      params.pricing.lockGasketPackPriceRub,
    ),
    calcPieceSealantRow(
      `${params.classKey}-roof-profile-gasket-a`,
      'roof',
      'Уплотнитель МП ТСП-К-А',
      ridgeLengthM,
      ROOF_PROFILE_GASKET_PIECE_LENGTH_M,
      params.pricing.roofProfileGasketPriceRub,
    ),
    calcPieceSealantRow(
      `${params.classKey}-roof-profile-gasket-b`,
      'roof',
      'Уплотнитель МП ТСП-К-В',
      eaveLengthM,
      ROOF_PROFILE_GASKET_PIECE_LENGTH_M,
      params.pricing.roofProfileGasketPriceRub,
    ),
  ].filter((row): row is EnclosingSealantRow => row !== null)

  const wallAccessoryLengthM = wallAccessories.reduce((sum, row) => sum + row.requiredLengthM, 0)
  const roofAccessoryLengthM = roofAccessories.reduce((sum, row) => sum + row.requiredLengthM, 0)

  const wallPanelFastenerQuantity =
    wallPanelsCount * WALL_PANEL_FASTENERS_PER_ROW * WALL_PANEL_FASTENER_ROWS_PER_PANEL
  const wallAccessoryFastenerQuantity = Math.ceil(wallAccessoryLengthM / FACADE_FASTENER_STEP_M)
  const wallSocleAnchorQuantity = Math.ceil(perimeterM / SOCLE_ANCHOR_STEP_M)
  const wallExtraFastenerRows: EnclosingFastenerRow[] =
    wallSocleAnchorQuantity > 0
      ? [
          {
            key: `${params.classKey}-walls-socle-anchor-bolt`,
            section: 'walls',
            item: 'Анкерный болт 10х100 для крепления опорного элемента/отлива цоколя',
            unit: 'шт',
            quantity: wallSocleAnchorQuantity,
            lengthMm: SOCLE_ANCHOR_BOLT_LENGTH_MM,
            unitPriceRub: params.pricing.socleAnchorBoltPriceRub,
            totalRub: roundRub(wallSocleAnchorQuantity * params.pricing.socleAnchorBoltPriceRub),
            note: 'Шаг 600 мм по узлам АТР ТСП; цена по прайсу анкеров.',
          },
        ]
      : []

  const roofPanelsCount = calcPanelsCount(params.roofAreaM2, params.roofPanelLengthM, PANEL_WORKING_WIDTH_M)
  const roofSupportLinesPerPanel = calcRoofSupportLinesPerPanel(params.roofPanelLengthM, params.roofPurlinStepM)
  const roofFastenersPerSupportLine = calcRoofFastenersPerSupportLine(PANEL_WORKING_WIDTH_M)
  const roofFastenersPerEaveLine = calcRoofFastenersPerEaveLine(PANEL_WORKING_WIDTH_M)
  const roofPanelFastenerQuantity =
    roofPanelsCount *
    (Math.max(1, roofSupportLinesPerPanel - 1) * roofFastenersPerSupportLine + roofFastenersPerEaveLine)
  const roofAccessoryFastenerQuantity = Math.ceil(roofAccessoryLengthM / FACADE_FASTENER_STEP_M)

  const roofOverlapLengthM = roofSlopesCount * Math.max(0, roofPanelsPerSlope - 1) * params.roofPanelLengthM
  const roofLapFastenerQuantity = Math.ceil(roofOverlapLengthM / ROOF_LAP_FASTENER_STEP_M)
  const roofLapFastenerRows: EnclosingFastenerRow[] =
    roofLapFastenerQuantity > 0
      ? [
          {
            key: `${params.classKey}-roof-lap-fastener`,
            section: 'roof',
            item: 'Саморез Ø4,8х28 с ЭПДМ-прокладкой для крепления панелей по нахлесту',
            unit: 'шт',
            quantity: roofLapFastenerQuantity,
            lengthMm: ACCESSORY_FASTENER_LENGTH_MM,
            unitPriceRub: params.pricing.accessoryFastenerPriceRub,
            totalRub: roundRub(roofLapFastenerQuantity * params.pricing.accessoryFastenerPriceRub),
            note: 'Шаг крепления по нахлесточному гофру не более 500 мм (Техкаталог ТСП, п.7.9.11).',
          },
        ]
      : []

  const walls = buildSectionSpecification({
    classKey: params.classKey,
    classLabel,
    section: 'walls',
    densityKgPerM3,
    requestedThicknessMm: params.input.wallPanelThicknessMm,
    areaM2: params.wallAreaNetM2,
    panelLengthM: params.input.frameStepM,
    standard: params.classKey === 'class-1-gost' ? 'ГОСТ 32603-2021, класс 1' : 'ГОСТ 32603-2021, класс 2',
    panelType: 'Стеновая трехслойная сэндвич-панель с видимым креплением Z-Lock',
    mark: 'МП ТСП-Z',
    workingWidthMm: String(params.selectedWallWorkingWidthMm),
    unit: 'м2',
    priceTable: enclosingPanelPriceRubPerM2[params.classKey].wallZLock,
    accessoryRows: wallAccessories,
    sealantRows: wallSealants,
    panelWorkingWidthM: wallWorkingWidthM,
    panelFastenerLengthByThicknessMm: WALL_FASTENER_LENGTH_MM_BY_THICKNESS_ATR,
    panelFastenerPriceRubByLengthMm: params.pricing.harpoonPanelFastenerPriceRubByLengthMm,
    accessoryFastenerPriceRub: params.pricing.accessoryFastenerPriceRub,
    panelFastenerQuantity: wallPanelFastenerQuantity,
    accessoryFastenerQuantity: wallAccessoryFastenerQuantity,
    extraFastenerRows: wallExtraFastenerRows,
    notes: params.notes,
  })

  const roof = buildSectionSpecification({
    classKey: params.classKey,
    classLabel,
    section: 'roof',
    densityKgPerM3,
    requestedThicknessMm: params.input.roofPanelThicknessMm,
    areaM2: params.roofAreaM2,
    panelLengthM: params.roofPanelLengthM,
    standard:
      params.classKey === 'class-1-gost' ? 'ГОСТ 32603-2021, класс 1' : 'ТУ 5284-001-37144780-2012',
    panelType: 'Кровельная трехслойная сэндвич-панель',
    mark: 'МП ТСП-К',
    workingWidthMm: '1000',
    unit: 'м2',
    priceTable: enclosingPanelPriceRubPerM2[params.classKey].roofK,
    accessoryRows: roofAccessories,
    sealantRows: roofSealants,
    panelFastenerLengthByThicknessMm: ROOF_FASTENER_LENGTH_MM_BY_THICKNESS_ATR,
    panelFastenerPriceRubByLengthMm: params.pricing.harpoonPanelFastenerPriceRubByLengthMm,
    accessoryFastenerPriceRub: params.pricing.accessoryFastenerPriceRub,
    panelFastenerQuantity: roofPanelFastenerQuantity,
    accessoryFastenerQuantity: roofAccessoryFastenerQuantity,
    extraFastenerRows: roofLapFastenerRows,
    notes: params.notes,
  })

  return {
    key: params.classKey,
    label: classLabel,
    walls,
    roof,
    totals: {
      panelsRub: walls.totals.panelsRub + roof.totals.panelsRub,
      accessoriesRub: walls.totals.accessoriesRub + roof.totals.accessoriesRub,
      sealantsRub: walls.totals.sealantsRub + roof.totals.sealantsRub,
      fastenersRub: walls.totals.fastenersRub + roof.totals.fastenersRub,
      classRub: walls.totals.sectionRub + roof.totals.sectionRub,
      panelMassKg: walls.totals.panelMassKg + roof.totals.panelMassKg,
    },
  }
}

export function calculateEnclosing(rawInput: EnclosingInputRaw): EnclosingCalculationResult {
  const input = enclosingInputSchema.parse(rawInput)
  const pricing = resolveEnclosingPricingRuntime()

  const wallAreaGrossM2 = resolveWallAreaGrossM2(input)
  const roofAreaM2 = resolveRoofAreaM2(input)
  const openingsAreaM2 = Math.max(0, input.openingsAreaM2)
  const wallAreaNetM2 = Math.max(0, wallAreaGrossM2 - openingsAreaM2)
  const roofPanelLengthM = resolveRoofPanelLengthM(input)
  const selectedWallWorkingWidthMm = 1000

  const derivedAccessoryPriceRubPerM2 =
    pricing.accessoryBaseFlatSheetPriceRubPerM2 * enclosingAccessoriesReference.flatSheetMultiplier

  const notes: string[] = [
    'Количество панелей рассчитывается по укрупненной схеме раскладки.',
    `Доборные элементы рассчитываются по формуле прайса: цена плоского листа x ${enclosingAccessoriesReference.flatSheetMultiplier} (база ${pricing.accessoryBaseFlatSheetPriceRubPerM2.toFixed(2)} руб/м2).`,
    `Стартовая планка ФИУ6хA рассчитывается от цены плоского листа t=2,0 мм (${pricing.starterBaseFlatSheet2mmPriceRubPerM2.toFixed(2)} руб/м2) x ${enclosingAccessoriesReference.flatSheetMultiplier}.`,
    'Доборные элементы в спецификации учитываются в м2 по формуле ТСП.',
    'Уплотнители добавляются из прайс-листа №12.5 (замковый и профильные для кровли).',
    'В стеновые доборы включены нащельники стыков, наружные углы и отлив цоколя (без учета проемов).',
    'Нащельник стыка ФИ11 (узел 1.2.3) считается по вертикальным стыкам между панелями в каждом горизонтальном ряду.',
    'Длины саморезов для МП ТСП-Z и МП ТСП-К подбираются строго по рекомендациям АТР.',
    'Крепеж стеновых панелей: 3 шт на панель по ряду, 2 ряда крепления (итого 6 шт/панель в типовой схеме, Техкаталог ТСП, п.7.7.3).',
    'Крепеж доборных элементов: шаг 300 мм (узлы АТР ТСП), эквивалентно ceil(L/0.3).',
    'Анкерные болты цоколя: шаг 600 мм для крепления опорного элемента/отлива к основанию (узлы АТР ТСП).',
    `Крепеж кровельных панелей к прогонам: 500 мм по ширине панели + 250 мм по карнизной линии, шаг прогонов ${input.roofPurlinStepM.toFixed(2)} м (Техкаталог ТСП, п.7.9.9).`,
    'Крепеж панелей по продольному нахлесту: шаг <=500 мм по гофру нахлеста (Техкаталог ТСП, п.7.9.11).',
    'Цены крепежа берутся из прайс-листов №12.4 (Гарпун для сэндвич-панелей) и №7 (4.8x28 ROOFRetail для доборов). Если точной длины самореза нет в прайсе, в спецификацию ставится следующая большая длина.',
    'Рабочая ширина стеновой панели фиксирована: 1000 мм.',
    `Стеновые панели принимаются с горизонтальным монтажом; длина панели равна шагу рамы (${input.frameStepM} м).`,
  ]

  const classes = Object.fromEntries(
    ENCLOSING_CLASS_KEYS.map((classKey) => [
      classKey,
      buildClassSpecification({
        classKey,
        input,
        wallAreaNetM2,
        roofAreaM2,
        roofPanelLengthM,
        roofPurlinStepM: input.roofPurlinStepM,
        pricing,
        derivedAccessoryPriceRubPerM2,
        selectedWallWorkingWidthMm,
        notes,
      }),
    ]),
  ) as Record<EnclosingClassKey, EnclosingClassSpecification>

  return {
    snapshot: {
      sourceWorkbook: 'Прайс-лист №12.1 40 55 (14.08.2025), стр. 28',
      sourceSheets: [
        'Панели МВ (класс 1/класс 2, стр. 28)',
        'АТР ТСП: рекомендуемый перечень крепежных элементов (лист 9)',
        '№12.4 Крепежные изделия для сэндвич-панелей (стр. 31)',
        '№12.5 Элементы комплектации для сэндвич-панелей (стр. 32)',
        '№1.7 и №7 (плоский лист и крепеж доборов)',
      ],
      status: 'in-progress',
      note: 'SECRET FIX исключен из расчета в соответствии с заданием.',
    },
    geometry: {
      wallAreaGrossM2,
      wallAreaNetM2,
      roofAreaM2,
      openingsAreaM2,
    },
    classes,
    accessories: {
      flatSheetMultiplier: enclosingAccessoriesReference.flatSheetMultiplier,
      formula: enclosingAccessoriesReference.formula,
      baseFlatSheetPriceRubPerM2: pricing.accessoryBaseFlatSheetPriceRubPerM2,
      derivedUnitPriceRubPerM2: derivedAccessoryPriceRubPerM2,
    },
    notes,
  }
}

