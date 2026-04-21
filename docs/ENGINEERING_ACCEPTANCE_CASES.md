# Engineering Acceptance Cases

This file is the working release sheet for final Excel-vs-app acceptance.

App snapshot values in the `App` column are auto-generated from the current TypeScript calculator on 2026-04-21.
Excel columns are populated from an auto-generated workbook snapshot when available. Final parity sign-off remains manual.

Selection conventions:

- `column`: use workbook-parity `excel` selection mode for the scenario `columnType`
- `P-01` and `P-04`: use the default auto-selected `sort steel` branch
- `P-02` and `P-03`: use the first candidate from the MP350 or MP390 branch
- `P-05`: use the workbook-visible MP390 recommendation under the manual step clamp

Current auto-snapshot status:

- comparable metrics match for `C-01..C-05` and `P-01..P-03, P-05`
- `P-04` remains unsupported because the workbook exposes no `maxUtilizationRatio` input
- purlin utilization rows remain workbook-opaque, so Excel stays `n/a` there

Status values:

- `pending`
- `accepted`
- `rejected`

## Summary

| ID | Domain | Scenario | Workbook | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| C-01 | column | Default baseline | `column_calculator_final_release.xlsx` | pending | default app input |
| C-02 | column | High snow / low wind | `column_calculator_final_release.xlsx` | pending | snow-driven check |
| C-03 | column | High wind / tall building | `column_calculator_final_release.xlsx` | pending | wind + height stress |
| C-04 | column | Support crane enabled | `column_calculator_final_release.xlsx` | pending | crane branch |
| C-05 | column | Multi-span middle-column | `column_calculator_final_release.xlsx` | pending | multi-span branch |
| P-01 | purlin | Default baseline | `calculator_final_release.xlsx` | pending | default app input |
| P-02 | purlin | MP350 edge case | `calculator_final_release.xlsx` | pending | MP350 family focus |
| P-03 | purlin | MP390 edge case | `calculator_final_release.xlsx` | pending | verify MP390 / 2TPS workbook branch on layered assembly covering |
| P-04 | purlin | Sort-steel branch | `calculator_final_release.xlsx` | pending | non-LSTK branch |
| P-05 | purlin | Manual step clamp | `calculator_final_release.xlsx` | pending | manual max step on layered MP390 / 2TPS branch |

## Column Cases

### C-01

- Domain: `column`
- Scenario: default baseline
- Workbook: `column_calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Уфа` |
| responsibilityLevel | `1` |
| roofType | `двускатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| facadeColumnStepM | `6` |
| spansCount | `один` |
| perimeterBracing | `нет` |
| terrainType | `В` |
| roofCoveringType | `С-П 150 мм` |
| wallCoveringType | `С-П 100 мм` |
| columnType | `крайняя` |
| extraLoadPercent | `15` |
| supportCraneMode | `нет` |
| supportCraneSingleSpanMode | `да` |
| supportCraneCapacity | `5` |
| supportCraneCount | `один` |
| supportCraneRailLevelM | `3.5` |
| hangingCraneMode | `нет` |
| hangingCraneCapacityT | `2` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| selectedProfile | `40 Б1` | `40 Б1` | exact | pending |
| columnGroup | `extreme` | `extreme` | exact | pending |
| unitMassKgPerM | `56.6` | `56.6` | agreed delta | pending |
| totalMassKg | `783.38` | `783.38` | agreed delta | pending |
| utilization | `0.9534` | `0.9534` | agreed delta | pending |

### C-02

- Domain: `column`
- Scenario: high snow / low wind
- Workbook: `column_calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Киров` |
| responsibilityLevel | `1` |
| roofType | `двускатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| facadeColumnStepM | `6` |
| spansCount | `один` |
| perimeterBracing | `нет` |
| terrainType | `В` |
| roofCoveringType | `С-П 150 мм` |
| wallCoveringType | `С-П 100 мм` |
| columnType | `крайняя` |
| extraLoadPercent | `15` |
| supportCraneMode | `нет` |
| supportCraneCapacity | `5` |
| supportCraneCount | `один` |
| supportCraneRailLevelM | `3.5` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| selectedProfile | `35 Б2` | `35 Б2` | exact | pending |
| snowLoadKpa | `2.1` | `2.1` | exact | pending |
| unitMassKgPerM | `49.6` | `49.6` | agreed delta | pending |
| totalMassKg | `702.88` | `702.88` | agreed delta | pending |
| utilization | `0.9101` | `0.9101` | agreed delta | pending |

### C-03

- Domain: `column`
- Scenario: high wind / tall building
- Workbook: `column_calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Каспийск` |
| responsibilityLevel | `1` |
| roofType | `двускатная` |
| spanM | `24` |
| buildingLengthM | `90` |
| buildingHeightM | `16` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| facadeColumnStepM | `6` |
| spansCount | `один` |
| perimeterBracing | `нет` |
| terrainType | `А` |
| roofCoveringType | `С-П 150 мм` |
| wallCoveringType | `С-П 100 мм` |
| columnType | `крайняя` |
| extraLoadPercent | `15` |
| supportCraneMode | `нет` |
| supportCraneCapacity | `5` |
| supportCraneCount | `один` |
| supportCraneRailLevelM | `3.5` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| selectedProfile | `70 Ш2` | `70 Ш2` | exact | pending |
| windLoadKpa | `0.6` | `0.6` | exact | pending |
| unitMassKgPerM | `190.4` | `190.4` | agreed delta | pending |
| totalMassKg | `3635.84` | `3635.84` | agreed delta | pending |
| utilization | `0.9289` | `0.9289` | agreed delta | pending |

### C-04

- Domain: `column`
- Scenario: support crane enabled
- Workbook: `column_calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Уфа` |
| responsibilityLevel | `1` |
| roofType | `двускатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| facadeColumnStepM | `6` |
| spansCount | `один` |
| perimeterBracing | `нет` |
| terrainType | `В` |
| roofCoveringType | `С-П 150 мм` |
| wallCoveringType | `С-П 100 мм` |
| columnType | `крайняя` |
| extraLoadPercent | `15` |
| supportCraneMode | `есть` |
| supportCraneSingleSpanMode | `да` |
| supportCraneCapacity | `10` |
| supportCraneCount | `один` |
| supportCraneRailLevelM | `3.5` |
| hangingCraneMode | `нет` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| selectedProfile | `50 Б2` | `50 Б2` | exact | pending |
| craneWheelLoadKn | `95` | `95` | exact | pending |
| unitMassKgPerM | `79.5` | `79.5` | agreed delta | pending |
| totalMassKg | `1046.73` | `1046.73` | agreed delta | pending |
| utilization | `0.9834` | `0.9834` | agreed delta | pending |

### C-05

- Domain: `column`
- Scenario: multi-span middle-column
- Workbook: `column_calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Уфа` |
| responsibilityLevel | `1` |
| roofType | `двускатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| facadeColumnStepM | `6` |
| spansCount | `более одного` |
| perimeterBracing | `нет` |
| terrainType | `В` |
| roofCoveringType | `С-П 150 мм` |
| wallCoveringType | `С-П 100 мм` |
| columnType | `средняя` |
| extraLoadPercent | `15` |
| supportCraneMode | `нет` |
| supportCraneCapacity | `5` |
| supportCraneCount | `один` |
| supportCraneRailLevelM | `3.5` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| selectedProfile | `40 Б1` | `40 Б1` | exact | pending |
| columnGroup | `middle` | `middle` | exact | pending |
| unitMassKgPerM | `56.6` | `56.6` | agreed delta | pending |
| totalMassKg | `783.38` | `783.38` | agreed delta | pending |
| utilization | `0.9367` | `0.9367` | agreed delta | pending |

## Purlin Cases

### P-01

- Domain: `purlin`
- Scenario: default baseline
- Workbook: `calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Челябинск` |
| normativeMode | `по СП 20.13330.20ХХ` |
| responsibilityLevel | `1` |
| roofType | `односкатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| fakhverkSpacingM | `6` |
| terrainType | `В` |
| coveringType | `С-П 150 мм` |
| profileSheet | `С44-1000-0,7` |
| snowBagMode | `нет` |
| heightDifferenceM | `4.5` |
| adjacentBuildingSizeM | `9.5` |
| manualMaxStepMm | `0` |
| manualMinStepMm | `0` |
| maxUtilizationRatio | `0.8` |
| tiesSetting | `нет` |
| snowRetentionPurlin | `нет` |
| barrierPurlin | `нет` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| topFamily | `Sort steel` | `Sort steel` | exact | pending |
| selectedProfile | `пр.180х140х4` | `пр.180х140х4` | exact | pending |
| stepMm | `2550` | `2550` | exact | pending |
| totalMassKg | `13120.14` | `13120.14` | agreed delta | pending |
| utilization | `n/a` | `0.7711` | agreed delta | pending |

### P-02

- Domain: `purlin`
- Scenario: MP350 edge case
- Workbook: `calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Челябинск` |
| normativeMode | `по СП 20.13330.20ХХ` |
| responsibilityLevel | `1` |
| roofType | `односкатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| fakhverkSpacingM | `6` |
| terrainType | `В` |
| coveringType | `наше 250 мм 1 слой ГВЛ` |
| profileSheet | `С44-1000-0,7` |
| snowBagMode | `нет` |
| manualMaxStepMm | `0` |
| maxUtilizationRatio | `0.8` |
| tiesSetting | `нет` |
| note | `verify MP350 / 2TPS workbook branch on layered assembly covering` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| MP350 top family | `MP350 / 2TPS` | `MP350 / 2TPS` | exact | pending |
| MP350 selectedProfile | `2ТПС 245х65х2` | `2ТПС 245х65х2` | exact | pending |
| MP350 stepMm | `2085` | `2085` | exact | pending |
| MP350 totalMassKg | `8914.308` | `8914.308` | agreed delta | pending |

### P-03

- Domain: `purlin`
- Scenario: MP390 edge case
- Workbook: `calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Челябинск` |
| normativeMode | `по СП 20.13330.20ХХ` |
| responsibilityLevel | `1` |
| roofType | `односкатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| fakhverkSpacingM | `6` |
| terrainType | `В` |
| coveringType | `наше 250 мм 1 слой ГВЛ` |
| profileSheet | `Н60-845-0,8` |
| snowBagMode | `нет` |
| manualMaxStepMm | `0` |
| maxUtilizationRatio | `0.8` |
| tiesSetting | `нет` |
| note | `verify MP390 / 2TPS workbook branch on layered assembly covering` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| MP390 top family | `MP390 / 2TPS` | `MP390 / 2TPS` | exact | pending |
| MP390 selectedProfile | `2ТПС 245х65х2` | `2ТПС 245х65х2` | exact | pending |
| MP390 stepMm | `2340` | `2340` | exact | pending |
| MP390 totalMassKg | `8228.592` | `8228.592` | agreed delta | pending |

### P-04

- Domain: `purlin`
- Scenario: sort-steel branch
- Workbook: `calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Челябинск` |
| normativeMode | `по СП 20.13330.20ХХ` |
| responsibilityLevel | `1` |
| roofType | `односкатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| fakhverkSpacingM | `6` |
| terrainType | `В` |
| coveringType | `профлист` |
| profileSheet | `С44-1000-0,5` |
| snowBagMode | `нет` |
| manualMaxStepMm | `0` |
| maxUtilizationRatio | `0.95` |
| tiesSetting | `2` |
| note | `verify sort-steel recommendation path` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| selectedFamily | `unsupported: workbook has no maxUtilizationRatio input to match this scenario exactly` | `Sort steel` | exact | pending |
| selectedProfile | `unsupported: workbook has no maxUtilizationRatio input to match this scenario exactly` | `кв.120х3` | exact | pending |
| stepMm | `unsupported: workbook has no maxUtilizationRatio input to match this scenario exactly` | `1300` | exact | pending |
| totalMassKg | `unsupported: workbook has no maxUtilizationRatio input to match this scenario exactly` | `13596` | agreed delta | pending |
| utilization | `n/a` | `0.9333` | agreed delta | pending |

### P-05

- Domain: `purlin`
- Scenario: manual step clamp
- Workbook: `calculator_final_release.xlsx`
- Verified by:
- Date:
- Status: `pending`

#### Inputs

| Field | Value |
| --- | --- |
| city | `Челябинск` |
| normativeMode | `по СП 20.13330.20ХХ` |
| responsibilityLevel | `1` |
| roofType | `односкатная` |
| spanM | `24` |
| buildingLengthM | `60` |
| buildingHeightM | `10` |
| roofSlopeDeg | `6` |
| frameStepM | `6` |
| fakhverkSpacingM | `6` |
| terrainType | `В` |
| coveringType | `наше 250 мм 1 слой ГВЛ` |
| profileSheet | `С44-1000-0,7` |
| snowBagMode | `нет` |
| manualMaxStepMm | `1800` |
| manualMinStepMm | `0` |
| maxUtilizationRatio | `0.8` |
| tiesSetting | `нет` |

#### Result

| Metric | Excel | App | Tolerance | Status |
| --- | --- | --- | --- | --- |
| selectedFamily | `MP390 / 2TPS` | `MP390 / 2TPS` | exact | pending |
| selectedProfile | `2ТПС 245х65х1,5` | `2ТПС 245х65х1,5` | exact | pending |
| stepMm | `1540` | `1540` | exact and `<= 1800` | pending |
| totalMassKg | `8806.476` | `8806.476` | agreed delta | pending |
| utilization | `n/a` | `1.0035` | agreed delta | pending |
