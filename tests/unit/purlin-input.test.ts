import { defaultPurlinInput, purlinInputSchema } from '@/domain/purlin/model/purlin-input'

describe('purlin input schema', () => {
  it('rejects unknown lookup values before the domain layer runs', () => {
    const result = purlinInputSchema.safeParse({
      ...defaultPurlinInput,
      city: 'Unknown City',
      terrainType: 'B',
      coveringType: 'Unknown Covering',
      profileSheet: 'Unknown Profile',
    })

    expect(result.success).toBe(false)

    if (result.success) {
      return
    }

    expect(result.error.issues.some((issue) => issue.path[0] === 'city')).toBe(true)
    expect(result.error.issues.some((issue) => issue.path[0] === 'terrainType')).toBe(true)
    expect(result.error.issues.some((issue) => issue.path[0] === 'coveringType')).toBe(true)
    expect(result.error.issues.some((issue) => issue.path[0] === 'profileSheet')).toBe(true)
  })

  it('allows zero snow-bag geometry when snow bag mode is disabled', () => {
    const result = purlinInputSchema.safeParse({
      ...defaultPurlinInput,
      heightDifferenceM: 0,
      adjacentBuildingSizeM: 0,
    })

    expect(result.success).toBe(true)
  })

  it('requires positive snow-bag geometry only when snow bag mode is enabled', () => {
    const result = purlinInputSchema.safeParse({
      ...defaultPurlinInput,
      snowBagMode: '\u0432\u0434\u043e\u043b\u044c \u0437\u0434\u0430\u043d\u0438\u044f',
      heightDifferenceM: 0,
      adjacentBuildingSizeM: 0,
    })

    expect(result.success).toBe(false)

    if (result.success) {
      return
    }

    expect(result.error.issues.some((issue) => issue.path[0] === 'heightDifferenceM')).toBe(true)
    expect(result.error.issues.some((issue) => issue.path[0] === 'adjacentBuildingSizeM')).toBe(true)
  })

  it('accepts ties setting with surrounding whitespace for backward-compatible persisted input', () => {
    const result = purlinInputSchema.safeParse({
      ...defaultPurlinInput,
      tiesSetting: `  ${defaultPurlinInput.tiesSetting}  `,
    })

    expect(result.success).toBe(true)
  })
})
