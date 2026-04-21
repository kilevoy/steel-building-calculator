import { buildPurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import { purlinInputSchema, type PurlinInput } from '@/domain/purlin/model/purlin-input'
import { calculateMp350FamilyCandidates } from '@/domain/purlin/model/purlin-lstk-mp350'
import { calculateMp390FamilyCandidates } from '@/domain/purlin/model/purlin-lstk-mp390'
import {
  calculatePurlinAutoMaxStepMm,
  calculatePurlinDesignLoad,
  calculatePurlinDesignSnowLoad,
  calculatePurlinFacadeWindPressure,
  calculatePurlinServiceLoad,
  calculatePurlinWindPressure,
} from '@/domain/purlin/model/purlin-load-chain'
import type { PurlinCalculationResult } from '@/domain/purlin/model/purlin-output'
export type { PurlinCalculationResult }
import { calculateSortSteelTopCandidates } from '@/domain/purlin/model/purlin-sort-steel'

export function calculatePurlin(input: PurlinInput): PurlinCalculationResult {
  const validated = purlinInputSchema.parse(input)
  const derivedContext = buildPurlinDerivedContext(validated)
  const autoMaxStepMm = calculatePurlinAutoMaxStepMm(validated, derivedContext)
  const designSnowKpa = calculatePurlinDesignSnowLoad(validated, derivedContext)
  const windRoofKpa = calculatePurlinWindPressure(validated, derivedContext)
  const windFacadeKpa = calculatePurlinFacadeWindPressure(validated, derivedContext)
  const serviceKpa = calculatePurlinServiceLoad(validated, derivedContext)
  const designTotalKpa = calculatePurlinDesignLoad(validated, derivedContext)
  const sortSteelCandidates = calculateSortSteelTopCandidates(validated, derivedContext)
  const mp350Candidates = calculateMp350FamilyCandidates(validated, derivedContext)
  const mp390Candidates = calculateMp390FamilyCandidates(validated, derivedContext)
  const hasMp350Candidates = mp350Candidates.length > 0
  const hasMp390Candidates = mp390Candidates.length > 0

  return {
    snapshot: {
      sourceWorkbook: 'calculator_final_release.xlsx',
      sourceSheets: ['Подбор ЛСТК МП350', 'Подбор ЛСТК МП390', 'ТОП-10 сортовой', 'Результаты'],
      status: hasMp350Candidates || hasMp390Candidates || sortSteelCandidates.length > 0 ? 'in-progress' : 'scaffolded',
      note: sortSteelCandidates.length > 0
        ? `Workbook-derived sort steel top-10 is transferred for ${validated.city}; LSTK MP350 and MP390 branches are also available.`
        : `Load chain is transferred, but the first result branches are still missing for ${validated.city}.`,
    },
    derivedContext,
    autoMaxStepMm,
    loadSummary: {
      frameStepM: validated.frameStepM,
      snowRegionKpa: derivedContext.snowLoadKpa,
      windRegionKpa: derivedContext.windLoadKpa,
      coveringKpa: derivedContext.coveringLoadKpa,
      snowBagFactor: derivedContext.snowBagFactor,
      designSnowKpa,
      windRoofKpa,
      windFacadeKpa,
      serviceKpa,
      designTotalKpa,
      autoMaxStepMm,
      manualMinStepMm: validated.manualMinStepMm,
      manualMaxStepMm: validated.manualMaxStepMm,
    },
    sortSteelTop10: sortSteelCandidates,
    lstkMp350Top: mp350Candidates,
    lstkMp390Top: mp390Candidates,
  }
}
