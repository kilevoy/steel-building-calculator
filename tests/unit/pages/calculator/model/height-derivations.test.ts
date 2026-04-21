import { describe, expect, it } from 'vitest'
import { deriveHeights } from '@/pages/calculator/model/height-derivations'

describe('deriveHeights', () => {
  it('uses manual override before the table', () => {
    const result = deriveHeights({
      roofType: 'двускатная',
      spanM: 24,
      roofSlopeDeg: 6,
      clearHeightToBottomChordM: 8,
      manualTrussEaveDepthM: 1.1,
    })

    expect(result.eaveTrussDepthM).toBe(1.1)
    expect(result.eaveTrussDepthSource).toBe('manual')
    expect(result.eaveSupportHeightM).toBe(9.1)
    expect(result.roofRiseM).toBeCloseTo(Math.tan((6 * Math.PI) / 180) * 12)
    expect(result.maxBuildingHeightM).toBeCloseTo(9.1 + Math.tan((6 * Math.PI) / 180) * 12)
    expect(result.windReferenceHeightM).toBeCloseTo(result.maxBuildingHeightM)
  })

  it('uses the standard table for supported gable spans when manual override is null', () => {
    const result = deriveHeights({
      roofType: 'двускатная',
      spanM: 24,
      roofSlopeDeg: 6,
      clearHeightToBottomChordM: 8,
      manualTrussEaveDepthM: null,
    })

    expect(result.eaveTrussDepthM).toBe(1.2)
    expect(result.eaveTrussDepthSource).toBe('standard-table')
    expect(result.eaveSupportHeightM).toBe(9.2)
    expect(result.roofRiseM).toBeCloseTo(Math.tan((6 * Math.PI) / 180) * 12)
    expect(result.maxBuildingHeightM).toBeCloseTo(9.2 + Math.tan((6 * Math.PI) / 180) * 12)
    expect(result.windReferenceHeightM).toBeCloseTo(result.maxBuildingHeightM)
  })

  it('uses a non-zero fallback for unsupported spans', () => {
    const result = deriveHeights({
      roofType: 'двускатная',
      spanM: 22,
      roofSlopeDeg: 6,
      clearHeightToBottomChordM: 8,
      manualTrussEaveDepthM: null,
    })

    expect(result.eaveTrussDepthSource).toBe('fallback')
    expect(result.eaveTrussDepthM).toBeGreaterThan(0)
  })

  it('derives heights for a monopitch roof', () => {
    const result = deriveHeights({
      roofType: 'односкатная',
      spanM: 24,
      roofSlopeDeg: 6,
      clearHeightToBottomChordM: 8,
      manualTrussEaveDepthM: null,
    })

    expect(result.eaveTrussDepthSource).toBe('fallback')
    expect(result.eaveTrussDepthM).toBeGreaterThan(0)
    expect(result.eaveSupportHeightM).toBeCloseTo(8 + result.eaveTrussDepthM)
    expect(result.roofRiseM).toBeCloseTo(Math.tan((6 * Math.PI) / 180) * 24)
    expect(result.maxBuildingHeightM).toBeCloseTo(
      result.eaveSupportHeightM + Math.tan((6 * Math.PI) / 180) * 24,
    )
    expect(result.windReferenceHeightM).toBeCloseTo(result.maxBuildingHeightM)
  })
})
