import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path

import win32com.client as win32

WORKBOOK_SOURCE = Path(r"C:\kolonna78\Калькулятор подбора колонн.xlsx")
APP_DUMP_SCRIPT = Path(r"C:\v2\scripts\app_scenarios_dump.ts")
OUT_JSON = Path(r"C:\v2\docs\column_5_scenarios_comparison.json")
OUT_MD = Path(r"C:\v2\docs\column_5_scenarios_comparison.md")

SCENARIOS = [
    {
        "id": "S1",
        "name": "Базовый (Уфа, один пролет)",
        "city": "Уфа",
        "responsibilityLevel": "1",
        "roofType": "двускатная",
        "spanM": 24,
        "buildingLengthM": 60,
        "buildingHeightM": 10,
        "roofSlopeDeg": 6,
        "frameStepM": 6,
        "facadeColumnStepM": 6,
        "spansCount": "один",
        "perimeterBracing": "нет",
        "terrainType": "В",
        "roofCoveringType": "С-П 150 мм",
        "wallCoveringType": "С-П 100 мм",
        "extraLoadPercent": 15,
        "supportCraneMode": "нет",
        "supportCraneSingleSpanMode": "да",
        "supportCraneCapacity": "5",
        "supportCraneCount": "один",
        "supportCraneRailLevelM": 3.5,
        "hangingCraneMode": "нет",
        "hangingCraneSingleSpanMode": "да",
        "hangingCraneCapacityT": 2,
    },
    {
        "id": "S2",
        "name": "Уфа, несколько пролетов",
        "city": "Уфа",
        "responsibilityLevel": "1",
        "roofType": "двускатная",
        "spanM": 24,
        "buildingLengthM": 72,
        "buildingHeightM": 10,
        "roofSlopeDeg": 6,
        "frameStepM": 6,
        "facadeColumnStepM": 6,
        "spansCount": "более одного",
        "perimeterBracing": "нет",
        "terrainType": "В",
        "roofCoveringType": "С-П 150 мм",
        "wallCoveringType": "С-П 100 мм",
        "extraLoadPercent": 15,
        "supportCraneMode": "нет",
        "supportCraneSingleSpanMode": "да",
        "supportCraneCapacity": "5",
        "supportCraneCount": "один",
        "supportCraneRailLevelM": 3.5,
        "hangingCraneMode": "нет",
        "hangingCraneSingleSpanMode": "да",
        "hangingCraneCapacityT": 2,
    },
    {
        "id": "S3",
        "name": "Екатеринбург, выше и круче",
        "city": "Екатеринбург",
        "responsibilityLevel": "1",
        "roofType": "двускатная",
        "spanM": 30,
        "buildingLengthM": 72,
        "buildingHeightM": 12,
        "roofSlopeDeg": 10,
        "frameStepM": 6,
        "facadeColumnStepM": 6,
        "spansCount": "более одного",
        "perimeterBracing": "есть",
        "terrainType": "В",
        "roofCoveringType": "С-П 150 мм",
        "wallCoveringType": "С-П 100 мм",
        "extraLoadPercent": 15,
        "supportCraneMode": "нет",
        "supportCraneSingleSpanMode": "да",
        "supportCraneCapacity": "5",
        "supportCraneCount": "один",
        "supportCraneRailLevelM": 3.5,
        "hangingCraneMode": "нет",
        "hangingCraneSingleSpanMode": "да",
        "hangingCraneCapacityT": 2,
    },
    {
        "id": "S4",
        "name": "Казань, односкатная",
        "city": "Казань",
        "responsibilityLevel": "1",
        "roofType": "односкатная",
        "spanM": 24,
        "buildingLengthM": 84,
        "buildingHeightM": 9,
        "roofSlopeDeg": 12,
        "frameStepM": 6,
        "facadeColumnStepM": 6,
        "spansCount": "более одного",
        "perimeterBracing": "нет",
        "terrainType": "А",
        "roofCoveringType": "С-П 150 мм",
        "wallCoveringType": "С-П 100 мм",
        "extraLoadPercent": 15,
        "supportCraneMode": "нет",
        "supportCraneSingleSpanMode": "да",
        "supportCraneCapacity": "5",
        "supportCraneCount": "один",
        "supportCraneRailLevelM": 3.5,
        "hangingCraneMode": "нет",
        "hangingCraneSingleSpanMode": "да",
        "hangingCraneCapacityT": 2,
    },
    {
        "id": "S5",
        "name": "Мурманск, снеговой",
        "city": "Мурманск",
        "responsibilityLevel": "1",
        "roofType": "двускатная",
        "spanM": 30,
        "buildingLengthM": 90,
        "buildingHeightM": 12,
        "roofSlopeDeg": 8,
        "frameStepM": 6,
        "facadeColumnStepM": 6,
        "spansCount": "более одного",
        "perimeterBracing": "нет",
        "terrainType": "С",
        "roofCoveringType": "С-П 150 мм",
        "wallCoveringType": "С-П 100 мм",
        "extraLoadPercent": 15,
        "supportCraneMode": "нет",
        "supportCraneSingleSpanMode": "да",
        "supportCraneCapacity": "5",
        "supportCraneCount": "один",
        "supportCraneRailLevelM": 3.5,
        "hangingCraneMode": "нет",
        "hangingCraneSingleSpanMode": "да",
        "hangingCraneCapacityT": 2,
    },
]

COLUMN_TYPES = ["крайняя", "фахверковая", "средняя"]


def clean(value):
    if value is None:
        return ""
    return str(value).replace("\xa0", " ").replace("\n", " ").strip()


def as_int(value):
    if value is None or value == "":
        return 0
    if isinstance(value, (int, float)):
        return int(round(float(value)))
    try:
        return int(round(float(str(value).replace(",", "."))))
    except Exception:
        return 0


def signature(profile, steel, brace):
    return f"{clean(profile)}|{clean(steel)}|{as_int(brace)}"


def set_excel_inputs(ws, s):
    ws.Range("B2").Value = s["city"]
    ws.Range("B3").Value = s["responsibilityLevel"]
    ws.Range("B4").Value = s["roofType"]
    ws.Range("B7").Value = s["spanM"]
    ws.Range("B8").Value = s["buildingLengthM"]
    ws.Range("B9").Value = s["buildingHeightM"]
    ws.Range("B10").Value = s["roofSlopeDeg"]
    ws.Range("B11").Value = s["frameStepM"]
    ws.Range("B12").Value = s["facadeColumnStepM"]
    ws.Range("B13").Value = s["spansCount"]
    ws.Range("B14").Value = s["perimeterBracing"]
    ws.Range("B18").Value = s["terrainType"]
    ws.Range("B21").Value = s["roofCoveringType"]
    ws.Range("B22").Value = s["wallCoveringType"]
    ws.Range("B30").Value = s["supportCraneMode"]
    ws.Range("B31").Value = s["supportCraneSingleSpanMode"]
    ws.Range("B32").Value = float(s["supportCraneCapacity"])
    ws.Range("B34").Value = s["supportCraneCount"]
    ws.Range("B35").Value = s["supportCraneRailLevelM"]
    ws.Range("F30").Value = s["hangingCraneMode"]
    ws.Range("F31").Value = s["hangingCraneSingleSpanMode"]
    ws.Range("F32").Value = s["hangingCraneCapacityT"]
    ws.Range("B50").Value = s["extraLoadPercent"]


def run_app_dump(tmp_dir: Path):
    scenarios_path = tmp_dir / "scenarios.json"
    app_out_path = tmp_dir / "app_out.json"
    scenarios_path.write_text(json.dumps(SCENARIOS, ensure_ascii=False, indent=2), encoding="utf-8")

    cmd = [
        "npx.cmd",
        "vite-node",
        "--script",
        str(APP_DUMP_SCRIPT),
        str(scenarios_path),
        str(app_out_path),
    ]
    subprocess.run(cmd, cwd=r"C:\v2", check=True, shell=True)

    return json.loads(app_out_path.read_text(encoding="utf-8"))


def read_excel_for_scenarios(tmp_workbook: Path):
    excel = win32.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.AskToUpdateLinks = False

    try:
        wb = excel.Workbooks.Open(str(tmp_workbook), UpdateLinks=0)
        ws = wb.Worksheets("Сводка")
        calc = wb.Worksheets("Расчет")

        all_results = []

        for s in SCENARIOS:
            set_excel_inputs(ws, s)
            scenario_payload = {"scenarioId": s["id"], "scenarioName": s["name"], "types": []}

            for column_type in COLUMN_TYPES:
                ws.Range("B48").Value = column_type
                excel.CalculateFullRebuild()

                n_value = float(ws.Range("B51").Value)
                m_value = float(ws.Range("B54").Value)

                top = []
                for row in range(63, 73):
                    profile = ws.Cells(row, 2).Value
                    steel = ws.Cells(row, 3).Value
                    util = ws.Cells(row, 4).Value
                    criterion = ws.Cells(row, 5).Value
                    brace = ws.Cells(row, 8).Value
                    top.append(
                        {
                            "profile": clean(profile),
                            "steelGrade": clean(steel),
                            "braceCount": as_int(brace),
                            "utilization": None if util is None else float(util),
                            "criterion": clean(criterion),
                            "signature": signature(profile, steel, brace),
                        }
                    )

                pass_range = calc.Range("AS5:AS2084").Value
                pass_count = 0
                for row in pass_range:
                    val = row[0]
                    if isinstance(val, (int, float)) and float(val) > 0:
                        pass_count += 1

                profile_range = calc.Range("L5:L2084").Value
                steel_range = calc.Range("J5:J2084").Value
                brace_range = calc.Range("I5:I2084").Value

                pass_by_signature = {}
                for idx in range(2080):
                    profile = profile_range[idx][0]
                    steel = steel_range[idx][0]
                    brace = brace_range[idx][0]
                    sign = signature(profile, steel, brace)
                    val = pass_range[idx][0]
                    pass_by_signature[sign] = isinstance(val, (int, float)) and float(val) > 0

                scenario_payload["types"].append(
                    {
                        "type": column_type,
                        "loads": {"N": n_value, "M": m_value},
                        "top": top,
                        "passCount": pass_count,
                        "passBySignature": pass_by_signature,
                    }
                )

            all_results.append(scenario_payload)

        wb.Close(SaveChanges=False)
        return all_results
    finally:
        excel.Quit()


def compare(app_data, excel_data):
    app_by_id = {item["scenarioId"]: item for item in app_data}
    report = []

    for excel_item in excel_data:
        sid = excel_item["scenarioId"]
        app_item = app_by_id[sid]
        app_types = {t["type"]: t for t in app_item["types"]}

        scenario_report = {
            "scenarioId": sid,
            "scenarioName": excel_item["scenarioName"],
            "types": [],
        }

        for et in excel_item["types"]:
            t = et["type"]
            at = app_types[t]

            excel_sigs = [row["signature"] for row in et["top"]]
            app_no_sigs = [signature(r["profile"], r["steelGrade"], r["braceCount"]) for r in at["topNoHmax"]]
            app_h_sigs = [signature(r["profile"], r["steelGrade"], r["braceCount"]) for r in at["topAppHmax"]]

            same_no = excel_sigs == app_no_sigs
            same_h = excel_sigs == app_h_sigs

            first_mismatch_no = None
            first_mismatch_h = None
            for i in range(10):
                if i >= len(excel_sigs) or i >= len(app_no_sigs) or excel_sigs[i] != app_no_sigs[i]:
                    first_mismatch_no = i + 1
                    break
            for i in range(10):
                if i >= len(excel_sigs) or i >= len(app_h_sigs) or excel_sigs[i] != app_h_sigs[i]:
                    first_mismatch_h = i + 1
                    break

            excel_pass = et["passBySignature"]
            app_no_pass_hits = sum(1 for s in app_no_sigs if excel_pass.get(s, False))
            app_h_pass_hits = sum(1 for s in app_h_sigs if excel_pass.get(s, False))

            n_excel = et["loads"]["N"]
            m_excel = et["loads"]["M"]
            n_no = at["loadsNoHmax"]["N"]
            m_no = at["loadsNoHmax"]["M"]
            n_h = at["loadsHmax"]["N"]
            m_h = at["loadsHmax"]["M"]

            scenario_report["types"].append(
                {
                    "type": t,
                    "criticalHeightM": at["criticalHeightM"],
                    "excelTopSignatures": excel_sigs,
                    "appNoHmaxTopSignatures": app_no_sigs,
                    "appHmaxTopSignatures": app_h_sigs,
                    "topMatchNoHmax": same_no,
                    "topMatchAppHmax": same_h,
                    "firstMismatchNoHmax": first_mismatch_no,
                    "firstMismatchAppHmax": first_mismatch_h,
                    "excelPassCount": et["passCount"],
                    "excelPassHitsForAppNoHmaxTop10": app_no_pass_hits,
                    "excelPassHitsForAppHmaxTop10": app_h_pass_hits,
                    "loads": {
                        "excel": {"N": n_excel, "M": m_excel},
                        "appNoHmax": {"N": n_no, "M": m_no},
                        "appHmax": {"N": n_h, "M": m_h},
                        "deltaNoHmax": {"N": n_no - n_excel, "M": m_no - m_excel},
                        "deltaHmax": {"N": n_h - n_excel, "M": m_h - m_excel},
                    },
                    "hmaxLikelyCause": (same_no and not same_h),
                }
            )

        report.append(scenario_report)

    return report


def build_markdown(report):
    lines = []
    lines.append("# Сравнение 5 сценариев (Excel vs наш калькулятор)")
    lines.append("")
    lines.append("Примечание: Excel не учитывает `H_max` при отборе для фахверковых и средних; в приложении `H_max` учитывается.")
    lines.append("")

    for s in report:
        lines.append(f"## {s['scenarioId']} — {s['scenarioName']}")
        lines.append("")
        lines.append("| Тип | Совпадение Top10 (без H_max) | Совпадение Top10 (app H_max) | N/M Excel = NoHmax | Pass-hit app H_max (из 10) | H_max как причина |")
        lines.append("|---|---:|---:|---:|---:|---:|")
        for t in s["types"]:
            n_ok = abs(t["loads"]["deltaNoHmax"]["N"]) < 1e-9
            m_ok = abs(t["loads"]["deltaNoHmax"]["M"]) < 1e-9
            nm = "да" if (n_ok and m_ok) else "нет"
            lines.append(
                f"| {t['type']} | {'да' if t['topMatchNoHmax'] else 'нет'} | {'да' if t['topMatchAppHmax'] else 'нет'} | {nm} | {t['excelPassHitsForAppHmaxTop10']} | {'да' if t['hmaxLikelyCause'] else 'нет'} |"
            )
        lines.append("")

    return "\n".join(lines)


def main():
    if not WORKBOOK_SOURCE.exists():
        raise FileNotFoundError(f"Workbook not found: {WORKBOOK_SOURCE}")

    with tempfile.TemporaryDirectory(prefix="col_compare_") as tmp:
        tmp_dir = Path(tmp)
        tmp_workbook = tmp_dir / WORKBOOK_SOURCE.name
        shutil.copy2(WORKBOOK_SOURCE, tmp_workbook)

        app_data = run_app_dump(tmp_dir)
        excel_data = read_excel_for_scenarios(tmp_workbook)
        report = compare(app_data, excel_data)

        payload = {
            "scenarios": SCENARIOS,
            "appData": app_data,
            "excelData": excel_data,
            "report": report,
        }

        OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        OUT_MD.write_text(build_markdown(report), encoding="utf-8")

        print(f"JSON: {OUT_JSON}")
        print(f"MD: {OUT_MD}")


if __name__ == "__main__":
    main()
