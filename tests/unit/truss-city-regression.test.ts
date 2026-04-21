import { calculatePurlin } from '@/domain/purlin/model/calculate-purlin'
import { calculateTruss } from '@/domain/truss/model/calculate-truss'
import { mapToPurlinInput, mapToTrussInput } from '@/pages/calculator/model/input-mapper'
import { defaultUnifiedInput } from '@/pages/calculator/model/unified-input'

describe('truss city regression', () => {
  it('keeps truss selection valid for low-load city Благовещенск at 18 m span', () => {
    const input = {
      ...defaultUnifiedInput,
      city: 'Благовещенск',
      spanM: 18,
      frameStepM: 6,
    }

    const purlinResult = calculatePurlin(mapToPurlinInput(input))
    const trussResult = calculateTruss(mapToTrussInput(input, purlinResult))

    expect(trussResult.totalMassKg).not.toBeNull()
    expect(trussResult.groups.orb.status).toBe('ok')
    expect(trussResult.groups.or.status).toBe('ok')
    expect((trussResult.groups.np.widthMm ?? 0) >= input.trussMinWidthOrbMm).toBe(true)
  })
})
