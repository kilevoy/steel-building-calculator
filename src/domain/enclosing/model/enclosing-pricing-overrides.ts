export interface EnclosingPricingOverrideValues {
  accessoryBaseFlatSheetPriceRubPerM2: number
  starterBaseFlatSheet2mmPriceRubPerM2: number
  harpoonPanelFastenerPriceRubByLengthMm: Record<number, number>
  accessoryFastenerPriceRub: number
  lockGasketPackPriceRub: number
  roofProfileGasketPriceRub: number
  wallSocleDripPriceRubPerPiece: number
  socleAnchorBoltPriceRub: number
}

export interface EnclosingPricingOverridesPayload {
  sourceFileName: string
  importedAtIso: string
  values: Partial<EnclosingPricingOverrideValues>
}

const STORAGE_KEY = 'metalcalc:enclosing-pricing-overrides.v1'

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadEnclosingPricingOverrides(): EnclosingPricingOverridesPayload | null {
  if (!hasBrowserStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<EnclosingPricingOverridesPayload>
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return {
      sourceFileName: typeof parsed.sourceFileName === 'string' ? parsed.sourceFileName : 'unknown.pdf',
      importedAtIso: typeof parsed.importedAtIso === 'string' ? parsed.importedAtIso : new Date(0).toISOString(),
      values: typeof parsed.values === 'object' && parsed.values ? parsed.values : {},
    }
  } catch {
    return null
  }
}

export function saveEnclosingPricingOverrides(payload: EnclosingPricingOverridesPayload): void {
  if (!hasBrowserStorage()) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage quota failures.
  }
}

export function clearEnclosingPricingOverrides(): void {
  if (!hasBrowserStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

