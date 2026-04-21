import fs from 'node:fs'
import {
  COLUMN_TYPE_EXTREME,
  COLUMN_TYPE_FACHWERK,
  COLUMN_TYPE_MIDDLE,
  defaultColumnInput,
  type ColumnInput,
  type ColumnType,
} from '@/domain/column/model/column-input'
import { calculateColumn } from '@/domain/column/model/calculate-column'
import { calculateColumnTopCandidatesForType } from '@/domain/column/model/column-ranking'
import { buildColumnDerivedContext } from '@/domain/column/model/column-derived-context'

type Scenario = {
  id: string
  name: string
  city: string
  responsibilityLevel: string
  roofType: string
  spanM: number
  buildingLengthM: number
  buildingHeightM: number
  roofSlopeDeg: number
  frameStepM: number
  facadeColumnStepM: number
  spansCount: string
  perimeterBracing: string
  terrainType: string
  roofCoveringType: string
  wallCoveringType: string
  extraLoadPercent: number
  supportCraneMode: string
  supportCraneSingleSpanMode: string
  supportCraneCapacity: string
  supportCraneCount: string
  supportCraneRailLevelM: number
  hangingCraneMode: string
  hangingCraneSingleSpanMode: string
  hangingCraneCapacityT: number
}

type CandidateLite = {
  profile: string
  steelGrade: string
  braceCount: number
  utilization: number
}

const typeToGroupKey: Record<ColumnType, 'extreme' | 'fachwerk' | 'middle'> = {
  [COLUMN_TYPE_EXTREME]: 'extreme',
  [COLUMN_TYPE_FACHWERK]: 'fachwerk',
  [COLUMN_TYPE_MIDDLE]: 'middle',
}

const types: ColumnType[] = [COLUMN_TYPE_EXTREME, COLUMN_TYPE_FACHWERK, COLUMN_TYPE_MIDDLE]

function toLite(list: ReturnType<typeof calculateColumnTopCandidatesForType>): CandidateLite[] {
  return list.slice(0, 10).map((item) => ({
    profile: item.profile,
    steelGrade: item.steelGrade,
    braceCount: item.braceCount ?? 0,
    utilization: item.utilization,
  }))
}

function buildBaseInput(s: Scenario): ColumnInput {
  return {
    ...defaultColumnInput,
    city: s.city,
    responsibilityLevel: s.responsibilityLevel,
    roofType: s.roofType,
    spanM: s.spanM,
    buildingLengthM: s.buildingLengthM,
    buildingHeightM: s.buildingHeightM,
    roofSlopeDeg: s.roofSlopeDeg,
    frameStepM: s.frameStepM,
    facadeColumnStepM: s.facadeColumnStepM,
    spansCount: s.spansCount,
    perimeterBracing: s.perimeterBracing,
    terrainType: s.terrainType,
    roofCoveringType: s.roofCoveringType,
    wallCoveringType: s.wallCoveringType,
    extraLoadPercent: s.extraLoadPercent,
    supportCraneMode: s.supportCraneMode,
    supportCraneSingleSpanMode: s.supportCraneSingleSpanMode,
    supportCraneCapacity: s.supportCraneCapacity,
    supportCraneCount: s.supportCraneCount,
    supportCraneRailLevelM: s.supportCraneRailLevelM,
    hangingCraneMode: s.hangingCraneMode,
    hangingCraneSingleSpanMode: s.hangingCraneSingleSpanMode,
    hangingCraneCapacityT: s.hangingCraneCapacityT,
    columnType: COLUMN_TYPE_EXTREME,
    isManualMode: false,
    selectedProfileExtreme: 0,
    selectedProfileFachwerk: 0,
    selectedProfileMiddle: 0,
  }
}

function run() {
  const inputPath = process.argv[2]
  const outputPath = process.argv[3]

  if (!inputPath || !outputPath) {
    throw new Error('Usage: vite-node --script scripts/app_scenarios_dump.ts <input.json> <output.json>')
  }

  const scenarios = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as Scenario[]

  const result = scenarios.map((scenario) => {
    const baseInput = buildBaseInput(scenario)
    const appCalculation = calculateColumn(baseInput)

    const typesPayload = types.map((type) => {
      const key = typeToGroupKey[type]
      const group = appCalculation.specification.groups.find((item) => item.key === key)
      const criticalHeightM = group?.criticalHeightM ?? baseInput.buildingHeightM

      const inputNoHmax: ColumnInput = {
        ...baseInput,
        columnType: type,
        buildingHeightM: baseInput.buildingHeightM,
      }

      const inputHmax: ColumnInput = {
        ...baseInput,
        columnType: type,
        buildingHeightM: criticalHeightM,
      }

      const noHmaxCandidates = calculateColumnTopCandidatesForType(inputNoHmax, type, {
        analysisHeightM: baseInput.buildingHeightM,
      })
      const appHmaxCandidates = calculateColumnTopCandidatesForType(inputHmax, type, {
        analysisHeightM: criticalHeightM,
      })
      const derivedNoHmax = buildColumnDerivedContext(inputNoHmax)
      const derivedHmax = buildColumnDerivedContext(inputHmax)

      return {
        type,
        criticalHeightM,
        loadsNoHmax: {
          N: derivedNoHmax.axialLoadKn,
          M: derivedNoHmax.bendingMomentKnM,
        },
        loadsHmax: {
          N: derivedHmax.axialLoadKn,
          M: derivedHmax.bendingMomentKnM,
        },
        topNoHmax: toLite(noHmaxCandidates),
        topAppHmax: toLite(appHmaxCandidates),
      }
    })

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      types: typesPayload,
    }
  })

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8')
}

run()
