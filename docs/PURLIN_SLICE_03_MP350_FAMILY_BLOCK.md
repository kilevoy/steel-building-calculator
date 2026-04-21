# Purlin Slice 03: MP350 Family Block

## Status

Implemented in TypeScript and covered by unit tests against the default workbook scenario.

## Workbook Source

- `../calculator_stage1_internalized.xlsx`
- sheet `ЛСТК МП350`
- summary output `Лист1!D63:G65`

## Transferred Families

- `MP350 / 2TPS`
  - workbook row `27`
- `MP350 / 2PS`
  - workbook row `28`
- `MP350 / Z`
  - workbook row `29`

## Transferred Rules

- common step axis `500..3000 мм` from `ЛСТК МП350`
- shared utilization check by profile and step
- Excel plateau tie-break for repeated minima
- standard family objective for `2TPS` and `2PS`
- dedicated `Z` objective with the workbook connector mass add-on `1.72 кг`
- family-specific handling for extra purlins:
  - `2TPS` and `2PS`
    - snow retention: `+1` or `+1.5`
    - barrier: `+0` or `+0.5`
  - `Z`
    - snow retention: `+1` or `+2`
    - barrier: `+0` or `+1`

## Default Workbook Parity

- `MP350 / 2TPS`
  - profile: `2ТПС 245х65х2`
  - step: `2085 мм`
  - mass: `891.4308 кг`
- `MP350 / 2PS`
  - profile: `2ПС 245х65х2`
  - step: `2370 мм`
  - mass: `803.88 кг`
- `MP350 / Z`
  - profile: `Z 350х2`
  - step: `2300 мм`
  - mass: `661.44 кг`

## Code

- generator: `scripts/extract_purlin_reference.py`
- references: `src/domain/purlin/model/purlin-reference.generated.ts`
- selection logic: `src/domain/purlin/model/purlin-lstk-mp350.ts`
- aggregate entry point: `src/domain/purlin/model/calculate-purlin.ts`
- tests: `tests/unit/purlin-lstk-mp350.test.ts`

## Next Step

- transfer `MP390` on the same abstraction
- transfer the first real `ТОП-10 сортовой` output branch
