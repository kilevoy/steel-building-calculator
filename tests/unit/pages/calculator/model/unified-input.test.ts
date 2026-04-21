import { describe, expect, it } from 'vitest'
import { defaultUnifiedInput, normalizeLoadedInput } from '@/pages/calculator/model/unified-input'

describe('normalizeLoadedInput', () => {
  it('keeps new height fields from the new format', () => {
    const result = normalizeLoadedInput({
      clearHeightToBottomChordM: 9.5,
      manualTrussEaveDepthM: 1.4,
    })

    expect(result.clearHeightToBottomChordM).toBe(9.5)
    expect(result.manualTrussEaveDepthM).toBe(1.4)
  })

  it('migrates the stage-one intermediate format into manual truss eave depth', () => {
    const result = normalizeLoadedInput({
      clearHeightToBottomChordM: 9.5,
      supportNodeOffsetAboveBottomChordM: 1.4,
    })

    expect(result.clearHeightToBottomChordM).toBe(9.5)
    expect(result.manualTrussEaveDepthM).toBe(1.4)
  })

  it('migrates legacy buildingHeightM into the clear height field', () => {
    const result = normalizeLoadedInput({
      buildingHeightM: 10.8,
    })

    expect(result.clearHeightToBottomChordM).toBe(10.8)
    expect(result.manualTrussEaveDepthM).toBeNull()
  })

  it('falls back to defaults when no height data is present', () => {
    const result = normalizeLoadedInput({})

    expect(result.clearHeightToBottomChordM).toBe(defaultUnifiedInput.clearHeightToBottomChordM)
    expect(result.manualTrussEaveDepthM).toBe(defaultUnifiedInput.manualTrussEaveDepthM)
  })
})
