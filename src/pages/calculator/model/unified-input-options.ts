import {
  COLUMN_TYPE_EXTREME,
  COLUMN_TYPE_FACHWERK,
  COLUMN_TYPE_MIDDLE,
} from '@/domain/column/model/column-input'
import {
  columnCityLoads,
  columnCoveringCatalog,
  columnSupportCraneCatalog,
} from '@/domain/column/model/column-reference.generated'
import {
  purlinCityLoads,
  purlinCoveringCatalog,
  purlinProfileSheetIndices,
} from '@/domain/purlin/model/purlin-reference.generated'

export const TERRAIN_OPTIONS = ['А', 'В', 'С'] as const
export const ROOF_TYPE_OPTIONS = ['двускатная', 'односкатная'] as const
export const SPANS_COUNT_OPTIONS = ['один', 'более одного'] as const
export const PRESENCE_OPTIONS = ['нет', 'есть'] as const
export const YES_NO_OPTIONS = ['нет', 'да'] as const
export const SNOW_BAG_MODE_OPTIONS = ['нет', 'вдоль здания', 'поперёк здания'] as const
export const COLUMN_TYPE_OPTIONS = [
  COLUMN_TYPE_EXTREME,
  COLUMN_TYPE_FACHWERK,
  COLUMN_TYPE_MIDDLE,
] as const
export const PURLIN_SPECIFICATION_SOURCE_OPTIONS = ['sort', 'lstk'] as const
export const PURLIN_SELECTION_MODE_OPTIONS = ['auto', 'manual'] as const
export const COLUMN_SELECTION_MODE_OPTIONS = ['engineering', 'excel'] as const
export const SUPPORT_CRANE_COUNT_OPTIONS = ['один', 'два'] as const
export const SPAN_MODE_OPTIONS = ['да', 'нет'] as const

const purlinCitySet = new Set(purlinCityLoads.map((item) => item.city))
export const UNIFIED_CITY_OPTIONS = columnCityLoads
  .map((item) => item.city)
  .filter((city, index, list) => purlinCitySet.has(city) && list.indexOf(city) === index)

const purlinCoveringSet = new Set(purlinCoveringCatalog.map((item) => item.name))
export const UNIFIED_COVERING_OPTIONS = columnCoveringCatalog
  .map((item) => item.name)
  .filter((name, index, list) => purlinCoveringSet.has(name) && list.indexOf(name) === index)

export const PROFILE_SHEET_OPTIONS = purlinProfileSheetIndices.map((item) => item.profileSheet)

export const SUPPORT_CRANE_CAPACITY_OPTIONS = Array.from(
  new Set(columnSupportCraneCatalog.map((item) => item.capacityLabel.replace(/\s+/g, '').replace(',', '.'))),
).sort((left, right) => Number(left) - Number(right))

export const DEFAULT_UNIFIED_CITY = UNIFIED_CITY_OPTIONS[0] ?? 'Альметьевск'
export const DEFAULT_ROOF_COVERING =
  UNIFIED_COVERING_OPTIONS.find((item) => item === 'С-П 150 мм') ?? UNIFIED_COVERING_OPTIONS[0] ?? 'С-П 150 мм'
export const DEFAULT_WALL_COVERING =
  UNIFIED_COVERING_OPTIONS.find((item) => item === 'С-П 100 мм') ?? UNIFIED_COVERING_OPTIONS[0] ?? 'С-П 100 мм'
export const DEFAULT_PROFILE_SHEET =
  PROFILE_SHEET_OPTIONS.find((item) => item === 'С44-1000-0,7') ?? PROFILE_SHEET_OPTIONS[0] ?? 'С44-1000-0,7'
export const DEFAULT_NORMATIVE_MODE = 'по СП 20.13330.20ХХ'
