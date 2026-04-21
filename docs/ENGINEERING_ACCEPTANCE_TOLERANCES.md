# Engineering Acceptance Tolerances

This document defines the default tolerance policy for manual engineering sign-off.

It does not replace workbook comparison. It only explains how to classify differences once the workbook and app outputs have both been reviewed.

## Status Rules

- `accepted`: the workbook comparison was reviewed manually and every compared metric is either exact or within the documented tolerance.
- `pending`: workbook comparison is not yet manually reviewed, workbook access is missing, or the tolerance decision is still open.
- `rejected`: the reviewed scenario exceeds the documented tolerance or produces an unacceptable engineering difference.

## Default Tolerance Matrix

| Metric class | Default tolerance | Notes |
| --- | --- | --- |
| selected family | exact | Different family requires explicit engineering approval. |
| selected profile | exact | Different section is a blocking difference unless approved intentionally. |
| column group / branch | exact | Different branch selection changes engineering interpretation. |
| step | exact unless explicitly clamped by scenario rule | If the scenario is specifically about a clamp, the clamp rule must be stated in notes. |
| snow / wind / crane loads | exact | These are workbook-visible inputs or derived loads and should not drift silently. |
| utilization | agreed delta | Use manual approval after workbook review. Suggested default review threshold: `<= 0.02` absolute delta. |
| unit mass | agreed delta | Suggested default review threshold: `<= 2%` relative delta unless profile is exact and workbook rounding explains the gap. |
| total mass | agreed delta | Suggested default review threshold: `<= 3%` relative delta unless scenario notes state otherwise. |

## Scenario-Specific Guidance

### Column scenarios

- `selectedProfile` must match exactly.
- `columnGroup` must match exactly.
- `unitMassKgPerM` and `totalMassKg` may use the agreed-delta policy only after exact profile match is confirmed.
- `utilization` may be accepted only when the reviewer confirms the delta is explained by rounding or workbook opacity.

### Purlin scenarios

- `selectedFamily` must match exactly.
- `selectedProfile` must match exactly.
- `stepMm` must match exactly unless the scenario explicitly tests a clamp or workbook limitation.
- `totalMassKg` may use the agreed-delta policy only after family/profile/step are accepted.
- `utilization` may remain informational when the workbook does not expose a comparable number.

## Current Review Priority

Based on the current auto-report:

1. `C-05` needs manual review because mass and utilization differ.
2. `P-02`, `P-03`, and `P-05` are currently not acceptable for sign-off because family/profile/step differ from the workbook snapshot.
3. `P-04` remains workbook-unsupported and must stay visible as unsupported rather than silently accepted.
4. `P-01` still needs manual sign-off even though only workbook-opaque utilization remains open.

## Manual Sign-Off Checklist

For each scenario:

1. Open the named workbook.
2. Re-enter the exact scenario inputs from `ENGINEERING_ACCEPTANCE_CASES.md`.
3. Compare workbook outputs against the `App` values.
4. Apply the tolerance policy from this document.
5. Fill `Verified by`, `Date`, `Status`, and notes in `ENGINEERING_ACCEPTANCE_CASES.md`.

Release is engineering-approved only when the required scenarios are manually reviewed and marked accordingly.
