import { calculateTruss } from '@/domain/truss/model/calculate-truss'
import { defaultTrussInput } from '@/domain/truss/model/truss-input'

describe('truss custom limits', () => {
  it('uses custom width limits from input settings', () => {
    const defaultResult = calculateTruss(defaultTrussInput)
    expect(defaultResult.groups.vp.status).toBe('ok')
    expect(defaultResult.groups.np.status).toBe('ok')

    const customizedResult = calculateTruss({
      ...defaultTrussInput,
      limits: {
        minThicknessMm: {
          vp: 4,
          np: 4,
          orb: 4,
          or: 4,
          rr: 3,
        },
        maxWidthMm: {
          vp: 40,
          np: 40,
        },
        minWidthMm: {
          orb: 80,
          or: 80,
          rr: 60,
        },
      },
    })

    expect(customizedResult.groups.vp.status).toBe('not-found')
    expect(customizedResult.groups.np.status).toBe('not-found')
  })
})
