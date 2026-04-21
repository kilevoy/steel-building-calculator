import { calculateColumn } from '@/domain/column/model/calculate-column'
import { defaultColumnInput } from '@/domain/column/model/column-input'
import { columnBraceUnitMassKgPerM } from '@/domain/column/model/column-reference.generated'
import { calculateColumnTopCandidates } from '@/domain/column/model/column-ranking'

describe('column ranking', () => {
  it('returns a ranked top list sorted by workbook objective (AU)', () => {
    const candidates = calculateColumnTopCandidates(defaultColumnInput)

    expect(candidates).toHaveLength(10)

    for (let index = 1; index < candidates.length; index += 1) {
      const previous = candidates[index - 1]
      const current = candidates[index]
      const previousObjective = previous?.objectiveValue ?? Number.POSITIVE_INFINITY
      const currentObjective = current?.objectiveValue ?? Number.POSITIVE_INFINITY

      expect(previousObjective).toBeLessThanOrEqual(currentObjective)
    }
  })

  it('surfaces grouped top lists through aggregate column calculation', () => {
    const result = calculateColumn(defaultColumnInput)

    expect(result.topCandidates.length).toBeGreaterThanOrEqual(1)
    expect(result.topCandidatesByType.extreme.length).toBeGreaterThanOrEqual(1)
    expect(result.topCandidatesByType.fachwerk.length).toBeGreaterThanOrEqual(1)
    expect(result.topCandidatesByType.middle.length).toBeGreaterThanOrEqual(1)
    expect(result.isManualMode).toBe(false)
  })

  it('matches workbook-driven top order for default extreme scenario', () => {
    const candidates = calculateColumnTopCandidates(defaultColumnInput)
    const signatures = candidates.slice(0, 10).map((candidate) => `${candidate.profile}|${candidate.steelGrade}|${candidate.braceCount ?? 0}`)

    expect(signatures).toEqual([
      '40 Б1|С255Б|2',
      '40 Б1|С355Б|2',
      '35 Ш1|С355Б|1',
      '35 Б2|С355Б|3',
      '40 Б1|С255Б|3',
      '40 Б1|С355Б|3',
      '35 Ш1|С255Б|2',
      '35 Ш1|С355Б|2',
      '40 Б2|С255Б|2',
      '40 Б2|С355Б|2',
    ])
  })

  it('uses profile index 0 for all groups in automatic mode', () => {
    const result = calculateColumn({
      ...defaultColumnInput,
      isManualMode: false,
      selectedProfileExtreme: 3,
      selectedProfileFachwerk: 4,
      selectedProfileMiddle: 5,
    })

    expect(result.selectedProfileByType.extreme).toBe(0)
    expect(result.selectedProfileByType.fachwerk).toBe(0)
    expect(result.selectedProfileByType.middle).toBe(0)
  })

  it('builds specification from manually selected profile constants', () => {
    const input = {
      ...defaultColumnInput,
      spansCount: 'Р±РѕР»РµРµ РѕРґРЅРѕРіРѕ',
      isManualMode: true,
      selectedProfileExtreme: 1,
      selectedProfileFachwerk: 2,
      selectedProfileMiddle: 3,
    } as const
    const result = calculateColumn(input)
    const extremeGroup = result.specification.groups.find((group) => group.key === 'extreme')
    const selectedExtreme = result.topCandidatesByType.extreme[result.selectedProfileByType.extreme]

    expect(extremeGroup).toBeDefined()
    expect(extremeGroup?.selectedCandidate?.profile).toBe(selectedExtreme?.profile)
    expect(extremeGroup?.selectedCandidate?.steelGrade).toBe(selectedExtreme?.steelGrade)
    const expectedColumnsMass =
      (extremeGroup?.geometryLengthsM.reduce((sum, heightM) => sum + heightM * 1.15, 0) ?? 0) *
      (selectedExtreme?.unitMassKg ?? 0)
    const expectedBracesMass =
      (selectedExtreme?.braceCount ?? 0) * input.frameStepM * columnBraceUnitMassKgPerM * 1.15 * (extremeGroup?.columnsCount ?? 0)
    expect(extremeGroup?.totalMassKg).toBeCloseTo(
      expectedColumnsMass + expectedBracesMass,
      10,
    )
  })
})
