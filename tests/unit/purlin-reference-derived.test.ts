import {
  purlinLstkMp3502PsProfiles,
  purlinLstkMp3502TpsProfiles,
  purlinLstkMp350ZProfiles,
  purlinLstkMp3902PsProfiles,
  purlinLstkMp3902TpsProfiles,
  purlinLstkMp390ZProfiles,
} from '../../src/domain/purlin/model/purlin-reference.generated'

function deriveExpectedPanelThickness(profile: string): number {
  const profilePart = profile.trim().split(/\s+/)[1]
  const depthMatch = profilePart?.match(/\d+/)

  if (!depthMatch) {
    throw new Error(`Unable to derive panel thickness from profile: ${profile}`)
  }

  const depthMm = Number(depthMatch[0])
  return Math.ceil(depthMm / 50) * 50
}

describe('purlin reference derived fields', () => {
  it('derives the required panel thickness from every 2TPS profile depth', () => {
    const allTpsProfiles = [...purlinLstkMp3502TpsProfiles, ...purlinLstkMp3902TpsProfiles]

    for (const profile of allTpsProfiles) {
      expect(profile.requiredPanelThicknessMm).toBe(deriveExpectedPanelThickness(profile.profile))
    }
  })

  it('keeps non-2TPS families free from panel-thickness derivation', () => {
    const profilesWithoutPanelThickness = [
      ...purlinLstkMp3502PsProfiles,
      ...purlinLstkMp350ZProfiles,
      ...purlinLstkMp3902PsProfiles,
      ...purlinLstkMp390ZProfiles,
    ]

    for (const profile of profilesWithoutPanelThickness) {
      expect(profile.requiredPanelThicknessMm).toBeNull()
    }
  })
})
