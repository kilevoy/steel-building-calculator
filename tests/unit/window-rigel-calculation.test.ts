import { describe, expect, it } from 'vitest'
import {
  calculateWindowRigel,
  defaultWindowRigelDemoInput,
} from '@/pages/window-rigel/model/calculate-window-rigel'

describe('window rigel calculation', () => {
  it('returns candidates for the default restored scenario', () => {
    const result = calculateWindowRigel(defaultWindowRigelDemoInput)

    expect(result.loads.windLoadKpa).toBeGreaterThan(0)
    expect(result.bottomCandidates.length).toBeGreaterThan(0)
    expect(result.topCandidates.length).toBeGreaterThan(0)
    expect(result.bottomCandidates[0]?.profile).toBeTruthy()
  })

  it('recalculates loads and keeps candidate ranking stable for a wider frame step', () => {
    const result = calculateWindowRigel({
      ...defaultWindowRigelDemoInput,
      frameStepM: 7.5,
      buildingHeightM: 9,
      buildingSpanM: 24,
      windowType: 3,
    })

    expect(result.lengths.outOfPlaneM).toBe(7.5)
    expect(result.lengths.inPlaneM).toBeGreaterThan(0)
    expect(result.loads.horizontalLoadCase1Kpa).toBeGreaterThan(result.loads.horizontalLoadCase2Kpa)
    expect(result.bottomCandidates.length).toBeGreaterThan(0)
  })
})
