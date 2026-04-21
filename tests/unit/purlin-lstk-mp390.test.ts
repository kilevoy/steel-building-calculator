import { calculatePurlin } from '@/domain/purlin/model/calculate-purlin'
import { buildPurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import { defaultPurlinInput } from '@/domain/purlin/model/purlin-input'
import { calculateMp390FamilyCandidates } from '@/domain/purlin/model/purlin-lstk-mp390'

describe('purlin MP390 selection', () => {
  it('keeps 2TPS available for layered assemblies', () => {
    const scenario = {
      ...defaultPurlinInput,
      coveringType: 'наше 150 мм',
    }
    const derivedContext = buildPurlinDerivedContext(scenario)
    const candidates = calculateMp390FamilyCandidates(scenario, derivedContext)

    expect(candidates).toHaveLength(3)
    expect(candidates[0]?.family).toBe('MP390 / 2TPS')
    expect(candidates[0]?.profile).toBe('2ТПС 150х45х2')
    expect(candidates[0]?.stepMm).toBe(1050)
  })

  it('matches the constrained recommendations for non-layered MP390 coverings', () => {
    const derivedContext = buildPurlinDerivedContext(defaultPurlinInput)
    const candidates = calculateMp390FamilyCandidates(defaultPurlinInput, derivedContext)

    expect(candidates).toHaveLength(2)
    expect(candidates[0]).toMatchObject({
      family: 'MP390 / 2PS',
      profile: '2ПС 245х65х1,5',
      stepMm: 1825,
    })
    expect(candidates[0]?.unitMassKg).toBeCloseTo(9.19, 10)
    expect(candidates[0]?.totalMassKg).toBeCloseTo(7719.6, 10)

    expect(candidates[1]).toMatchObject({
      family: 'MP390 / Z',
      profile: 'Z 350х2',
      stepMm: 2395,
    })
    expect(candidates[1]?.unitMassKg).toBeCloseTo(8.9, 10)
    expect(candidates[1]?.totalMassKg).toBeCloseTo(6063.2, 10)
  })

  it('surfaces only non-2TPS MP390 candidates for non-layered coverings', () => {
    const result = calculatePurlin(defaultPurlinInput)

    expect(result.lstkMp390Top).toHaveLength(2)
    expect(result.lstkMp390Top[0]?.family).toBe('MP390 / 2PS')
    expect(result.lstkMp390Top[1]?.family).toBe('MP390 / Z')
  })
})
