# Engineering Acceptance Template

Use this document to record the final business-approved Excel comparisons before release.

## Goal

Release is approved only after these scenarios are checked against the workbook source of truth and the current app output.

For every scenario record:

- workbook used
- exact inputs
- expected Excel result
- actual app result
- accepted tolerance
- final status

## Required Scenario Mix

Target at least 10 scenarios:

1. `column` default baseline
2. `column` high snow / low wind
3. `column` high wind / tall building
4. `column` support crane enabled
5. `column` multi-span or middle-column case
6. `purlin` default baseline
7. `purlin` MP350 family edge case
8. `purlin` MP390 family edge case
9. `purlin` sort-steel branch case
10. `purlin` manual step clamp or near-limit case

## Status Summary

| ID | Domain | Scenario | Workbook | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| C-01 | column | Default baseline |  |  | pending |  |
| C-02 | column | High snow / low wind |  |  | pending |  |
| C-03 | column | High wind / tall building |  |  | pending |  |
| C-04 | column | Support crane enabled |  |  | pending |  |
| C-05 | column | Multi-span or middle-column |  |  | pending |  |
| P-01 | purlin | Default baseline |  |  | pending |  |
| P-02 | purlin | MP350 edge case |  |  | pending |  |
| P-03 | purlin | MP390 edge case |  |  | pending |  |
| P-04 | purlin | Sort-steel branch |  |  | pending |  |
| P-05 | purlin | Manual clamp or near-limit |  |  | pending |  |

## Scenario Record Template

Copy this block for every approved scenario.

```md
### ID: C-01

- Domain: column
- Scenario: Default baseline
- Workbook file:
- Workbook sheet/result area:
- Verified by:
- Date:

#### Inputs

| Field | Value |
| --- | --- |
| city |  |
| responsibilityLevel |  |
| roofType |  |
| spanM |  |
| buildingLengthM |  |
| buildingHeightM |  |
| roofSlopeDeg |  |
| frameStepM |  |
| facadeColumnStepM |  |
| spansCount |  |
| perimeterBracing |  |
| terrainType |  |
| roofCoveringType |  |
| wallCoveringType |  |
| columnType |  |
| extraLoadPercent |  |
| supportCraneMode |  |
| supportCraneCapacity |  |
| supportCraneCount |  |
| supportCraneRailLevelM |  |

#### Expected Excel Output

| Metric | Excel |
| --- | --- |
| selectedProfile |  |
| stepMm |  |
| unitMassKgPerM |  |
| totalMassKg |  |
| utilization |  |
| extra notes |  |

#### App Output

| Metric | App |
| --- | --- |
| selectedProfile |  |
| stepMm |  |
| unitMassKgPerM |  |
| totalMassKg |  |
| utilization |  |
| extra notes |  |

#### Tolerance

- profile: exact match
- step: exact match
- loads: exact match unless workbook rounding is documented
- utilization: define accepted delta here
- mass: define accepted delta here

#### Result

- Status: pending / accepted / rejected
- Notes:
```

## Release Gate

Release may be called engineering-approved only if:

- all required scenarios are filled in
- every scenario is marked `accepted`
- any tolerated mismatch is documented explicitly
