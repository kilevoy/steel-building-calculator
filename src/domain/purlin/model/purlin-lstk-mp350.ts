import type { CandidateResult } from '@/domain/common/model/candidate-result'
import type { PurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import type { PurlinInput } from '@/domain/purlin/model/purlin-input'
import { calculateLstkFamilyCandidates, type LstkFamilyConfig } from '@/domain/purlin/model/purlin-lstk-shared'
import {
  purlinLstkMp3502PsProfiles,
  purlinLstkMp3502TpsProfiles,
  purlinLstkMp350StepAxis,
  purlinLstkMp350ZProfiles,
} from '@/domain/purlin/model/purlin-reference.generated'

const mp350FamilyConfigs: readonly LstkFamilyConfig[] = [
  {
    family: 'MP350 / 2TPS',
    profiles: purlinLstkMp3502TpsProfiles,
    objectiveKind: 'standard',
    requiresPanelFilter: true,
  },
  {
    family: 'MP350 / 2PS',
    profiles: purlinLstkMp3502PsProfiles,
    objectiveKind: 'standard',
    requiresPanelFilter: false,
  },
  {
    family: 'MP350 / Z',
    profiles: purlinLstkMp350ZProfiles,
    objectiveKind: 'z',
    requiresPanelFilter: false,
  },
] as const

export function calculateMp350FamilyCandidates(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
): CandidateResult[] {
  return calculateLstkFamilyCandidates(input, derivedContext, purlinLstkMp350StepAxis, mp350FamilyConfigs)
}

export function calculateMp3502TpsTopCandidate(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
): CandidateResult | null {
  return (
    calculateMp350FamilyCandidates(input, derivedContext).find(
      (candidate) => candidate.family === 'MP350 / 2TPS',
    ) ?? null
  )
}
