#!/usr/bin/env python3
"""Bulk import CampNova college dataset from CSV into PostgreSQL safely.

This script is intentionally conservative and does not execute the import unless the
user passes --execute. It validates the CSV, checks for duplicate or missing AISHE
codes, verifies the target schema, and wraps the final insert in a transaction.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import psycopg2
from psycopg2.extras import execute_values

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import db


REQUIRED_COLUMNS = {
    "AISHE code": "aishe_code",
    "College Name": "college_name",
    "State": "state",
    "District": "district",
    "web url": "website",
    "Year of established": "established_year",
    "Location Type(Rural/Urban)": "location_type",
    "Institute Type": "college_type",
    "NAAC Grade": "naac_grade",
    "Accreditation": "accreditation",
    "NIRF Rank": "nirf_rank",
    "Address": "address",
    "Email": "email",
    "Phone": "phone",
    "Description": "description",
    "Logo URL": "logo_url",
    "Status": "status",
}

VALID_STATUSES = {"active", "inactive", "pending_verification", "archived"}
NULL_TOKENS = {"", "null", "none", "n/a", "na", "nan", "nil", "undefined"}


def normalize_header(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().replace("\ufeff", "")


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None
    lowered = text.lower()
    if lowered in NULL_TOKENS:
        return None
    return text


def parse_year(value: Any) -> int | None:
    text = clean_text(value)
    if text is None:
        return None
    if re.fullmatch(r"\d{4}", text):
        year = int(text)
        if 1000 <= year <= 9999:
            return year
    return None


def normalize_status(value: Any) -> str | None:
    text = clean_text(value)
    if text is None:
        return None
    normalized = text.strip().lower()
    if normalized not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{text}'. Allowed values: {sorted(VALID_STATUSES)}")
    return normalized


def normalize_college_type(value: Any) -> str | None:
    text = clean_text(value)
    if text is None:
        return None
    
    # Handle LLM explanatory completions present in raw data
    quotes = re.findall(r'["“\']([^"”\']+)["”\']', text)
    if quotes:
        candidate = quotes[-1].strip().strip('."\'“” ,')
        if candidate.lower() not in NULL_TOKENS and len(candidate) <= 100:
            return candidate
            
    if " is " in text:
        candidate = text.split(" is ")[-1].strip().strip('."\'“” ,')
        if candidate.lower() not in NULL_TOKENS and len(candidate) <= 100:
            return candidate

    res = text[:100].strip().strip('."\'“” ,')
    return res if res.lower() not in NULL_TOKENS else None


def normalize_row(raw_row: Dict[str, Any], row_number: int) -> Dict[str, Any]:
    normalized = {}
    for csv_key, target_key in REQUIRED_COLUMNS.items():
        value = raw_row.get(csv_key)
        normalized[target_key] = value

    aishe_code = clean_text(normalized.get("aishe_code"))
    if aishe_code is None:
        raise ValueError(f"Row {row_number}: AISHE code is missing or null.")
    normalized["aishe_code"] = aishe_code

    college_name = clean_text(normalized.get("college_name"))
    if college_name is None:
        raise ValueError(f"Row {row_number}: College Name is missing or null.")
    normalized["college_name"] = college_name

    normalized["state"] = clean_text(normalized.get("state"))
    normalized["district"] = clean_text(normalized.get("district"))
    normalized["website"] = clean_text(normalized.get("website"))
    normalized["location_type"] = clean_text(normalized.get("location_type"))
    normalized["college_type"] = normalize_college_type(normalized.get("college_type"))
    normalized["naac_grade"] = clean_text(normalized.get("naac_grade"))
    normalized["accreditation"] = clean_text(normalized.get("accreditation"))
    normalized["nirf_rank"] = clean_text(normalized.get("nirf_rank"))
    normalized["address"] = clean_text(normalized.get("address"))
    normalized["email"] = clean_text(normalized.get("email"))
    normalized["phone"] = clean_text(normalized.get("phone"))
    normalized["description"] = clean_text(normalized.get("description"))
    normalized["logo_url"] = clean_text(normalized.get("logo_url"))
    normalized["verification_notes_sources"] = clean_text(raw_row.get("Verification Notes / Sources"))

    year_value = normalized.get("established_year")
    normalized["established_year"] = parse_year(year_value)

    normalized["status"] = normalize_status(normalized.get("status"))

    return normalized


def read_csv_rows(csv_path: Path) -> Tuple[List[Dict[str, Any]], List[str], int]:
    rows: List[Dict[str, Any]] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError(f"CSV file '{csv_path}' is missing a header row.")

        fieldnames = [normalize_header(name) for name in reader.fieldnames]
        cleaned_map = {normalize_header(name): name for name in reader.fieldnames}
        missing = [expected for expected in REQUIRED_COLUMNS.keys() if expected not in cleaned_map]
        if missing:
            raise ValueError(f"CSV is missing required columns: {missing}")

        for row_number, raw_row in enumerate(reader, start=2):
            normalized_raw = {key: raw_row.get(actual_key) for key, actual_key in cleaned_map.items() if actual_key is not None}
            rows.append(normalize_row(normalized_raw, row_number))

    return rows, fieldnames, len(rows)


def get_existing_aishe_codes(conn) -> List[str]:
    with conn.cursor() as cur:
        cur.execute("SELECT aishe_code FROM colleges WHERE aishe_code IS NOT NULL")
        return [str(item[0]) for item in cur.fetchall()]


def build_import_rows(rows: Iterable[Dict[str, Any]]) -> List[Tuple[Any, ...]]:
    output = []
    for row in rows:
        output.append(
            (
                row["aishe_code"],
                row["college_name"],
                row.get("short_name"),
                row.get("college_type"),
                row.get("university"),
                row.get("location_type"),
                row.get("district"),
                row.get("state"),
                row.get("established_year"),
                row.get("accreditation"),
                row.get("naac_grade"),
                row.get("nirf_rank"),
                row.get("description"),
                row.get("address"),
                row.get("website"),
                row.get("email"),
                row.get("phone"),
                row.get("logo_url"),
                row.get("status") or "active",
            )
        )
    return output


def write_verification_notes(rows: List[Dict[str, Any]], output_path: Path | None) -> None:
    if output_path is None:
        return
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["aishe_code", "verification_notes_sources"])
        for row in rows:
            writer.writerow([
                row.get("aishe_code"),
                row.get("verification_notes_sources") or "",
            ])


def validate_preflight(csv_path: Path, conn, verification_output: Path | None = None) -> Dict[str, Any]:
    rows, fieldnames, csv_row_count = read_csv_rows(csv_path)

    if csv_row_count == 0:
        raise ValueError(f"CSV '{csv_path}' contains no data rows.")

    missing_aishe = [i + 1 for i, row in enumerate(rows) if row.get("aishe_code") is None]
    if missing_aishe:
        raise ValueError(f"CSV contains missing AISHE codes in rows: {missing_aishe[:20]}")

    aishe_codes = [row["aishe_code"] for row in rows]
    duplicate_aishe = sorted({code for code in aishe_codes if aishe_codes.count(code) > 1})
    if duplicate_aishe:
        raise ValueError(f"CSV contains duplicate AISHE codes: {duplicate_aishe[:20]}")

    existing_aishe = get_existing_aishe_codes(conn)
    duplicates_in_db = sorted(set(aishe_codes) & set(existing_aishe))
    if duplicates_in_db:
        raise ValueError(
            "Existing PostgreSQL colleges table already contains AISHE codes from this CSV: "
            f"{duplicates_in_db[:20]}"
        )

    existing_count = conn.cursor().execute("SELECT COUNT(*) FROM colleges").fetchone()[0] if False else None
    # Deterministic count check using a dedicated cursor below.
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM colleges")
        existing_count = cur.fetchone()[0]

    if existing_count > 0:
        print(
            f"[WARNING] PostgreSQL colleges table already contains {existing_count} records. "
            "The script will stop before import so it does not create duplicate or conflicting rows."
        )
        raise ValueError("Import blocked because the colleges table is not empty.")

    invalid_rows = []
    for row in rows:
        try:
            normalize_status(row.get("status"))
        except ValueError as exc:
            invalid_rows.append(f"AISHE {row['aishe_code']}: {exc}")

    for row in rows:
        if row.get("established_year") is None and row.get("established_year") is not None:
            pass

    if invalid_rows:
        raise ValueError("Invalid data detected: " + "; ".join(invalid_rows[:10]))

    verification_rows = []
    for row in rows:
        verification_rows.append({
            "aishe_code": row.get("aishe_code"),
            "verification_notes_sources": row.get("verification_notes_sources") or "",
        })
    if verification_output is not None:
        write_verification_notes(verification_rows, verification_output)

    return {
        "csv_row_count": csv_row_count,
        "fieldnames": fieldnames,
        "rows": rows,
        "duplicate_aishe": duplicate_aishe,
        "missing_aishe": missing_aishe,
        "existing_count": existing_count,
    }


def import_csv(csv_path: Path, execute: bool = False, verification_output: Path | None = None) -> Dict[str, Any]:
    params = db.get_connection_params()
    conn = psycopg2.connect(**params)
    conn.autocommit = False

    try:
        report = validate_preflight(csv_path, conn, verification_output=verification_output)

        if not execute:
            print("[DRY RUN] Validation passed. No rows inserted. Re-run with --execute to perform the import.")
            return report

        rows = report["rows"]
        insert_rows = build_import_rows(rows)

        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO colleges (
                    aishe_code,
                    college_name,
                    short_name,
                    college_type,
                    university,
                    location_type,
                    district,
                    state,
                    established_year,
                    accreditation,
                    naac_grade,
                    nirf_rank,
                    description,
                    address,
                    website,
                    email,
                    phone,
                    logo_url,
                    status
                ) VALUES %s
                """,
                insert_rows,
            )
            conn.commit()

        print(f"[SUCCESS] Imported {len(insert_rows)} rows into the colleges table.")
        report["imported_rows"] = len(insert_rows)
        report["status"] = "imported"
        return report

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Safely import the CampNova college CSV into PostgreSQL.")
    parser.add_argument("--csv", default=str(Path(__file__).resolve().parents[1] / "data" / "master_enriched_colleges_tamil_nadu.csv"), help="Path to the source CSV file.")
    parser.add_argument("--execute", action="store_true", help="Actually insert rows into PostgreSQL. Default is dry-run validation only.")
    parser.add_argument("--verification-output", default=None, help="Optional sidecar CSV file for verification/source notes without changing the schema.")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    verification_output = Path(args.verification_output) if args.verification_output else None

    if not csv_path.exists():
        print(f"[ERROR] CSV file not found: {csv_path}", file=sys.stderr)
        return 2

    try:
        report = import_csv(csv_path, execute=args.execute, verification_output=verification_output)
        print(json.dumps({
            "csv_row_count": report["csv_row_count"],
            "fieldnames": report["fieldnames"],
            "existing_count": report["existing_count"],
            "status": report.get("status", "validated"),
            "imported_rows": report.get("imported_rows", 0),
        }, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(f"[ERROR] Import aborted: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
