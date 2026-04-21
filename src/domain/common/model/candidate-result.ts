export interface CandidateExcelMetrics {
  lineLabel?: string
  displayCostThousandsRub?: number
  unitMassPerMeterKg?: number
  massPerMeterKg?: number
  massPerStepKg?: number
  developedLengthM?: number
  massWithBracesKg?: number
  blackMassKg?: number | null
  galvanizedMassKg?: number | null
}

export interface CandidateResult {
  family?: string
  profile: string
  utilization: number
  steelGrade: string
  priceTonRub?: number
  criterion?: string
  braceCount?: number
  stepMm?: number
  unitMassKg: number
  totalMassKg: number
  objectiveValue?: number
  estimatedCostRub?: number
  excelMetrics?: CandidateExcelMetrics
  note?: string
}

export interface CalculationSnapshot {
  sourceWorkbook: string
  sourceSheets: string[]
  status: 'scaffolded' | 'in-progress' | 'parity-verified'
  note: string
}
