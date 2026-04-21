import { buildColumnDerivedContext } from '@/domain/column/model/column-derived-context'
import { defaultColumnInput } from '@/domain/column/model/column-input'

describe('buildColumnDerivedContext', () => {
  it('matches the default workbook-derived load context', () => {
    const result = buildColumnDerivedContext(defaultColumnInput)

    expect(result.windLoadKpa).toBe(0.3)
    expect(result.snowLoadKpa).toBe(2.45)
    expect(result.roofCoveringLoadKpa).toBe(0.32028)
    expect(result.wallCoveringLoadKpa).toBe(0.25416)
    expect(result.designSnowLoadKpa).toBeCloseTo(2.3878470708, 10)
    expect(result.designWindLongKpa).toBeCloseTo(0.4064738496, 10)
    expect(result.designWindShortKpa).toBeCloseTo(0.391564992, 10)
    expect(result.designWindPositiveKpa).toBeCloseTo(0.1016184624, 10)
    expect(result.designWindForMomentKpa).toBeCloseTo(0.508092312, 10)
    expect(result.designRoofCoveringLoadKpa).toBe(0.32028)
    expect(result.designWallCoveringLoadKpa).toBe(0.25416)
    expect(result.axialLoadKn).toBeCloseTo(250.1839701472, 10)
    expect(result.bendingMomentKnM).toBeCloseTo(152.4276936, 10)
    expect(result.windHeightFactor).toBe(2)
    expect(result.windMomentFactor).toBe(1)
  })

  it('scales design loads with the responsibility level exactly like the workbook inputs', () => {
    const result = buildColumnDerivedContext({
      ...defaultColumnInput,
      responsibilityLevel: '1.2',
    })

    expect(result.designSnowLoadKpa).toBeCloseTo(2.8654164849, 10)
    expect(result.designRoofCoveringLoadKpa).toBeCloseTo(0.384336, 10)
    expect(result.designWallCoveringLoadKpa).toBeCloseTo(0.304992, 10)
  })

  it('adds support and hanging crane loads exactly through the workbook summary formulas', () => {
    const result = buildColumnDerivedContext({
      ...defaultColumnInput,
      columnType: 'средняя',
      spansCount: 'более одного',
      supportCraneMode: 'есть',
      supportCraneSingleSpanMode: 'нет',
      supportCraneCapacity: '5',
      supportCraneCount: 'два',
      supportCraneRailLevelM: 3.5,
      hangingCraneMode: 'есть',
      hangingCraneSingleSpanMode: 'нет',
      hangingCraneCapacityT: 2,
    })

    expect(result.supportCraneVerticalLoadKn).toBeCloseTo(402.376, 10)
    expect(result.supportCraneMomentKnM).toBeCloseTo(221.3068, 10)
    expect(result.hangingCraneVerticalLoadKn).toBeCloseTo(66, 10)
    expect(result.axialLoadKn).toBeCloseTo(1011.5633002945, 10)
    expect(result.bendingMomentKnM).toBeCloseTo(312.76341616, 10)
  })
})
