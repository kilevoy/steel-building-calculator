import type { CandidateResult } from '@/domain/common/model/candidate-result'
import type { PurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import type { PurlinInput } from '@/domain/purlin/model/purlin-input'
import { calculateLstkFamilyCandidates, type LstkFamilyConfig } from '@/domain/purlin/model/purlin-lstk-shared'
import {
  purlinLstkMp350StepAxis,
  purlinLstkMp3902PsProfiles,
  purlinLstkMp3902TpsProfiles,
  purlinLstkMp390ZProfiles,
} from '@/domain/purlin/model/purlin-reference.generated'

const mp390FamilyConfigs: readonly LstkFamilyConfig[] = [
  {
    family: 'MP390 / 2TPS',
    profiles: purlinLstkMp3902TpsProfiles,
    objectiveKind: 'standard',
    requiresPanelFilter: true,
  },
  {
    family: 'MP390 / 2PS',
    profiles: purlinLstkMp3902PsProfiles,
    objectiveKind: 'standard',
    requiresPanelFilter: false,
  },
  {
    family: 'MP390 / Z',
    profiles: purlinLstkMp390ZProfiles,
    objectiveKind: 'z',
    requiresPanelFilter: false,
  },
] as const

export function calculateMp390FamilyCandidates(
  input: PurlinInput,
  derivedContext: PurlinDerivedContext,
): CandidateResult[] {
  return calculateLstkFamilyCandidates(input, derivedContext, purlinLstkMp350StepAxis, mp390FamilyConfigs)
}
