import { buildPurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import { defaultPurlinInput } from '@/domain/purlin/model/purlin-input'

describe('buildPurlinDerivedContext', () => {
  it('matches the default workbook-derived context', () => {
    const result = buildPurlinDerivedContext(defaultPurlinInput)

    expect(result.windLoadKpa).toBe(0.3)
    expect(result.snowLoadKpa).toBe(1.2)
    expect(result.coveringLoadKpa).toBe(0.32028)
    expect(result.snowBagFactor).toBe(1)
    expect(result.autoStepIndex).toBe(9)
  })

  it('computes snow bag factor along the building according to the workbook formula', () => {
    const result = buildPurlinDerivedContext({
      ...defaultPurlinInput,
      snowBagMode: 'вдоль здания',
    })

    expect(result.snowBagFactor).toBeCloseTo(3.9777777778, 10)
  })

  it('uses profile-based auto-step indices for non-sandwich coverings', () => {
    const result = buildPurlinDerivedContext({
      ...defaultPurlinInput,
      coveringType: 'профлист',
      profileSheet: 'Н60-845-0,7',
    })

    expect(result.coveringLoadKpa).toBe(0.105)
    expect(result.autoStepIndex).toBe(3)
  })
})
