# Reference Data Policy

This project has two different sources of truth, depending on the task.

## 1. Checked-in generated references are the canonical in-repo baseline

The following files are the authoritative reference baseline for everyday development, CI, and release verification:

- `src/domain/column/model/column-reference.generated.ts`
- `src/domain/purlin/model/purlin-reference.generated.ts`
- `src/domain/truss/model/truss-reference.generated.ts`

These files must:

- stay checked into git
- regenerate deterministically inside the repository
- remain stable under `npm run check:references`

When no workbook is available, the generators rebuild from the checked-in snapshot and must not introduce drift.

## 2. Excel workbooks are optional parity inputs, not required build inputs

Original Excel workbooks are still important for parity work and manual engineering acceptance, but they are not required for:

- `npm run verify`
- CI
- local development
- browser smoke tests

Workbook-backed regeneration is optional and is used only when the source workbook is present locally or explicitly configured via environment variables.

Supported overrides:

- `COLUMN_REFERENCE_WORKBOOK`
- `PURLIN_REFERENCE_WORKBOOK`
- `TRUSS_REFERENCE_WORKBOOK`
- `COLUMN_ACCEPTANCE_WORKBOOK`
- `PURLIN_ACCEPTANCE_WORKBOOK`

If these variables are not set and the expected workbook is not found, the repo falls back to checked-in snapshots.

## 3. Acceptance artifacts have their own role

Acceptance artifacts in `docs/` are release-supporting evidence, not runtime inputs:

- `ENGINEERING_ACCEPTANCE_EXCEL_SNAPSHOT.json`
- `ENGINEERING_ACCEPTANCE_CASES.md`
- `ENGINEERING_ACCEPTANCE_AUTO_REPORT.md`

They are generated from:

- the current TypeScript calculators
- workbook snapshots when available

This means a green acceptance artifact refresh does not, by itself, prove workbook parity is current. Workbook availability must always be stated when reporting confidence.

## 4. Change policy

Treat these changes differently:

- Generated reference diff with identical data and different header/provenance wording:
  mechanical regeneration, acceptable with explanation.
- Generated reference diff with changed catalog rows, loads, dimensions, or thresholds:
  parity-sensitive change, requires review.
- Acceptance snapshot refresh:
  evidence update, not domain logic proof on its own.
- Workbook path or ownership policy change:
  document it in `README.md`, `ARCHITECTURE.md`, and this file.

## 5. Operational rules

Before merging reference-data work:

1. Run `npm run check:references`.
2. If generators used snapshot fallback, say so explicitly.
3. If a workbook was used, record which workbook and why.
4. Route any business-output change through parity review and release verification.
