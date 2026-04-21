import { columnInputSchema, defaultColumnInput } from '@/domain/column/model/column-input'
import { calculatePurlin } from '@/domain/purlin/model/calculate-purlin'
import { purlinInputSchema, defaultPurlinInput } from '@/domain/purlin/model/purlin-input'
import { normalizeLoadedInput } from '@/pages/calculator/model/unified-input'

describe('calculator input constraints', () => {
  it('normalizes legacy boolean snow bag mode into a supported unified mode', () => {
    const normalized = normalizeLoadedInput({
      snowBagMode: 'есть',
      roofType: 'gable',
      spansCount: 'multi',
      supportCraneCount: '2',
      supportCraneSingleSpanMode: 'no',
    })

    expect(normalized.snowBagMode).toBe('поперёк здания')
    expect(normalized.roofType).toBe('двускатная')
    expect(normalized.spansCount).toBe('более одного')
    expect(normalized.supportCraneCount).toBe('два')
    expect(normalized.supportCraneSingleSpanMode).toBe('нет')
  })

  it('rejects purlin inputs above interpolation limits', () => {
    const result = purlinInputSchema.safeParse({
      ...defaultPurlinInput,
      buildingHeightM: 351,
    })

    expect(result.success).toBe(false)
  })

  it('rejects column inputs above interpolation limits', () => {
    const result = columnInputSchema.safeParse({
      ...defaultColumnInput,
      buildingLengthM: 401,
    })

    expect(result.success).toBe(false)
  })

  it('rejects inverted manual step bounds for purlins', () => {
    const result = purlinInputSchema.safeParse({
      ...defaultPurlinInput,
      manualMinStepMm: 1500,
      manualMaxStepMm: 1200,
    })

    expect(result.success).toBe(false)
  })

  it('accepts workbook brace spacing input for purlins', () => {
    const result = purlinInputSchema.safeParse({
      ...defaultPurlinInput,
      braceSpacingM: 3,
      tiesSetting: '2',
    })

    expect(result.success).toBe(true)
  })

  it('returns empty candidate lists instead of placeholder rows when no purlin step is available', () => {
    const result = calculatePurlin({
      ...defaultPurlinInput,
      manualMinStepMm: 3005,
      manualMaxStepMm: 3005,
    })

    expect(result.sortSteelTop10).toEqual([])
    expect(result.lstkMp350Top).toEqual([])
    expect(result.lstkMp390Top).toEqual([])
  })

  it('exposes Excel-compatible purlin presentation metrics', () => {
    const result = calculatePurlin({
      ...defaultPurlinInput,
      city: 'Уфа',
      roofType: 'двускатная',
      buildingLengthM: 48,
      coveringType: 'С-П 150 мм',
      profileSheet: 'С44-1000-0,7',
    })

    expect(result.sortSteelTop10[0]?.excelMetrics?.displayCostThousandsRub).toBe(396.5)
    expect(result.lstkMp350Top[0]?.excelMetrics?.lineLabel).toBe('2PS')
    expect(result.lstkMp350Top[0]?.excelMetrics?.unitMassPerMeterKg).toBeCloseTo(12.18, 2)
    expect(result.lstkMp350Top[0]?.excelMetrics?.massPerMeterKg).toBeCloseTo(6.09, 4)
    expect(result.lstkMp350Top[0]?.excelMetrics?.massPerStepKg).toBeCloseTo(1607.76, 4)
    expect(result.lstkMp350Top[0]?.excelMetrics?.massWithBracesKg).toBeCloseTo(16548.48, 4)
    expect(result.lstkMp390Top[0]?.excelMetrics?.massWithBracesKg).toBeCloseTo(14209.92, 4)
  })
})
