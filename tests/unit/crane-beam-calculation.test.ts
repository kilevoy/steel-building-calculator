import { describe, expect, it } from 'vitest'
import {
  calculateCraneBeam,
  defaultCraneBeamInput,
} from '@/domain/crane-beam/model/calculate-crane-beam'

describe('crane beam calculation', () => {
  it('uses workbook-backed selection for known matrix cases', () => {
    const result = calculateCraneBeam(defaultCraneBeamInput)

    expect(result.selection.profile).toBeTruthy()
    expect(result.selection.utilization).toBeGreaterThan(0)
    expect(result.loads.designMxGeneralKnM).toBeGreaterThan(0)
  })

  it('falls back to catalog selection outside workbook matrix', () => {
    const result = calculateCraneBeam({
      ...defaultCraneBeamInput,
      craneRail: 'КР70',
      beamSpanM: 9,
      craneSpanM: 18,
      loadCapacityT: 8,
      dutyGroup: '4К',
    })

    expect(result.selection.profile).toBeTruthy()
    expect(result.selection.weightKg).toBeGreaterThan(0)
    expect(result.selection.profileDetails.actualHeightMm).not.toBeNull()
  })
})
