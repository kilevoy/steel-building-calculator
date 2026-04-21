import { describe, expect, it } from 'vitest'
import { getStandardGableTrussEaveDepthM } from '@/domain/truss/model/standard-truss-eave-depth'

describe('getStandardGableTrussEaveDepthM', () => {
  it('returns standard values for supported spans', () => {
    expect(getStandardGableTrussEaveDepthM(24)).toBe(1.2)
    expect(getStandardGableTrussEaveDepthM(30)).toBe(1.3)
    expect(getStandardGableTrussEaveDepthM(45)).toBe(1.5)
  })

  it('returns null for unsupported spans', () => {
    expect(getStandardGableTrussEaveDepthM(22)).toBeNull()
  })
})
