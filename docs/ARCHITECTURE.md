# Architecture

## Goal

MetalCalc replaces the current Excel calculators with a TypeScript application that preserves calculation parity while improving speed, maintainability, and user experience.

## Core Principles

- parity with Excel is more important than early feature breadth
- calculation kernels stay pure and independent from React
- reference tables are versioned and auditable
- UI never contains business formulas
- every workbook mapping is documented before or during transfer

## Module Boundaries

- `src/app`
  - application shell, global styles, top-level composition
- `src/pages`
  - screen-level UI
- `src/domain`
  - calculator contracts and pure calculation modules
- `src/shared/excel`
  - Excel-compatible numeric and formula helpers
- `src/shared/config`
  - app metadata and environment-level constants
- `tests/unit`
  - fast validation of helpers and domain contracts
- `tests/e2e`
  - browser-level smoke checks

## Planned Runtime Shape

- web-first React application
- no backend required for local calculation at the initial stage
- desktop packaging via Tauri after the web version stabilizes

## Parity Source of Truth

Reference workbooks currently live in the parent workspace and remain canonical until each module reaches parity verification.

## Column Selection and Specification

Column profile override flow is documented in [`COLUMN_MANUAL_SELECTION.md`](./COLUMN_MANUAL_SELECTION.md), including:

- top-list generation for extreme/fachwerk/middle columns
- auto vs manual profile selection flags
- specification aggregation derived from selected profiles
