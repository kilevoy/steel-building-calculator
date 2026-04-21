# Purlin Slice 04: MP390 Family Block

## Status

Implemented in TypeScript and covered by unit tests against the default workbook scenario.

## Workbook Source

- `../calculator_stage1_internalized.xlsx`
- sheet `ЛСТК МП390`
- summary output `Лист1!D68:G70`

## Transferred Families

- `MP390 / 2TPS`
  - workbook row `27`
- `MP390 / 2PS`
  - workbook row `28`
- `MP390 / Z`
  - workbook row `29`

## Implementation Notes

- the selection engine is now shared between `MP350` and `MP390`
- `MP390` uses the same step axis and the same family objective rules
- profile resistances and masses are read from the `ЛСТК МП390` sheet and fed into the shared engine

## Default Workbook Parity

- `MP390 / 2TPS`
  - profile: `2ТПС 245х65х2`
  - step: `2340 мм`
  - mass: `822.8592 кг`
- `MP390 / 2PS`
  - profile: `2ПС 245х65х1,5`
  - step: `1825 мм`
  - mass: `771.96 кг`
- `MP390 / Z`
  - profile: `Z 350х2`
  - step: `2395 мм`
  - mass: `606.32 кг`

## Code

- shared engine: `src/domain/purlin/model/purlin-lstk-shared.ts`
- MP350 wrapper: `src/domain/purlin/model/purlin-lstk-mp350.ts`
- MP390 wrapper: `src/domain/purlin/model/purlin-lstk-mp390.ts`
- references: `src/domain/purlin/model/purlin-reference.generated.ts`
- tests: `tests/unit/purlin-lstk-mp390.test.ts`

## Next Step

- transfer the first real `ТОП-10 сортовой` branch
- start the same parity path for the column calculator core
