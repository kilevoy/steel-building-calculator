import { z } from 'zod'

export const enclosingInputSchema = z.object({
  roofType: z.string().min(1),
  spanM: z.number().positive(),
  buildingLengthM: z.number().positive(),
  buildingHeightM: z.number().positive(),
  frameStepM: z.number().positive().default(6),
  roofPurlinStepM: z.number().positive().default(1.5),
  roofSlopeDeg: z.number().nonnegative(),
  wallPanelThicknessMm: z.number().positive(),
  roofPanelThicknessMm: z.number().positive(),
  openingsAreaM2: z.number().nonnegative().default(0),
})

export type EnclosingInput = z.output<typeof enclosingInputSchema>
export type EnclosingInputRaw = z.input<typeof enclosingInputSchema>
