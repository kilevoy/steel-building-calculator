import { z } from 'zod'
import {
  MAX_SUPPORTED_BUILDING_HEIGHT_M,
  MAX_SUPPORTED_BUILDING_LENGTH_M,
  MAX_SUPPORTED_WIND_SPAN_M,
  MIN_SUPPORTED_BUILDING_HEIGHT_M,
} from '@/shared/config/calculation-limits'
import {
  purlinCityLoads,
  purlinCoveringCatalog,
  purlinProfileSheetIndices,
} from '@/domain/purlin/model/purlin-reference.generated'

const NO_SNOW_BAG_MODE = 'нет'
const TERRAIN_TYPES = new Set<string>(['А', 'В', 'С'])
const purlinCities = new Set<string>(purlinCityLoads.map((item) => item.city))
const purlinCoverings = new Set<string>(purlinCoveringCatalog.map((item) => item.name))
const purlinProfileSheets = new Set<string>(purlinProfileSheetIndices.map((item) => item.profileSheet))

function isPositiveNumericString(value: string): boolean {
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0
}

function isNoOrPositiveNumericString(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized === 'нет' || isPositiveNumericString(normalized)
}

export const purlinInputSchema = z
  .object({
    city: z.string().min(1).refine((value) => purlinCities.has(value), 'Unknown purlin city'),
    normativeMode: z.string().min(1),
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
    fakhverkSpacingM: z.number().positive(),
    terrainType: z
      .string()
      .min(1)
      .refine((value) => TERRAIN_TYPES.has(value), 'Unsupported terrain type'),
    coveringType: z
      .string()
      .min(1)
      .refine((value) => purlinCoverings.has(value), 'Unknown purlin covering type'),
    profileSheet: z
      .string()
      .min(1)
      .refine((value) => purlinProfileSheets.has(value), 'Unknown purlin profile sheet'),
    snowBagMode: z.string().min(1),
    heightDifferenceM: z.number().nonnegative(),
    adjacentBuildingSizeM: z.number().nonnegative(),
    manualMaxStepMm: z.number().nonnegative(),
    manualMinStepMm: z.number().nonnegative(),
    maxUtilizationRatio: z.number().positive().max(1),
    tiesSetting: z
      .string()
      .min(1)
      .refine(isNoOrPositiveNumericString, 'Ties setting must be "нет" or a positive number'),
    braceSpacingM: z.number().positive(),
    snowRetentionPurlin: z.string().min(1),
    barrierPurlin: z.string().min(1),
    iBeamS255PriceRubPerKg: z.number().positive(),
    iBeamS355PriceRubPerKg: z.number().positive(),
    tubeS245PriceRubPerKg: z.number().positive(),
    tubeS345PriceRubPerKg: z.number().positive(),
    channelS245PriceRubPerKg: z.number().positive(),
    channelS345PriceRubPerKg: z.number().positive(),
    lstkMp350PriceRubPerKg: z.number().positive(),
    lstkMp390PriceRubPerKg: z.number().positive(),
  })
  .superRefine((input, ctx) => {
    if (input.manualMaxStepMm > 0 && input.manualMinStepMm > input.manualMaxStepMm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['manualMinStepMm'],
        message: 'Manual minimum step cannot be greater than manual maximum step',
      })
    }

    if (input.snowBagMode.trim().toLowerCase() === NO_SNOW_BAG_MODE) {
      return
    }

    if (input.heightDifferenceM <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['heightDifferenceM'],
        message: 'Height difference must be positive when snow bag mode is enabled',
      })
    }

    if (input.adjacentBuildingSizeM <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['adjacentBuildingSizeM'],
        message: 'Adjacent building size must be positive when snow bag mode is enabled',
      })
    }

  })

export type PurlinInput = z.infer<typeof purlinInputSchema>

export const defaultPurlinInput: PurlinInput = {
  city: 'Челябинск',
  normativeMode: 'по СП 20.13330.20ХХ',
  responsibilityLevel: '1',
  roofType: 'односкатная',
  spanM: 24,
  buildingLengthM: 60,
  buildingHeightM: 10,
  roofSlopeDeg: 6,
  frameStepM: 6,
  fakhverkSpacingM: 6,
  terrainType: 'В',
  coveringType: 'С-П 150 мм',
  profileSheet: 'С44-1000-0,7',
  snowBagMode: 'нет',
  heightDifferenceM: 4.5,
  adjacentBuildingSizeM: 9.5,
  manualMaxStepMm: 0,
  manualMinStepMm: 0,
  maxUtilizationRatio: 0.8,
  tiesSetting: 'нет',
  braceSpacingM: 3,
  snowRetentionPurlin: 'нет',
  barrierPurlin: 'нет',
  iBeamS255PriceRubPerKg: 150,
  iBeamS355PriceRubPerKg: 160,
  tubeS245PriceRubPerKg: 160,
  tubeS345PriceRubPerKg: 170,
  channelS245PriceRubPerKg: 170,
  channelS345PriceRubPerKg: 180,
  lstkMp350PriceRubPerKg: 170,
  lstkMp390PriceRubPerKg: 170,
}

