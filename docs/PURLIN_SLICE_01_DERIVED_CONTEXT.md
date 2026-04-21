# Purlin Slice 01: Derived Context

## Status

Implemented in TypeScript and covered by tests.

## Workbook Source

- `../calculator_stage1_internalized.xlsx`
- sheet `Лист1`

## Transferred Fields

- `Лист1!B17`
  - wind load by city
  - source: `СП 20` city table
- `Лист1!B18`
  - snow load by city
  - source: `СП 20` city table
- `Лист1!D19`
  - covering dead load
  - source: `Лист1!L82:M101`
- `Лист1!B25`
  - snow bag factor `mu2`
  - source: `Лист1!P81:R83`
- `Лист1!N102`
  - covering/profile selection index for the auto-step table
  - source: `Лист1!K82:P92`
- `Лист1!B40`
  - auto maximum step
  - source: `Лист1!B111:M160`, `Расчет!D11:D14`, `Ветер СП`

## Code

- generator: `scripts/extract_purlin_reference.py`
- generated reference data: `src/domain/purlin/model/purlin-reference.generated.ts`
- logic: `src/domain/purlin/model/purlin-derived-context.ts`

## Notes

- the workbook contains a legacy `F99/G98` branch tied to `СП РК EN`
- in manual Excel scenario changes this branch may behave inconsistently because of workbook-specific cache quirks
- for stable parity tests the project currently relies on:
  - default workbook scenario
  - geometry-change scenario within the same base city
- the next slices should expand the real output coverage beyond the transferred MP350 2TPS branch
