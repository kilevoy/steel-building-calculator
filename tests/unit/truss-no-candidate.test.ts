import { calculateTruss } from '@/domain/truss/model/calculate-truss'
import { defaultTrussInput } from '@/domain/truss/model/truss-input'

describe('truss no-candidate branches', () => {
  it('returns not-found status for each group on documented stress scenarios', () => {
    const lowLoad = calculateTruss({
      ...defaultTrussInput,
      designSnowKpa: defaultTrussInput.designSnowKpa * 0.25,
      windRoofKpa: defaultTrussInput.windRoofKpa * 0.25,
      coveringKpa: defaultTrussInput.coveringKpa * 0.25,
    })

    expect(lowLoad.groups.orb.status).toBe('ok')
    expect(lowLoad.groups.or.status).toBe('ok')
    expect(lowLoad.totalMassKg).not.toBeNull()

    const highLoad = calculateTruss({
      ...defaultTrussInput,
      designSnowKpa: defaultTrussInput.designSnowKpa * 5,
      windRoofKpa: defaultTrussInput.windRoofKpa * 5,
      coveringKpa: defaultTrussInput.coveringKpa * 5,
    })

    expect(highLoad.groups.vp.status).toBe('not-found')
    expect(highLoad.groups.rr.status).toBe('not-found')

    const extremeLoad = calculateTruss({
      ...defaultTrussInput,
      designSnowKpa: defaultTrussInput.designSnowKpa * 8,
      windRoofKpa: defaultTrussInput.windRoofKpa * 8,
      coveringKpa: defaultTrussInput.coveringKpa * 8,
    })

    expect(extremeLoad.groups.np.status).toBe('not-found')
  })
})
