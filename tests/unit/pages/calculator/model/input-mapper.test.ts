import { describe, expect, it } from 'vitest'
import { deriveHeights } from '@/pages/calculator/model/height-derivations'
import { mapToColumnInput, mapToPurlinInput } from '@/pages/calculator/model/input-mapper'
import { defaultUnifiedInput } from '@/pages/calculator/model/unified-input'

describe('input mappers', () => {
  it('maps manual truss eave depth into the column eave support height', () => {
    const state = {
      ...defaultUnifiedInput,
      roofType: 'двускатная' as const,
      spanM: 24,
      roofSlopeDeg: 6,
      clearHeightToBottomChordM: 8,
      manualTrussEaveDepthM: 1.1,
    }

    const heights = deriveHeights(state)
    const columnInput = mapToColumnInput(state)

    expect(columnInput.buildingHeightM).toBeCloseTo(heights.eaveSupportHeightM)
  })

  it('maps manual truss eave depth into the purlin wind reference height', () => {
    const state = {
      ...defaultUnifiedInput,
      roofType: 'двускатная' as const,
      spanM: 24,
      roofSlopeDeg: 6,
      clearHeightToBottomChordM: 8,
      manualTrussEaveDepthM: 1.1,
    }

    const heights = deriveHeights(state)
    const purlinInput = mapToPurlinInput(state)

    expect(purlinInput.buildingHeightM).toBeCloseTo(heights.windReferenceHeightM)
  })
})
