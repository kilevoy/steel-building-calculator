# Purlin Slice 02: MP350 2TPS Selection

## Status

Implemented in TypeScript and covered by unit tests against the default workbook scenario.

## Workbook Source

- `../calculator_stage1_internalized.xlsx`
- sheet `ЛСТК МП350`
- summary output `Лист1!D63:G63`

## Transferred Cells and Logic

- `ЛСТК МП350!SO3:BYK3`
  - step axis for the MP350 branch
- `ЛСТК МП350!SK5:SM15`
  - MP350 2TPS profile catalog
  - profile name
  - required panel thickness
  - bending resistance
  - unit mass
- `ЛСТК МП350!SO5:BYK15`
  - utilization check per step and profile
- `ЛСТК МП350!B14:SH14`
  - per-step objective for the 2TPS subset
- `ЛСТК МП350!B19:SH19`
  - winning profile mass per meter for each step
- `ЛСТК МП350!B27:E27`
  - final recommendation:
  - total mass
  - selected step
  - unit mass
  - profile name

## Implemented Rules

- use transferred design load from the existing purlin load chain
- check each MP350 2TPS profile against the workbook utilization formula
- filter profiles by required panel thickness when the covering type is in the `наше ... мм` family
- compute the branch objective exactly as the workbook does:
  - number of runs from `spanM`
  - roof multiplicity from `roofType`
  - extra runs for snow-retention and barrier purlins
- apply the workbook tie-break rule for equal minima:
  - find the first contiguous minimum plateau
  - if its length is less than `3`, keep the first step
  - otherwise choose the last step of that plateau

## Parity Target Reached

Default workbook scenario:

- profile: `2ТПС 245х65х2`
- step: `2085 мм`
- unit mass: `11.4286 кг/м`
- total mass: `891.4308 кг`
- utilization: `0.9986161654`

## Code

- generator: `scripts/extract_purlin_reference.py`
- generated references: `src/domain/purlin/model/purlin-reference.generated.ts`
- selection logic: `src/domain/purlin/model/purlin-lstk-mp350.ts`
- aggregate entry point: `src/domain/purlin/model/calculate-purlin.ts`
- tests: `tests/unit/purlin-lstk-mp350.test.ts`

## Next Step

- transfer the remaining MP350 families
- transfer MP390 in the same structure
- start the first real `ТОП-10 сортовой` output branch
