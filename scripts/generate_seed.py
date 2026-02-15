import argparse
import io
import json
import re
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

DEFAULT_OUT = Path(r"d:\Invictus Day1\src\assets\seedData.json")
DEFAULT_ATOMBERG = Path(r"d:\Atomberg Data.xlsm")
DEFAULT_BAJAJ = Path(r"d:\Bajaj PCB Dec 25 Data.xlsm")

DRIVE_IDS = {
    "atomberg": "1ffoZB91dClmEpedNzUihkIXZHK3IFBnC",
    "bajaj": "1MfZy8W-neubScR94lo63lg00XQ9dn9Ch",
}

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG = "http://schemas.openxmlformats.org/package/2006/relationships"
PLACEHOLDER_COMPONENT_TOKENS = {
    "NA",
    "N/A",
    "N.A",
    "N A",
    "NULL",
    "NONE",
    "-",
    "--",
    "NOT APPLICABLE",
}


def read_workbook_bytes(local_path: Path, drive_id: str) -> bytes:
    if local_path.exists():
        print(f"Using local workbook: {local_path}")
        return local_path.read_bytes()

    print(f"Local file not found ({local_path}), downloading from Drive id {drive_id}")
    url = f"https://drive.google.com/uc?export=download&id={drive_id}"
    return urllib.request.urlopen(url, timeout=90).read()


def parse_workbook(data):
    zf = zipfile.ZipFile(io.BytesIO(data))

    shared = []
    if "xl/sharedStrings.xml" in zf.namelist():
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
        for si in root.findall(f"{{{NS_MAIN}}}si"):
            texts = [n.text or "" for n in si.findall(f".//{{{NS_MAIN}}}t")]
            shared.append("".join(texts))

    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {r.attrib["Id"]: r.attrib["Target"] for r in rels.findall(f"{{{NS_PKG}}}Relationship")}

    sheets = {}
    for s in wb.findall(f".//{{{NS_MAIN}}}sheet"):
        name = s.attrib["name"]
        rid = s.attrib.get(f"{{{NS_REL}}}id")
        target = rel_map.get(rid, "")
        path = "xl/" + target.replace("\\", "/") if not target.startswith("/") else target.lstrip("/")
        sheets[name] = path

    def read_sheet(sheet_name):
        if sheet_name not in sheets:
            return []
        root = ET.fromstring(zf.read(sheets[sheet_name]))
        rows = []
        for row in root.findall(f".//{{{NS_MAIN}}}sheetData/{{{NS_MAIN}}}row"):
            cells = {}
            for c in row.findall(f"{{{NS_MAIN}}}c"):
                ref = c.attrib.get("r", "")
                col = ""
                for ch in ref:
                    if ch.isalpha():
                        col += ch
                    else:
                        break
                t = c.attrib.get("t")
                v = c.find(f"{{{NS_MAIN}}}v")
                val = ""
                if t == "s" and v is not None and (v.text or "").isdigit():
                    idx = int(v.text)
                    val = shared[idx] if 0 <= idx < len(shared) else ""
                elif t == "inlineStr":
                    tnode = c.find(f".//{{{NS_MAIN}}}t")
                    val = tnode.text if tnode is not None and tnode.text else ""
                elif v is not None and v.text is not None:
                    val = v.text
                if val != "":
                    cells[col] = val.strip()
            if cells:
                rows.append(cells)
        return rows

    return {
        "sheet_names": list(sheets.keys()),
        "read_sheet": read_sheet,
    }


def split_components(value):
    if not value:
        return []
    parts = re.split(r"[\\/,+]", value)
    output = []
    for raw in parts:
        token = raw.strip()
        if not token:
            continue
        if is_placeholder_component(token):
            continue
        output.append(token)
    return output


def is_placeholder_component(value):
    token = str(value or "").strip().upper()
    if not token:
        return True
    if token in PLACEHOLDER_COMPONENT_TOKENS:
        return True
    return False


def maybe_excel_date_to_iso(value):
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None

    if raw.isdigit():
        serial = int(raw)
        if 20000 <= serial <= 70000:
            base = datetime(1899, 12, 30)
            return (base + timedelta(days=serial)).isoformat() + "Z"

    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt).isoformat() + "Z"
        except ValueError:
            pass

    return None


def append_consumption(consumption_map, production_count, component_counts, pcb_code, components, date_hint=None):
    if not pcb_code:
        return
    date_value = maybe_excel_date_to_iso(date_hint) or datetime.utcnow().isoformat() + "Z"
    if components:
        production_count[pcb_code] += 1

    for comp in components:
        component_counts[comp] += 1
        consumption_map[(date_value, pcb_code, comp)] += 1


def main():
    parser = argparse.ArgumentParser(description="Generate frontend seed data from workbook sources")
    parser.add_argument("--atomberg", default=str(DEFAULT_ATOMBERG), help="Path to Atomberg .xlsm file")
    parser.add_argument("--bajaj", default=str(DEFAULT_BAJAJ), help="Path to Bajaj .xlsm file")
    parser.add_argument("--output", default=str(DEFAULT_OUT), help="Output seed JSON path")
    args = parser.parse_args()

    atomberg_bytes = read_workbook_bytes(Path(args.atomberg), DRIVE_IDS["atomberg"])
    bajaj_bytes = read_workbook_bytes(Path(args.bajaj), DRIVE_IDS["bajaj"])

    atomberg = parse_workbook(atomberg_bytes)
    bajaj = parse_workbook(bajaj_bytes)

    component_counts = defaultdict(float)
    pcb_map = defaultdict(set)
    consumption_map = defaultdict(int)
    production_count = defaultdict(int)

    # Atomberg: component count summary
    for row in atomberg["read_sheet"]("Component Consumption"):
        name = row.get("B", "").strip()
        if not name or name.lower().startswith("row labels") or name.lower().startswith("grand"):
            continue
        if is_placeholder_component(name):
            continue
        try:
            count = float(row.get("C", "0"))
        except ValueError:
            count = 0
        if count > 0:
            component_counts[name] += count

    # Atomberg: row-level analysis
    for row in atomberg["read_sheet"]("PCB-Serial-No"):
        pcb_code = row.get("D", "").strip()
        if not pcb_code or pcb_code.lower().startswith("part code"):
            continue
        components = split_components(row.get("F") or row.get("E") or "")
        for comp in components:
            pcb_map[pcb_code].add(comp)
        append_consumption(consumption_map, production_count, component_counts, pcb_code, components, row.get("C"))

    # Bajaj: component count summary
    for row in bajaj["read_sheet"]("Master_Summary"):
        name = row.get("B", "").strip()
        if not name or name.lower() == "component":
            continue
        if is_placeholder_component(name):
            continue
        try:
            count = float(row.get("D", "0"))
        except ValueError:
            count = 0
        if count > 0:
            component_counts[name] += count

    # Bajaj: numeric sheets carry full row-level consumption
    reserved = {"Master_Summary", "Dashboard", "Pivot"}
    for sheet_name in bajaj["sheet_names"]:
        if sheet_name in reserved or not re.fullmatch(r"\d+", sheet_name):
            continue
        rows = bajaj["read_sheet"](sheet_name)
        for row in rows:
            pcb_code = (row.get("J") or sheet_name).strip()
            if not pcb_code or pcb_code.lower() == "part code":
                continue
            components = split_components(row.get("U", ""))
            for comp in components:
                pcb_map[pcb_code].add(comp)
            append_consumption(consumption_map, production_count, component_counts, pcb_code, components, row.get("N"))

    components = []
    component_id_by_name = {}

    for idx, (name, count) in enumerate(sorted(component_counts.items(), key=lambda x: x[0].lower()), 1):
        monthly = int(round(count)) if count > 0 else 1
        monthly = max(monthly, 1)
        component_id = f"cmp-{idx:04d}"
        component_id_by_name[name] = component_id
        components.append(
            {
                "id": component_id,
                "name": name,
                "partNumber": name,
                "currentStockQty": monthly,
                "monthlyRequiredQty": monthly,
                "createdAt": datetime.utcnow().isoformat() + "Z",
            }
        )

    pcbs = []
    for idx, (pcb_name, component_names) in enumerate(sorted(pcb_map.items(), key=lambda x: x[0]), 1):
        mappings = []
        for comp_name in sorted(component_names):
            comp_id = component_id_by_name.get(comp_name)
            if not comp_id:
                comp_id = f"cmp-{len(components) + 1:04d}"
                component_id_by_name[comp_name] = comp_id
                components.append(
                    {
                        "id": comp_id,
                        "name": comp_name,
                        "partNumber": comp_name,
                        "currentStockQty": 1,
                        "monthlyRequiredQty": 1,
                        "createdAt": datetime.utcnow().isoformat() + "Z",
                    }
                )
            mappings.append({"componentId": comp_id, "quantityPerComponent": 1})

        pcbs.append(
            {
                "id": f"pcb-{idx:04d}",
                "name": pcb_name,
                "components": mappings,
                "createdAt": datetime.utcnow().isoformat() + "Z",
            }
        )

    production_entries = []
    for idx, (pcb_name, qty) in enumerate(sorted(production_count.items(), key=lambda x: x[0]), 1):
        production_entries.append(
            {
                "id": f"prd-seed-{idx:05d}",
                "pcbName": pcb_name,
                "quantityToProduce": qty,
                "createdAt": datetime.utcnow().isoformat() + "Z",
                "deductions": [],
            }
        )

    consumption_history = []
    for idx, ((date_value, pcb_name, component_name), consumed_qty) in enumerate(
        sorted(consumption_map.items(), key=lambda x: (x[0][0], x[0][1], x[0][2])), 1
    ):
        consumption_history.append(
            {
                "id": f"cons-{idx:07d}",
                "date": date_value,
                "componentName": component_name,
                "componentId": component_id_by_name.get(component_name, ""),
                "pcbName": pcb_name,
                "consumedQty": consumed_qty,
            }
        )

    data = {
        "components": components,
        "pcbs": pcbs,
        "productionEntries": production_entries,
        "procurementTriggers": [],
        "consumptionHistory": consumption_history,
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(
        f"Wrote seed data: components={len(components)}, pcbs={len(pcbs)}, "
        f"consumptionRows={len(consumption_history)}, productionEntries={len(production_entries)} -> {out_path}"
    )


if __name__ == "__main__":
    main()
