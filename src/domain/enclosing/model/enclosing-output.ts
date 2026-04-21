import type { EnclosingClassKey } from './enclosing-reference.generated'

export type EnclosingSectionKey = 'walls' | 'roof'

export interface EnclosingPanelSpecificationRow {
  key: string
  section: EnclosingSectionKey
  classKey: EnclosingClassKey
  classLabel: string
  panelType: string
  mark: string
  workingWidthMm: string
  unit: string
  thicknessMm: number
  standard: string
  densityKgPerM3: number
  areaM2: number
  panelLengthM: number
  panelsCount: number
  unitMassKgPerM2: number
  totalMassKg: number
  unitPriceRubPerM2: number
  totalRub: number
}

export interface EnclosingAccessoryRow {
  key: string
  section: EnclosingSectionKey
  item: string
  unit: string
  requiredLengthM: number
  quantity: number
  developedWidthM: number
  unitPriceRub: number
  totalRub: number
  note?: string
}

export interface EnclosingFastenerRow {
  key: string
  section: EnclosingSectionKey
  item: string
  unit: string
  quantity: number
  lengthMm: number
  unitPriceRub: number
  totalRub: number
  note?: string
}

export interface EnclosingSealantRow {
  key: string
  section: EnclosingSectionKey
  item: string
  unit: string
  quantity: number
  unitPriceRub: number
  totalRub: number
  note?: string
}

export interface EnclosingSectionSpecification {
  panelSpecification: EnclosingPanelSpecificationRow[]
  accessories: EnclosingAccessoryRow[]
  sealants: EnclosingSealantRow[]
  fasteners: EnclosingFastenerRow[]
  totals: {
    panelsRub: number
    accessoriesRub: number
    sealantsRub: number
    fastenersRub: number
    sectionRub: number
    panelMassKg: number
  }
}

export interface EnclosingClassSpecification {
  key: EnclosingClassKey
  label: string
  walls: EnclosingSectionSpecification
  roof: EnclosingSectionSpecification
  totals: {
    panelsRub: number
    accessoriesRub: number
    sealantsRub: number
    fastenersRub: number
    classRub: number
    panelMassKg: number
  }
}

export interface EnclosingCalculationResult {
  snapshot: {
    sourceWorkbook: string
    sourceSheets: readonly string[]
    status: 'in-progress' | 'parity-verified'
    note: string
  }
  geometry: {
    wallAreaGrossM2: number
    wallAreaNetM2: number
    roofAreaM2: number
    openingsAreaM2: number
  }
  classes: Record<EnclosingClassKey, EnclosingClassSpecification>
  accessories: {
    flatSheetMultiplier: number
    formula: string
    baseFlatSheetPriceRubPerM2: number
    derivedUnitPriceRubPerM2: number
  }
  notes: string[]
}
