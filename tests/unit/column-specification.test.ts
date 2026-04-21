import { calculateColumn } from '@/domain/column/model/calculate-column'
import { defaultColumnInput } from '@/domain/column/model/column-input'
import { columnBraceUnitMassKgPerM } from '@/domain/column/model/column-reference.generated'

function findGroup(result: ReturnType<typeof calculateColumn>, key: 'extreme' | 'fachwerk' | 'middle') {
  const group = result.specification.groups.find((item) => item.key === key)
  if (!group) {
    throw new Error(`Missing group ${key}`)
  }
  return group
}

describe('column specification geometry', () => {
  it('calculates group counts with formula-based rules', () => {
    const result = calculateColumn({
      ...defaultColumnInput,
      roofType: 'gable',
      spansCount: 'single',
      buildingLengthM: 60,
      frameStepM: 6,
      spanM: 24,
      facadeColumnStepM: 6,
    })

    expect(findGroup(result, 'extreme').columnsCount).toBe(18)
    expect(findGroup(result, 'fachwerk').columnsCount).toBe(10)
    expect(findGroup(result, 'middle').columnsCount).toBe(0)
  })

  it('uses H_max for candidate analysis in gable roof groups', () => {
    const result = calculateColumn({
      ...defaultColumnInput,
      roofType: 'gable',
      spansCount: 'multi',
      buildingHeightM: 10,
      spanM: 24,
      roofSlopeDeg: 6,
    })
    const fachwerk = findGroup(result, 'fachwerk')
    const selected = result.topCandidatesByType.fachwerk[0]
    const expectedCriticalHeight = 10 + (24 / 2) * Math.tan((6 / 180) * Math.PI)
    const expectedCandidateMass =
      selected.unitMassKg * expectedCriticalHeight * 1.15 +
      (selected.braceCount ?? 0) * defaultColumnInput.facadeColumnStepM * columnBraceUnitMassKgPerM * 1.15

    expect(fachwerk.criticalHeightM).toBeCloseTo(expectedCriticalHeight, 10)
    expect(Math.max(...fachwerk.geometryLengthsM)).toBeCloseTo(expectedCriticalHeight, 10)
    expect(selected.totalMassKg).toBeCloseTo(expectedCandidateMass, 10)
  })

  it('builds total mass from selected profile and actual geometry lengths', () => {
    const result = calculateColumn({
      ...defaultColumnInput,
      roofType: 'monopitch',
      spansCount: 'single',
      buildingHeightM: 10,
      spanM: 24,
      roofSlopeDeg: 5,
      frameStepM: 6,
    })
    const extreme = findGroup(result, 'extreme')
    const selected = extreme.selectedCandidate

    expect(selected).toBeDefined()

    const expectedColumnsMass =
      extreme.geometryLengthsM.reduce((sum, heightM) => sum + heightM * 1.15, 0) * (selected?.unitMassKg ?? 0)
    const expectedBracesMass =
      (selected?.braceCount ?? 0) * extreme.columnsCount * defaultColumnInput.frameStepM * columnBraceUnitMassKgPerM * 1.15

    expect(extreme.columnsMassKg).toBeCloseTo(expectedColumnsMass, 10)
    expect(extreme.bracesMassKg).toBeCloseTo(expectedBracesMass, 10)
    expect(extreme.totalMassKg).toBeCloseTo(expectedColumnsMass + expectedBracesMass, 10)
  })
})
