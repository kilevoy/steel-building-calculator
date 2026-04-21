from __future__ import annotations

import json
from pathlib import Path

import win32com.client as win32

REPO_ROOT = Path(r'C:\v2_1')
OUT_PATH = REPO_ROOT / 'docs' / 'ENGINEERING_ACCEPTANCE_EXCEL_SNAPSHOT.json'
COLUMN_WORKBOOK = Path(r'C:\column_calculator_final_release.xlsx')
PURLIN_WORKBOOK = Path(r'C:\calculator_final_release.xlsx')
TODAY = '2026-03-22'

COLUMN_SCENARIOS = {
    'C-01': {
        'city': 'Уфа',
        'responsibilityLevel': 1,
        'roofType': 'двускатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'facadeColumnStepM': 6,
        'spansCount': 'один',
        'perimeterBracing': 'нет',
        'terrainType': 'В',
        'roofCoveringType': 'С-П 150 мм',
        'wallCoveringType': 'С-П 100 мм',
        'columnType': 'крайняя',
        'extraLoadPercent': 15,
        'supportCraneMode': 'нет',
        'supportCraneSingleSpanMode': 'да',
        'supportCraneCapacity': 5,
        'supportCraneCount': 'один',
        'supportCraneRailLevelM': 3.5,
        'hangingCraneMode': 'нет',
        'hangingCraneSingleSpanMode': 'да',
        'hangingCraneCapacityT': 2,
    },
    'C-02': {
        'city': 'Киров',
        'responsibilityLevel': 1,
        'roofType': 'двускатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'facadeColumnStepM': 6,
        'spansCount': 'один',
        'perimeterBracing': 'нет',
        'terrainType': 'В',
        'roofCoveringType': 'С-П 150 мм',
        'wallCoveringType': 'С-П 100 мм',
        'columnType': 'крайняя',
        'extraLoadPercent': 15,
        'supportCraneMode': 'нет',
        'supportCraneSingleSpanMode': 'да',
        'supportCraneCapacity': 5,
        'supportCraneCount': 'один',
        'supportCraneRailLevelM': 3.5,
        'hangingCraneMode': 'нет',
        'hangingCraneSingleSpanMode': 'да',
        'hangingCraneCapacityT': 2,
    },
    'C-03': {
        'city': 'Каспийск',
        'responsibilityLevel': 1,
        'roofType': 'двускатная',
        'spanM': 24,
        'buildingLengthM': 90,
        'buildingHeightM': 16,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'facadeColumnStepM': 6,
        'spansCount': 'один',
        'perimeterBracing': 'нет',
        'terrainType': 'А',
        'roofCoveringType': 'С-П 150 мм',
        'wallCoveringType': 'С-П 100 мм',
        'columnType': 'крайняя',
        'extraLoadPercent': 15,
        'supportCraneMode': 'нет',
        'supportCraneSingleSpanMode': 'да',
        'supportCraneCapacity': 5,
        'supportCraneCount': 'один',
        'supportCraneRailLevelM': 3.5,
        'hangingCraneMode': 'нет',
        'hangingCraneSingleSpanMode': 'да',
        'hangingCraneCapacityT': 2,
    },
    'C-04': {
        'city': 'Уфа',
        'responsibilityLevel': 1,
        'roofType': 'двускатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'facadeColumnStepM': 6,
        'spansCount': 'один',
        'perimeterBracing': 'нет',
        'terrainType': 'В',
        'roofCoveringType': 'С-П 150 мм',
        'wallCoveringType': 'С-П 100 мм',
        'columnType': 'крайняя',
        'extraLoadPercent': 15,
        'supportCraneMode': 'есть',
        'supportCraneSingleSpanMode': 'да',
        'supportCraneCapacity': 10,
        'supportCraneCount': 'один',
        'supportCraneRailLevelM': 3.5,
        'hangingCraneMode': 'нет',
        'hangingCraneSingleSpanMode': 'да',
        'hangingCraneCapacityT': 2,
    },
    'C-05': {
        'city': 'Уфа',
        'responsibilityLevel': 1,
        'roofType': 'двускатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'facadeColumnStepM': 6,
        'spansCount': 'более одного',
        'perimeterBracing': 'нет',
        'terrainType': 'В',
        'roofCoveringType': 'С-П 150 мм',
        'wallCoveringType': 'С-П 100 мм',
        'columnType': 'средняя',
        'extraLoadPercent': 15,
        'supportCraneMode': 'нет',
        'supportCraneSingleSpanMode': 'да',
        'supportCraneCapacity': 5,
        'supportCraneCount': 'один',
        'supportCraneRailLevelM': 3.5,
        'hangingCraneMode': 'нет',
        'hangingCraneSingleSpanMode': 'да',
        'hangingCraneCapacityT': 2,
    },
}

PURLIN_SCENARIOS = {
    'P-01': {
        'supported': True,
        'city': 'Челябинск',
        'normativeMode': 'по СП 20.13330.20ХХ',
        'responsibilityLevel': 1,
        'roofType': 'односкатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'fakhverkSpacingM': 6,
        'terrainType': 'В',
        'coveringType': 'С-П 150 мм',
        'profileSheet': 'С44-1000-0,7',
        'snowBagMode': 'нет',
        'heightDifferenceM': 4.5,
        'adjacentBuildingSizeM': 9.5,
        'manualMaxStepMm': 0,
        'manualMinStepMm': 0,
        'tiesSetting': 'нет',
        'snowRetentionPurlin': 'нет',
        'barrierPurlin': 'нет',
    },
    'P-02': {
        'supported': True,
        'city': 'Челябинск',
        'normativeMode': 'по СП 20.13330.20ХХ',
        'responsibilityLevel': 1,
        'roofType': 'односкатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'fakhverkSpacingM': 6,
        'terrainType': 'В',
        'coveringType': 'С-П 150 мм',
        'profileSheet': 'С44-1000-0,7',
        'snowBagMode': 'нет',
        'heightDifferenceM': 4.5,
        'adjacentBuildingSizeM': 9.5,
        'manualMaxStepMm': 0,
        'manualMinStepMm': 0,
        'tiesSetting': 'нет',
        'snowRetentionPurlin': 'нет',
        'barrierPurlin': 'нет',
    },
    'P-03': {
        'supported': True,
        'city': 'Челябинск',
        'normativeMode': 'по СП 20.13330.20ХХ',
        'responsibilityLevel': 1,
        'roofType': 'односкатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'fakhverkSpacingM': 6,
        'terrainType': 'В',
        'coveringType': 'С-П 150 мм',
        'profileSheet': 'Н60-845-0,8',
        'snowBagMode': 'нет',
        'heightDifferenceM': 4.5,
        'adjacentBuildingSizeM': 9.5,
        'manualMaxStepMm': 0,
        'manualMinStepMm': 0,
        'tiesSetting': 'нет',
        'snowRetentionPurlin': 'нет',
        'barrierPurlin': 'нет',
    },
    'P-04': {
        'supported': False,
        'reason': 'workbook has no maxUtilizationRatio input to match this scenario exactly',
    },
    'P-05': {
        'supported': True,
        'city': 'Челябинск',
        'normativeMode': 'по СП 20.13330.20ХХ',
        'responsibilityLevel': 1,
        'roofType': 'односкатная',
        'spanM': 24,
        'buildingLengthM': 60,
        'buildingHeightM': 10,
        'roofSlopeDeg': 6,
        'frameStepM': 6,
        'fakhverkSpacingM': 6,
        'terrainType': 'В',
        'coveringType': 'С-П 150 мм',
        'profileSheet': 'С44-1000-0,7',
        'snowBagMode': 'нет',
        'heightDifferenceM': 4.5,
        'adjacentBuildingSizeM': 9.5,
        'manualMaxStepMm': 1800,
        'manualMinStepMm': 0,
        'tiesSetting': 'нет',
        'snowRetentionPurlin': 'нет',
        'barrierPurlin': 'нет',
    },
}


def fmt(value: float, digits: int = 4) -> str:
    if value is None:
        return ''

    numeric = float(value)
    if digits == 0:
        return str(int(round(numeric)))

    text = f"{numeric:.{digits}f}".rstrip('0').rstrip('.')
    return text or '0'


def column_group_key(value: str) -> str:
    normalized = str(value).strip().lower()
    if normalized == 'крайняя':
        return 'extreme'
    if normalized == 'фахверковая':
        return 'fachwerk'
    return 'middle'


def lstk_family(branch: str, profile: str) -> str:
    profile = str(profile).strip()
    if profile.startswith('2ТПС'):
        suffix = '2TPS'
    elif profile.startswith('2ПС'):
        suffix = '2PS'
    elif profile.upper().startswith('Z'):
        suffix = 'Z'
    else:
        suffix = profile
    return f'{branch} / {suffix}'


def set_column_inputs(ws, scenario: dict) -> None:
    ws.Cells(6, 4).Value = scenario['city']
    ws.Cells(7, 4).Value = scenario['responsibilityLevel']
    ws.Cells(8, 4).Value = scenario['roofType']
    ws.Cells(11, 4).Value = scenario['spanM']
    ws.Cells(12, 4).Value = scenario['buildingLengthM']
    ws.Cells(13, 4).Value = scenario['buildingHeightM']
    ws.Cells(14, 4).Value = scenario['roofSlopeDeg']
    ws.Cells(15, 4).Value = scenario['frameStepM']
    ws.Cells(16, 4).Value = scenario['facadeColumnStepM']
    ws.Cells(17, 4).Value = scenario['spansCount']
    ws.Cells(18, 4).Value = scenario['perimeterBracing']
    ws.Cells(21, 4).Value = scenario['terrainType']
    ws.Cells(22, 4).Value = scenario['roofCoveringType']
    ws.Cells(23, 4).Value = scenario['wallCoveringType']
    ws.Cells(26, 4).Value = scenario['supportCraneMode']
    ws.Cells(27, 4).Value = scenario['supportCraneSingleSpanMode']
    ws.Cells(28, 4).Value = scenario['supportCraneCapacity']
    ws.Cells(29, 4).Value = scenario['supportCraneCount']
    ws.Cells(30, 4).Value = scenario['supportCraneRailLevelM']
    ws.Cells(33, 4).Value = scenario['hangingCraneMode']
    ws.Cells(34, 4).Value = scenario['hangingCraneSingleSpanMode']
    ws.Cells(35, 4).Value = scenario['hangingCraneCapacityT']
    ws.Cells(38, 4).Value = scenario['columnType']
    ws.Cells(39, 4).Value = scenario['extraLoadPercent']


def read_column_metrics(summary_ws) -> dict[str, str]:
    return {
        'selectedProfile': str(summary_ws.Cells(63, 2).Value).strip(),
        'columnGroup': column_group_key(str(summary_ws.Cells(48, 2).Value)),
        'unitMassKgPerM': fmt(summary_ws.Cells(63, 6).Value, 3),
        'totalMassKg': fmt(summary_ws.Cells(63, 9).Value, 3),
        'utilization': fmt(summary_ws.Cells(63, 4).Value, 4),
        'snowLoadKpa': fmt(summary_ws.Cells(20, 2).Value, 3),
        'windLoadKpa': fmt(summary_ws.Cells(19, 2).Value, 3),
        'craneWheelLoadKn': fmt(summary_ws.Cells(36, 2).Value, 3),
    }


def set_purlin_inputs(ws, scenario: dict) -> None:
    ws.Cells(6, 4).Value = scenario['city']
    ws.Cells(7, 4).Value = scenario['normativeMode']
    ws.Cells(8, 4).Value = scenario['responsibilityLevel']
    ws.Cells(9, 4).Value = scenario['roofType']
    ws.Cells(12, 4).Value = scenario['spanM']
    ws.Cells(13, 4).Value = scenario['buildingLengthM']
    ws.Cells(14, 4).Value = scenario['buildingHeightM']
    ws.Cells(15, 4).Value = scenario['roofSlopeDeg']
    ws.Cells(16, 4).Value = scenario['frameStepM']
    ws.Cells(17, 4).Value = scenario['fakhverkSpacingM']
    ws.Cells(20, 4).Value = scenario['terrainType']
    ws.Cells(21, 4).Value = scenario['coveringType']
    ws.Cells(22, 4).Value = scenario['profileSheet']
    ws.Cells(23, 4).Value = scenario['snowBagMode']
    ws.Cells(24, 4).Value = scenario['heightDifferenceM']
    ws.Cells(25, 4).Value = scenario['adjacentBuildingSizeM']
    ws.Cells(28, 4).Value = scenario['manualMaxStepMm']
    ws.Cells(29, 4).Value = scenario['manualMinStepMm']
    ws.Cells(30, 4).Value = scenario['tiesSetting']
    ws.Cells(31, 4).Value = scenario['snowRetentionPurlin']
    ws.Cells(32, 4).Value = scenario['barrierPurlin']


def unsupported_metrics(reason: str) -> dict[str, str]:
    return {
        'selectedFamily': f'unsupported: {reason}',
        'selectedProfile': f'unsupported: {reason}',
        'stepMm': f'unsupported: {reason}',
        'totalMassKg': f'unsupported: {reason}',
        'utilization': 'n/a',
    }


def read_purlin_sort_metrics(results_ws) -> dict[str, str]:
    return {
        'topFamily': 'Sort steel',
        'selectedFamily': 'Sort steel',
        'selectedProfile': str(results_ws.Cells(8, 4).Value).strip(),
        'stepMm': fmt(results_ws.Cells(9, 4).Value, 0),
        'totalMassKg': fmt(results_ws.Cells(10, 4).Value, 3),
        'utilization': 'n/a',
    }


def read_purlin_mp_metrics(results_ws, branch: str, profile_col: int) -> dict[str, str]:
    profile = str(results_ws.Cells(8, profile_col).Value).strip()
    return {
        f'{branch} top family': lstk_family(branch, profile),
        f'{branch} selectedProfile': profile,
        f'{branch} stepMm': fmt(results_ws.Cells(9, profile_col).Value, 0),
        f'{branch} totalMassKg': fmt(results_ws.Cells(10, profile_col).Value, 3),
    }


def read_purlin_clamped_lstk(results_ws) -> dict[str, str]:
    profile = str(results_ws.Cells(8, 12).Value).strip()
    step_mm = float(results_ws.Cells(9, 12).Value)
    mass_kg = float(results_ws.Cells(10, 12).Value)

    return {
        'selectedFamily': lstk_family('MP390', profile),
        'selectedProfile': profile,
        'stepMm': fmt(step_mm, 0),
        'totalMassKg': fmt(mass_kg, 3),
        'utilization': 'n/a',
    }


def build_snapshot() -> dict:
    excel = win32.DispatchEx('Excel.Application')
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.AskToUpdateLinks = False

    cases: dict[str, dict[str, str]] = {}

    try:
        column_wb = excel.Workbooks.Open(str(COLUMN_WORKBOOK), UpdateLinks=0)
        column_input_ws = column_wb.Worksheets(3)
        column_summary_ws = column_wb.Worksheets(5)

        for case_id, scenario in COLUMN_SCENARIOS.items():
            set_column_inputs(column_input_ws, scenario)
            excel.CalculateFullRebuild()
            cases[case_id] = read_column_metrics(column_summary_ws)

        column_wb.Close(SaveChanges=False)

        purlin_wb = excel.Workbooks.Open(str(PURLIN_WORKBOOK), UpdateLinks=0)
        purlin_input_ws = purlin_wb.Worksheets(3)
        purlin_results_ws = purlin_wb.Worksheets(5)

        for case_id, scenario in PURLIN_SCENARIOS.items():
            if not scenario.get('supported', True):
                cases[case_id] = unsupported_metrics(scenario['reason'])
                continue

            set_purlin_inputs(purlin_input_ws, scenario)
            excel.CalculateFullRebuild()

            if case_id == 'P-01':
                cases[case_id] = read_purlin_sort_metrics(purlin_results_ws)
            elif case_id == 'P-02':
                cases[case_id] = read_purlin_mp_metrics(purlin_results_ws, 'MP350', 8)
            elif case_id == 'P-03':
                cases[case_id] = read_purlin_mp_metrics(purlin_results_ws, 'MP390', 12)
            elif case_id == 'P-05':
                cases[case_id] = read_purlin_clamped_lstk(purlin_results_ws)

        purlin_wb.Close(SaveChanges=False)
    finally:
        excel.Quit()

    return {
        'generatedAt': TODAY,
        'cases': cases,
    }


def main() -> None:
    snapshot = build_snapshot()
    OUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Updated {OUT_PATH}')


if __name__ == '__main__':
    main()
