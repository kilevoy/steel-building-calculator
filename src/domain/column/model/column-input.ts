import { z } from 'zod'
import {
  MAX_SUPPORTED_BUILDING_HEIGHT_M,
  MAX_SUPPORTED_BUILDING_LENGTH_M,
  MAX_SUPPORTED_WIND_SPAN_M,
  MIN_SUPPORTED_BUILDING_HEIGHT_M,
} from '@/shared/config/calculation-limits'
import {
  columnCityLoads,
  columnCoveringCatalog,
  columnSupportCraneCatalog,
} from '@/domain/column/model/column-reference.generated'

const TERRAIN_TYPES = new Set<string>(['\u0410', '\u0412', '\u0421'])
const BOOLEAN_MODES = new Set<string>(['\u0434\u0430', '\u043d\u0435\u0442', '\u0435\u0441\u0442\u044c'])
const SPAN_BOOLEAN_MODES = new Set<string>(['\u0434\u0430', '\u043d\u0435\u0442'])
const SUPPORT_CRANE_COUNTS = new Set<string>(['\u043e\u0434\u0438\u043d', '\u0434\u0432\u0430'])
export const COLUMN_TYPE_EXTREME = '\u043a\u0440\u0430\u0439\u043d\u044f\u044f'
export const COLUMN_TYPE_MIDDLE = '\u0441\u0440\u0435\u0434\u043d\u044f\u044f'
export const COLUMN_TYPE_FACHWERK = '\u0444\u0430\u0445\u0432\u0435\u0440\u043a\u043e\u0432\u0430\u044f'
export const columnTypeValues = [COLUMN_TYPE_EXTREME, COLUMN_TYPE_FACHWERK, COLUMN_TYPE_MIDDLE] as const
export const columnSelectionModeValues = ['engineering', 'excel'] as const
const columnCities = new Set<string>(columnCityLoads.map((item) => item.city))
const columnCoverings = new Set<string>(columnCoveringCatalog.map((item) => item.name))
const supportCraneCapacities = new Set<string>(
  columnSupportCraneCatalog.map((item) => item.capacityLabel.replace(',', '.')),
)

function isPositiveNumericString(value: string): boolean {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0
}

function normalizeSupportCraneCapacity(value: string): string {
  return value.replace(/\s+/g, '').replace(',', '.')
}

export const columnInputSchema = z.object({
  city: z.string().min(1).refine((value) => columnCities.has(value), 'Unknown column city'),
  responsibilityLevel: z
    .string()
    .min(1)
    .refine(isPositiveNumericString, 'Responsibility level must be a positive number'),
  roofType: z.string().min(1),
  spanM: z.number().positive().max(MAX_SUPPORTED_WIND_SPAN_M),
  buildingLengthM: z.number().positive().max(MAX_SUPPORTED_BUILDING_LENGTH_M),
  buildingHeightM: z.number().min(MIN_SUPPORTED_BUILDING_HEIGHT_M).max(MAX_SUPPORTED_BUILDING_HEIGHT_M),
  roofSlopeDeg: z.number().nonnegative(),
  frameStepM: z.number().positive(),
  facadeColumnStepM: z.number().positive(),
  spansCount: z.string().min(1),
  perimeterBracing: z.string().min(1),
  terrainType: z
    .string()
    .min(1)
    .refine((value) => TERRAIN_TYPES.has(value), 'Unsupported terrain type'),
  roofCoveringType: z
    .string()
    .min(1)
    .refine((value) => columnCoverings.has(value), 'Unknown roof covering type'),
  wallCoveringType: z
    .string()
    .min(1)
    .refine((value) => columnCoverings.has(value), 'Unknown wall covering type'),
  columnType: z.enum(columnTypeValues),
  columnSelectionMode: z.enum(columnSelectionModeValues),
  extraLoadPercent: z.number().nonnegative(),
  supportCraneMode: z.string().min(1).refine((value) => BOOLEAN_MODES.has(value), 'Unsupported support crane mode'),
  supportCraneSingleSpanMode: z
    .string()
    .min(1)
    .refine((value) => SPAN_BOOLEAN_MODES.has(value), 'Unsupported support crane span mode'),
  supportCraneCapacity: z
    .string()
    .min(1)
    .refine(
      (value) => supportCraneCapacities.has(normalizeSupportCraneCapacity(value)),
      'Unknown support crane capacity',
    ),
  supportCraneCount: z
    .string()
    .min(1)
    .refine((value) => SUPPORT_CRANE_COUNTS.has(value), 'Unsupported support crane count'),
  supportCraneRailLevelM: z.number().nonnegative(),
  hangingCraneMode: z.string().min(1).refine((value) => BOOLEAN_MODES.has(value), 'Unsupported hanging crane mode'),
  hangingCraneSingleSpanMode: z
    .string()
    .min(1)
    .refine((value) => SPAN_BOOLEAN_MODES.has(value), 'Unsupported hanging crane span mode'),
  hangingCraneCapacityT: z.number().nonnegative(),
  iBeamS255PriceRubPerKg: z.number().positive(),
  iBeamS355PriceRubPerKg: z.number().positive(),
  tubeS245PriceRubPerKg: z.number().positive(),
  tubeS345PriceRubPerKg: z.number().positive(),
  selectedProfileExtreme: z.number().int().nonnegative(),
  selectedProfileFachwerk: z.number().int().nonnegative(),
  selectedProfileMiddle: z.number().int().nonnegative(),
  isManualMode: z.boolean(),
})

export type ColumnInput = z.infer<typeof columnInputSchema>
export type ColumnType = (typeof columnTypeValues)[number]

export const defaultColumnInput: ColumnInput = {
  city: '\u0423\u0444\u0430',
  responsibilityLevel: '1',
  roofType: '\u0434\u0432\u0443\u0441\u043a\u0430\u0442\u043d\u0430\u044f',
  spanM: 24,
  buildingLengthM: 60,
  buildingHeightM: 10,
  roofSlopeDeg: 6,
  frameStepM: 6,
  facadeColumnStepM: 6,
  spansCount: '\u043e\u0434\u0438\u043d',
  perimeterBracing: '\u043d\u0435\u0442',
  terrainType: '\u0412',
  roofCoveringType: '\u0421-\u041f 150 \u043c\u043c',
  wallCoveringType: '\u0421-\u041f 100 \u043c\u043c',
  columnType: '\u043a\u0440\u0430\u0439\u043d\u044f\u044f',
  columnSelectionMode: 'engineering',
  extraLoadPercent: 15,
  supportCraneMode: '\u043d\u0435\u0442',
  supportCraneSingleSpanMode: '\u0434\u0430',
  supportCraneCapacity: '5',
  supportCraneCount: '\u043e\u0434\u0438\u043d',
  supportCraneRailLevelM: 3.5,
  hangingCraneMode: '\u043d\u0435\u0442',
  hangingCraneSingleSpanMode: '\u0434\u0430',
  hangingCraneCapacityT: 2,
  iBeamS255PriceRubPerKg: 148.8,
  iBeamS355PriceRubPerKg: 155.88,
  tubeS245PriceRubPerKg: 130.2,
  tubeS345PriceRubPerKg: 141,
  selectedProfileExtreme: 0,
  selectedProfileFachwerk: 0,
  selectedProfileMiddle: 0,
  isManualMode: false,
}
