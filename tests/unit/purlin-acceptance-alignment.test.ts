import { describe, expect, it } from 'vitest'
import { calculatePurlin } from '@/domain/purlin/model/calculate-purlin'
import { defaultPurlinInput } from '@/domain/purlin/model/purlin-input'

describe('purlin acceptance alignment', () => {
  it('keeps the corrected P-02 acceptance scenario on the MP350 / 2TPS branch', () => {
    const result = calculatePurlin({
      ...defaultPurlinInput,
      coveringType: 'наше 250 мм 1 слой ГВЛ',
    })

    const candidate = result.lstkMp350Top[0]

    expect(candidate?.family).toBe('MP350 / 2TPS')
    expect(candidate?.profile).toBe('2ТПС 245х65х2')
    expect(candidate?.totalMassKg).toBeCloseTo(8914.308, 3)
    expect(candidate?.stepMm).toBe(2085)
  })

  it('keeps the corrected P-03 acceptance scenario on the MP390 / 2TPS branch', () => {
    const result = calculatePurlin({
      ...defaultPurlinInput,
      coveringType: 'наше 250 мм 1 слой ГВЛ',
      profileSheet: 'Н60-845-0,8',
    })

    const candidate = result.lstkMp390Top[0]

    expect(candidate?.family).toBe('MP390 / 2TPS')
    expect(candidate?.profile).toBe('2ТПС 245х65х2')
    expect(candidate?.totalMassKg).toBeCloseTo(8228.592, 3)
    expect(candidate?.stepMm).toBe(2340)
  })

  it('keeps the corrected P-05 acceptance scenario on the manual-clamped MP390 / 2TPS branch', () => {
    const result = calculatePurlin({
      ...defaultPurlinInput,
      coveringType: 'наше 250 мм 1 слой ГВЛ',
      manualMaxStepMm: 1800,
    })

    const candidate = result.lstkMp390Top[0]

    expect(candidate?.family).toBe('MP390 / 2TPS')
    expect(candidate?.profile).toBe('2ТПС 245х65х1,5')
    expect(candidate?.totalMassKg).toBeCloseTo(8806.476, 3)
    expect(candidate?.stepMm).toBe(1540)
    expect(candidate?.stepMm).toBeLessThanOrEqual(1800)
  })
})
