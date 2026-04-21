import { calculateColumn } from '@/domain/column/model/calculate-column'
import { defaultColumnInput } from '@/domain/column/model/column-input'
import { calculatePurlin } from '@/domain/purlin/model/calculate-purlin'
import { defaultPurlinInput } from '@/domain/purlin/model/purlin-input'
import { calculateTruss } from '@/domain/truss/model/calculate-truss'
import { defaultTrussInput } from '@/domain/truss/model/truss-input'

describe('domain contracts', () => {
  it('returns a purlin workbook-derived snapshot', () => {
    const result = calculatePurlin(defaultPurlinInput)

    expect(result.snapshot.sourceWorkbook).toBe('calculator_final_release.xlsx')
    expect(result.derivedContext.windLoadKpa).toBe(0.3)
    expect(result.derivedContext.snowLoadKpa).toBe(1.2)
    expect(result.autoMaxStepMm).toBe(2550)
    expect(result.sortSteelTop10).toHaveLength(10)
    expect(result.sortSteelTop10[0]?.profile).toBe('пр.180х140х4')
  })

  it('returns a column scaffold snapshot', () => {
    const result = calculateColumn(defaultColumnInput)

    expect(result.snapshot.sourceWorkbook).toBe('column_calculator_final_release.xlsx')
    expect(result.snapshot.status).toBe('in-progress')
    expect(result.derivedContext.windLoadKpa).toBe(0.3)
    expect(result.derivedContext.snowLoadKpa).toBe(2.45)
    expect(result.topCandidates.length).toBeGreaterThanOrEqual(1)
    expect((result.topCandidates[0]?.estimatedCostRub ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(
      result.topCandidates[1]?.estimatedCostRub ?? Number.POSITIVE_INFINITY,
    )
    expect(result.topCandidatesByType.extreme.length).toBeGreaterThanOrEqual(1)
    expect(result.specification.groups).toHaveLength(3)
    expect(result.specification.totalMassKg).toBeGreaterThan(0)
  })

  it('returns a truss parity snapshot with group-level selections', () => {
    const result = calculateTruss(defaultTrussInput)

    expect(result.snapshot.sourceWorkbook).toBe('Калькулятор ферм типа Молодечно v1.0.xlsx')
    expect(result.snapshot.status).toBe('parity-verified')
    expect(result.groups.vp.profile).toBe('тр.200х160х6')
    expect(result.groups.np.profile).toBe('тр.120х5')
    expect(result.groups.orb.profile).toBe('тр.80х4')
    expect(result.groups.or.profile).toBe('тр.80х4')
    expect(result.groups.rr.profile).toBe('тр.60х3')
    expect(result.totalMassKg).toBeCloseTo(1619.8614879362951, 6)
    expect(result.specificMassKgPerM2).toBeCloseTo(11.249038110668716, 6)
  })
})
