import { z } from 'zod'
import { trussLimitsAndConstants } from './truss-reference.generated'

function isPositiveNumericString(value: string): boolean {
  const normalized = Number(value.trim().replace(',', '.'))
  return Number.isFinite(normalized) && normalized > 0
}

const trussLimitsSchema = z.object({
  minThicknessMm: z.object({
    vp: z.number().nonnegative(),
    np: z.number().nonnegative(),
    orb: z.number().nonnegative(),
    or: z.number().nonnegative(),
    rr: z.number().nonnegative(),
  }),
  maxWidthMm: z.object({
    vp: z.number().nonnegative(),
    np: z.number().nonnegative(),
  }),
  minWidthMm: z.object({
    orb: z.number().nonnegative(),
    or: z.number().nonnegative(),
    rr: z.number().nonnegative(),
  }),
})

const defaultTrussLimits = {
  minThicknessMm: {
    vp: trussLimitsAndConstants.minThicknessMm.vp,
    np: trussLimitsAndConstants.minThicknessMm.np,
    orb: trussLimitsAndConstants.minThicknessMm.orb,
    or: trussLimitsAndConstants.minThicknessMm.or,
    rr: trussLimitsAndConstants.minThicknessMm.rr,
  },
  maxWidthMm: {
    vp: trussLimitsAndConstants.maxWidthMm.vp,
    np: trussLimitsAndConstants.maxWidthMm.np,
  },
  minWidthMm: {
    orb: trussLimitsAndConstants.minWidthMm.orb,
    or: trussLimitsAndConstants.minWidthMm.or,
    rr: trussLimitsAndConstants.minWidthMm.rr,
  },
} satisfies z.input<typeof trussLimitsSchema>

export const trussInputSchema = z.object({
  spanM: z.number().min(18).max(30),
  frameStepM: z.number().positive(),
  roofSlopeDeg: z.number().nonnegative().max(89),
  responsibilityLevel: z
    .string()
    .min(1)
    .refine(isPositiveNumericString, 'Responsibility level must be a positive number'),
  designSnowKpa: z.number().nonnegative(),
  windRoofKpa: z.number().nonnegative(),
  coveringKpa: z.number().nonnegative(),
  purlinBracingStepMm: z.number().nonnegative().default(0),
  limits: trussLimitsSchema.default(defaultTrussLimits),
})

export type TrussInput = z.infer<typeof trussInputSchema>

export const defaultTrussInput: TrussInput = {
  spanM: 24,
  frameStepM: 6,
  roofSlopeDeg: 6,
  responsibilityLevel: '1',
  designSnowKpa: 2.076800402783843,
  windRoofKpa: 0.106912366848,
  coveringKpa: 0.24,
  purlinBracingStepMm: 0,
  limits: defaultTrussLimits,
}
