import { describe, expect, it } from 'vitest'
import { calculateTruss } from '@/domain/truss/model/calculate-truss'
import { defaultTrussInput } from '@/domain/truss/model/truss-input'

describe('truss span interpolation', () => {
  it('interpolates effort bands linearly for a 21 m span', () => {
    const span18 = calculateTruss({ ...defaultTrussInput, spanM: 18 })
    const span21 = calculateTruss({ ...defaultTrussInput, spanM: 21 })
    const span24 = calculateTruss({ ...defaultTrussInput, spanM: 24 })

    expect(span21.loadSummary.spanLowerM).toBe(18)
    expect(span21.loadSummary.spanUpperM).toBe(24)
    expect(span21.groups.vp.status).toBe('ok')
    expect(span21.groups.np.status).toBe('ok')
    expect(span21.totalMassKg).not.toBeNull()

    expect(span21.efforts.vpN).toBeCloseTo((span18.efforts.vpN + span24.efforts.vpN) / 2, 10)
    expect(span21.efforts.npNPlus).toBeCloseTo((span18.efforts.npNPlus + span24.efforts.npNPlus) / 2, 10)
    expect(span21.efforts.rrNMinus).toBeCloseTo((span18.efforts.rrNMinus + span24.efforts.rrNMinus) / 2, 10)
  })

  it('interpolates effort bands linearly for a 27 m span', () => {
    const span24 = calculateTruss({ ...defaultTrussInput, spanM: 24 })
    const span27 = calculateTruss({ ...defaultTrussInput, spanM: 27 })
    const span30 = calculateTruss({ ...defaultTrussInput, spanM: 30 })

    expect(span27.loadSummary.spanLowerM).toBe(24)
    expect(span27.loadSummary.spanUpperM).toBe(30)
    expect(span27.groups.vp.status).toBe('ok')
    expect(span27.groups.np.status).toBe('ok')
    expect(span27.totalMassKg).not.toBeNull()

    expect(span27.efforts.vpN).toBeCloseTo((span24.efforts.vpN + span30.efforts.vpN) / 2, 10)
    expect(span27.efforts.orbNPlus).toBeCloseTo((span24.efforts.orbNPlus + span30.efforts.orbNPlus) / 2, 10)
    expect(span27.efforts.orNMinus).toBeCloseTo((span24.efforts.orNMinus + span30.efforts.orNMinus) / 2, 10)
  })
})
