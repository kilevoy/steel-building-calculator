import { calculatePurlin } from '@/domain/purlin/model/calculate-purlin'
import { buildPurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import { defaultPurlinInput } from '@/domain/purlin/model/purlin-input'
import {
  calculateMp3502TpsTopCandidate,
  calculateMp350FamilyCandidates,
} from '@/domain/purlin/model/purlin-lstk-mp350'

describe('purlin MP350 2TPS selection', () => {
  it('matches the layered-assembly recommendation for 2TPS', () => {
    const scenario = {
      ...defaultPurlinInput,
      coveringType: 'наше 150 мм',
    }
    const derivedContext = buildPurlinDerivedContext(scenario)
    const candidate = calculateMp3502TpsTopCandidate(scenario, derivedContext)

    expect(candidate).not.toBeNull()
    expect(candidate?.profile).toBe('2ТПС 150х65х1,5')
    expect(candidate?.stepMm).toBe(820)
    expect(candidate?.unitMassKg).toBeCloseTo(6.4088, 10)
    expect(candidate?.totalMassKg).toBeCloseTo(11535.84, 10)
    expect(candidate?.utilization).toBeCloseTo(0.998749903, 10)
  })

  it('excludes 2TPS from aggregate results for non-layered coverings', () => {
    const result = calculatePurlin(defaultPurlinInput)

    expect(result.lstkMp350Top).toHaveLength(2)
    expect(result.lstkMp350Top[0]?.family).toBe('MP350 / 2PS')
    expect(result.lstkMp350Top[1]?.family).toBe('MP350 / Z')
  })

  it('honors a manual max-step clamp from the input model for 2TPS on layered covering', () => {
    const scenario = {
      ...defaultPurlinInput,
      coveringType: 'наше 150 мм',
      manualMaxStepMm: 800,
    }
    const derivedContext = buildPurlinDerivedContext(scenario)
    const candidate = calculateMp3502TpsTopCandidate(scenario, derivedContext)

    expect(candidate).not.toBeNull()
    expect(candidate?.stepMm).toBeLessThanOrEqual(800)
  })

  it('matches the constrained recommendations for non-layered MP350 coverings', () => {
    const derivedContext = buildPurlinDerivedContext(defaultPurlinInput)
    const candidates = calculateMp350FamilyCandidates(defaultPurlinInput, derivedContext)

    expect(candidates).toHaveLength(2)
    expect(candidates[0]).toMatchObject({
      family: 'MP350 / 2PS',
      profile: '2ПС 245х65х2',
      stepMm: 2370,
    })
    expect(candidates[0]?.totalMassKg).toBeCloseTo(8038.8, 10)

    expect(candidates[1]).toMatchObject({
      family: 'MP350 / Z',
      profile: 'Z 350х2',
      stepMm: 2300,
    })
    expect(candidates[1]?.unitMassKg).toBeCloseTo(8.9, 10)
    expect(candidates[1]?.totalMassKg).toBeCloseTo(6614.4, 10)
  })

  it('treats whitespace-padded no-value toggles as semantic no-value for MP350 objectives', () => {
    const baseContext = buildPurlinDerivedContext(defaultPurlinInput)
    const baselineCandidates = calculateMp350FamilyCandidates(defaultPurlinInput, baseContext)

    const scenario = {
      ...defaultPurlinInput,
      snowRetentionPurlin: `  ${defaultPurlinInput.snowRetentionPurlin}  `,
      barrierPurlin: `  ${defaultPurlinInput.barrierPurlin}  `,
    }
    const derivedContext = buildPurlinDerivedContext(scenario)
    const candidates = calculateMp350FamilyCandidates(scenario, derivedContext)

    expect(candidates).toHaveLength(baselineCandidates.length)
    expect(candidates[0]?.stepMm).toBe(baselineCandidates[0]?.stepMm)
    expect(candidates[0]?.totalMassKg).toBeCloseTo(baselineCandidates[0]?.totalMassKg ?? 0, 10)
    expect(candidates[1]?.stepMm).toBe(baselineCandidates[1]?.stepMm)
  })

  it('treats поперек and поперёк snow bag labels as equivalent for MP350', () => {
    const baseScenario = {
      ...defaultPurlinInput,
      spanM: 18,
      frameStepM: 5,
      fakhverkSpacingM: 5,
      snowBagMode: 'поперек здания',
      heightDifferenceM: 2,
      adjacentBuildingSizeM: 4,
    }
    const variantScenario = {
      ...baseScenario,
      snowBagMode: 'поперёк здания',
    }

    const baseContext = buildPurlinDerivedContext(baseScenario)
    const variantContext = buildPurlinDerivedContext(variantScenario)
    const baseCandidates = calculateMp350FamilyCandidates(baseScenario, baseContext)
    const variantCandidates = calculateMp350FamilyCandidates(variantScenario, variantContext)

    expect(baseCandidates.length).toBeGreaterThan(0)
    expect(variantCandidates).toHaveLength(baseCandidates.length)
    expect(variantCandidates[0]?.profile).toBe(baseCandidates[0]?.profile)
    expect(variantCandidates[0]?.stepMm).toBe(baseCandidates[0]?.stepMm)
    expect(variantCandidates[0]?.totalMassKg).toBeCloseTo(baseCandidates[0]?.totalMassKg ?? 0, 10)
  })
})
