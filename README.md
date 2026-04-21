# MetalCalc

MetalCalc transfers Excel-based purlin and column calculators into a testable TypeScript application with workbook-backed reference data.

## Stack

- React 19
- TypeScript 5
- Vite 8
- Zod 4
- Vitest
- Playwright

## Main Commands

```bash
npm install
npm run generate:purlin-ref
npm run generate:column-ref
npm run generate:acceptance-excel
npm run generate:acceptance-cases
npm run generate:acceptance-report
npm run generate:acceptance-pack
npm run lint
npm test
npm run build
npm run test:e2e
npm run verify
```

## Reference Data

Generated reference modules live here:

- `src/domain/purlin/model/purlin-reference.generated.ts`
- `src/domain/column/model/column-reference.generated.ts`

Workbook-backed generators:

- `npm run generate:purlin-ref`
- `npm run generate:column-ref`

Workbook lookup order:

- `PURLIN_REFERENCE_WORKBOOK` or `COLUMN_REFERENCE_WORKBOOK`
- workbook in the repository root
- workbook in the parent directory
- `C:\calculator_final_release.xlsx`
- `C:\column_calculator_final_release.xlsx`

If no workbook is found, generators rebuild from the checked-in snapshot instead of failing.

## Verification

`npm run verify` runs the project release sanity cycle:

1. regenerate both reference modules and fail on drift
2. lint
3. unit tests
4. production build
5. Playwright e2e tests

Reference stability can be checked separately with:

```bash
npm run check:references
```

## CI

GitHub Actions workflow:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pages.yml`

It runs:

- reference drift check
- lint
- unit tests
- build
- Playwright e2e

## GitHub Pages

This Vite app is ready for free GitHub Pages deployment.

Notes:

- for a public repository, GitHub Pages is free
- the Vite `base` path is resolved automatically in GitHub Actions
- pushing to `main` triggers `.github/workflows/deploy-pages.yml`

Recommended repository setup:

- visibility: `Public`
- `Add README`: `Off`
- `Add .gitignore`: `Off`
- `Add license`: optional

After creating the repository, initialize git locally and push:

```bash
git init
git branch -M main
git add .
git commit -m "Initial import"
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

Then in GitHub:

1. open `Settings -> Pages`
2. set `Source` to `GitHub Actions`
3. wait for the `Deploy Pages` workflow

Resulting URL:

- `https://<owner>.github.io/<repo>/`

## Layout

- `src/app` application shell
- `src/pages` UI screens
- `src/domain` pure calculation logic and contracts
- `src/shared` helpers and config
- `scripts` workbook extraction and maintenance utilities
- `tests/unit` unit and parity-smoke tests
- `tests/e2e` browser smoke tests

## Current Status

The repository currently has:

- workbook-backed generators for both `purlin` and `column`
- parity-smoke coverage against source workbooks
- extra unit coverage for derived reference fields such as `requiredPanelThicknessMm`

What still remains outside the codebase itself is final engineering acceptance on a fixed set of business-approved Excel scenarios.

Template for that final step:

- `docs/ENGINEERING_ACCEPTANCE_TEMPLATE.md`
- `docs/ENGINEERING_ACCEPTANCE_CASES.md`
- `docs/ENGINEERING_ACCEPTANCE_AUTO_REPORT.md`

The working acceptance sheet can be refreshed in two stages:

```bash
npm run generate:acceptance-excel
npm run generate:acceptance-cases
npm run generate:acceptance-report
```

Or in one combined step:

```bash
npm run generate:acceptance-pack
```
