# Parity Strategy

## Objective

Every TypeScript calculation path must be traceable back to the current Excel references and validated against them.

## Sources

- `../calculator_engineering_printable.xlsx`
- `../column_calculator_engineering_printable.xlsx`
- `../Общий калькулятор прогонов v2.0.xlsx`
- `../Калькулятор подбора колонн.xlsx`

## Validation Method

1. identify workbook inputs and dependent ranges
2. encode the same inputs in TypeScript contracts
3. port formulas into pure functions
4. execute scenario-based comparison against workbook outputs
5. document every accepted deviation, if any

## Implemented Slice

The current purlin transfer already covers these workbook-derived fields:

- `Лист1!B17` wind load by city
- `Лист1!B18` snow load by city
- `Лист1!D19` covering dead load
- `Лист1!B25` snow bag factor
- `Лист1!N102` covering/profile selection index for the auto-step table

## Test Layers

- unit tests for low-level numeric helpers
- contract tests for domain modules
- parity tests for scenario datasets
- UI smoke tests for critical screens

## Rule

No calculation module is marked complete until it passes scenario-based parity comparison.

## Known Workbook Risk

The purlin workbook contains a legacy branch around `F98:G99` and `СП РК EN` that can produce unstable scenario behavior when cities are changed manually in Excel. During migration we treat formula logic and stable scenarios as the source of truth, and we document any workbook cache anomalies explicitly.
