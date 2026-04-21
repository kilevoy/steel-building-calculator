import {
  calculatePurlinAutoMaxStepMm,
  calculatePurlinDesignLoad,
  calculatePurlinDesignSnowLoad,
  calculatePurlinServiceLoad,
  calculatePurlinWindPressure,
  debugPurlinWindComponents,
} from '@/domain/purlin/model/purlin-load-chain'
import { buildPurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import { defaultPurlinInput } from '@/domain/purlin/model/purlin-input'
import { purlinAutoStepCapacityTable } from '@/domain/purlin/model/purlin-reference.generated'

describe('purlin load chain', () => {
  it('matches the default workbook snow, wind, service, and total load', () => {
    const context = buildPurlinDerivedContext(defaultPurlinInput)
    const wind = debugPurlinWindComponents(defaultPurlinInput, context)

    expect(wind.kZe).toBeCloseTo(0.65, 10)
    expect(wind.zetaZe).toBeCloseTo(1.06, 10)
    expect(wind.nu).toBeCloseTo(0.8124, 10)
    expect(calculatePurlinDesignSnowLoad(defaultPurlinInput, context)).toBeCloseTo(2.0768004028, 10)
    expect(calculatePurlinWindPressure(defaultPurlinInput, context)).toBeCloseTo(0.1016184624, 10)
    expect(calculatePurlinServiceLoad(defaultPurlinInput, context)).toBeCloseTo(0.9232844509, 10)
    expect(calculatePurlinDesignLoad(defaultPurlinInput, context)).toBeCloseTo(2.4986988652, 10)
  })

  it('matches the default workbook auto max step', () => {
    const context = buildPurlinDerivedContext(defaultPurlinInput)

    expect(calculatePurlinAutoMaxStepMm(defaultPurlinInput, context)).toBe(2550)
  })

  it('scales wind, covering, and service loads with the responsibility factor', () => {
    const scenario = {
      ...defaultPurlinInput,
      responsibilityLevel: '1.2',
    }
    const context = buildPurlinDerivedContext(scenario)

    expect(calculatePurlinDesignSnowLoad(scenario, context)).toBeCloseTo(2.4921604833, 10)
    expect(calculatePurlinWindPressure(scenario, context)).toBeCloseTo(0.1219421549, 10)
    expect(calculatePurlinServiceLoad(scenario, context)).toBeCloseTo(1.1079413411, 10)
    expect(calculatePurlinDesignLoad(scenario, context)).toBeCloseTo(2.9984386382, 10)
  })

  it('responds to a geometry change with a different but stable result', () => {
    const scenario = {
      ...defaultPurlinInput,
      spanM: 30,
      buildingLengthM: 72,
      buildingHeightM: 11,
      roofSlopeDeg: 8,
      frameStepM: 6.3,
      fakhverkSpacingM: 6.3,
    }
    const context = buildPurlinDerivedContext(scenario)

    expect(calculatePurlinDesignSnowLoad(scenario, context)).toBeCloseTo(2.0679173919, 10)
    expect(calculatePurlinWindPressure(scenario, context)).toBeCloseTo(0.1035399369, 10)
    expect(calculatePurlinDesignLoad(scenario, context)).toBeCloseTo(2.4917373287, 10)
    expect(calculatePurlinAutoMaxStepMm(scenario, context)).toBe(2550)
  })

  it('clamps auto max step to minimum supported step when lookup exceeds table capacity', () => {
    const scenario = {
      ...defaultPurlinInput,
      responsibilityLevel: '5',
    }
    const context = buildPurlinDerivedContext(scenario)
    const minimumSupportedStepMm = purlinAutoStepCapacityTable.reduce(
      (minimum, row) => Math.min(minimum, row.stepMm),
      Number.POSITIVE_INFINITY,
    )

    expect(calculatePurlinAutoMaxStepMm(scenario, context)).toBe(minimumSupportedStepMm)
  })
})
