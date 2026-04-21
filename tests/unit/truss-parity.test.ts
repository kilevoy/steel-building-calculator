import { calculateTruss } from '@/domain/truss/model/calculate-truss'
import { defaultTrussInput } from '@/domain/truss/model/truss-input'

describe('truss parity', () => {
  it('matches workbook default selection and totals 1:1', () => {
    const result = calculateTruss(defaultTrussInput)

    expect(result.groups.vp.profile).toBe('тр.200х160х6')
    expect(result.groups.np.profile).toBe('тр.120х5')
    expect(result.groups.orb.profile).toBe('тр.80х4')
    expect(result.groups.or.profile).toBe('тр.80х4')
    expect(result.groups.rr.profile).toBe('тр.60х3')

    expect(result.groups.vp.utilization).toBeCloseTo(0.7801684312325937, 10)
    expect(result.groups.np.utilization).toBeCloseTo(0.8494805721764965, 10)
    expect(result.groups.orb.utilization).toBeCloseTo(0.7676019313768221, 10)
    expect(result.groups.or.utilization).toBeCloseTo(0.3326873506099256, 10)
    expect(result.groups.rr.utilization).toBeCloseTo(0.25733547933111817, 10)

    expect(result.groups.vp.massKg).toBeCloseTo(889.4520489362953, 10)
    expect(result.groups.np.massKg).toBeCloseTo(435.942091, 10)
    expect(result.groups.orb.massKg).toBeCloseTo(80.58285599999999, 10)
    expect(result.groups.or.massKg).toBeCloseTo(84.824056, 10)
    expect(result.groups.rr.massKg).toBeCloseTo(109.82043599999999, 10)

    expect(result.totalMassKg).toBeCloseTo(1619.8614879362951, 10)
    expect(result.specificMassKgPerM2).toBeCloseTo(11.249038110668716, 10)
  })

  it('switches from pass to fail around capacity thresholds', () => {
    const nearBoundary = calculateTruss({
      ...defaultTrussInput,
      designSnowKpa: defaultTrussInput.designSnowKpa * 4,
      windRoofKpa: defaultTrussInput.windRoofKpa * 4,
      coveringKpa: defaultTrussInput.coveringKpa * 4,
    })
    expect(nearBoundary.groups.vp.status).toBe('ok')

    const beyondBoundary = calculateTruss({
      ...defaultTrussInput,
      designSnowKpa: defaultTrussInput.designSnowKpa * 5,
      windRoofKpa: defaultTrussInput.windRoofKpa * 5,
      coveringKpa: defaultTrussInput.coveringKpa * 5,
    })
    expect(beyondBoundary.groups.vp.status).toBe('not-found')
  })
})
