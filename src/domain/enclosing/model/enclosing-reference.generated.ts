export const ENCLOSING_CLASS_KEYS = ['class-1-gost', 'class-2-tu'] as const

export type EnclosingClassKey = (typeof ENCLOSING_CLASS_KEYS)[number]

export const enclosingPanelPriceRubPerM2: Record<
  EnclosingClassKey,
  {
    wallZLock: Record<number, number>
    roofK: Record<number, number>
  }
> = {
  'class-1-gost': {
    wallZLock: {
      50: 3465,
      60: 3590,
      80: 3770,
      100: 3905,
      120: 4160,
      150: 4455,
      170: 4730,
      200: 4845,
      250: 5470,
    },
    roofK: {
      50: 3745,
      60: 3850,
      80: 4020,
      100: 4175,
      120: 4415,
      150: 4705,
      170: 5015,
      200: 5105,
      250: 5715,
    },
  },
  'class-2-tu': {
    wallZLock: {
      50: 2845,
      60: 3005,
      80: 3315,
      100: 3425,
      120: 3645,
      150: 3885,
      170: 4095,
      200: 4205,
      250: 4395,
    },
    roofK: {
      80: 3535,
      100: 3660,
      120: 3870,
      150: 4080,
      170: 4340,
      200: 4435,
      250: 4595,
    },
  },
}

export const enclosingFastenerReference = {
  metalHarpoonToSteelUpTo12_5mm: {
    wallZLockLengthMmByThickness: {
      50: 105,
      60: 105,
      80: 115,
      100: 140,
      120: 160,
      150: 190,
      170: 240,
      180: 240,
      200: 240,
      250: 315,
      300: 350,
    },
    roofKLengthMmByThickness: {
      50: 140,
      60: 150,
      80: 190,
      100: 190,
      120: 240,
      150: 240,
      170: 285,
      180: 285,
      200: 285,
      250: 350,
    },
  },
} as const

export const enclosingAccessoriesReference = {
  flatSheetMultiplier: 1.9,
  formula: 'accessoryCostRubPerM2 = flatSheetPriceRubPerM2 * 1.9',
} as const
