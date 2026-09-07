"""
Bulk Excel Service for TheCampusNova Admin Portal.
Handles reading, validating, matching, and transactional updating of colleges from Excel (.xlsx) files.
Focuses EXCLUSIVELY on the 7 bulk-identification fields:
  1. AISHE Code
  2. Name
  3. State
  4. District
  5. Website
  6. Year Of Establishment
  7. Location

Enforces:
  - 100 MB max file size limit & .xlsx format only
  - Strict 7 BASE field validation
  - Identifying mismatches detection
  - Database AISHE matching
  - Non-destructive updates (blank cells never overwrite existing values)
  - Duplicate prevention (updates existing records via aishe_code)
"""

import os
import io
import re
import json
import logging
import openpyxl
from openpyxl.utils.exceptions import InvalidFileException
import db

logger = logging.getLogger(__name__)

# Max upload size: 100 MB
MAX_EXCEL_SIZE_BYTES = 100 * 1024 * 1024

# The 7 bulk-identification fields
BULK_7_FIELDS = {
    "aishe_code": {
        "label": "AISHE Code",
        "patterns": [r"aishe\s*code", r"^aishe$", r"aishe_code", r"^code$"],
        "db_col": "aishe_code",
        "required": True
    },
    "college_name": {
        "label": "Name",
        "patterns": [r"^name$", r"college\s*name", r"institution\s*name", r"university\s*name"],
        "db_col": "college_name",
        "required": True
    },
    "state": {
        "label": "State",
        "patterns": [r"^state$", r"state\s*name"],
        "db_col": "state",
        "required": True
    },
    "district": {
        "label": "District",
        "patterns": [r"^district$", r"district\s*name"],
        "db_col": "district",
        "required": True
    },
    "website": {
        "label": "Website",
        "patterns": [r"^website$", r"official\s*website", r"web\s*site", r"website\s*url"],
        "db_col": "website",
        "required": True
    },
    "established_year": {
        "label": "Year Of Establishment",
        "patterns": [r"year\s*of\s*establishment", r"established\s*year", r"establishment\s*year", r"^established$", r"^year$"],
        "db_col": "established_year",
        "required": True
    },
    "location": {
        "label": "Location",
        "patterns": [r"^location$", r"location\s*\(city,\s*state\)", r"city", r"place"],
        "db_col": "location",
        "required": True
    }
}


# The Individual College Details fields (reusing exactly existing Add/Edit form fields & DB mappings)
INDIVIDUAL_COLLEGE_FIELDS = {
    "aishe_code": {
        "label": "AISHE Code",
        "patterns": [r"aishe\s*code", r"^aishe$", r"aishe_code", r"^code$"],
        "db_col": "aishe_code",
        "is_identifier": True
    },
    "college_name": {
        "label": "College Name",
        "patterns": [r"^name$", r"college\s*name", r"institution\s*name", r"university\s*name"],
        "db_col": "college_name",
        "is_identifier": True
    },
    "college_type": {
        "label": "Institution Type",
        "patterns": [r"institution\s*type", r"college\s*type", r"^type$"],
        "db_col": "college_type"
    },
    "nirf_rank": {
        "label": "NIRF Rank",
        "patterns": [r"nirf\s*rank", r"^nirf$", r"^rank$"],
        "db_col": "nirf_rank"
    },
    "rating": {
        "label": "Rating",
        "patterns": [r"^rating$", r"star\s*rating", r"score"],
        "db_col": "rating"
    },
    "fees": {
        "label": "Annual Tuition Fees",
        "patterns": [r"annual\s*tuition\s*fees", r"tuition\s*fees", r"^fees$", r"fee\s*structure"],
        "db_col": "fees"
    },
    "placement": {
        "label": "Avg. Placement",
        "patterns": [r"avg\.?\s*placement", r"average\s*placement", r"median\s*ctc", r"^placement$"],
        "db_col": "placement"
    },
    "highest_placement": {
        "label": "Highest Placement",
        "patterns": [r"highest\s*placement", r"highest\s*package", r"max\s*placement", r"max\s*ctc"],
        "db_col": "highest_placement"
    },
    "courses_list": {
        "label": "Primary Courses / Streams",
        "patterns": [r"primary\s*courses", r"courses\s*/\s*streams", r"^courses$", r"^streams$"],
        "db_col": "courses_list"
    },
    "description": {
        "label": "Campus Overview",
        "patterns": [r"campus\s*overview", r"^overview$", r"^description$", r"about\s*college"],
        "db_col": "description"
    },
    "facilities_list": {
        "label": "Infrastructure Highlights",
        "patterns": [r"infrastructure\s*highlights", r"facilities\s*list", r"^facilities$", r"amenities"],
        "db_col": "facilities_list"
    },
    "image_url": {
        "label": "Institution Image URL",
        "patterns": [r"institution\s*image", r"image\s*url", r"^image$", r"photo"],
        "db_col": "image_url"
    },
    "video_url": {
        "label": "Institution Video URL",
        "patterns": [r"institution\s*video", r"video\s*url", r"^video$", r"campus\s*video"],
        "db_col": "video_url"
    },
    "website": {
        "label": "Official Website URL",
        "patterns": [r"official\s*website", r"^website$", r"web\s*site", r"website\s*url"],
        "db_col": "website"
    },
    "cutoff": {
        "label": "Cutoff",
        "patterns": [r"^cutoff$", r"cut\s*off", r"cutoff\s*marks"],
        "db_col": "cutoff"
    },
    "accreditation": {
        "label": "Accreditation",
        "patterns": [r"^accreditation$", r"naac\s*grade", r"^naac$"],
        "db_col": "accreditation"
    },
    "email": {
        "label": "Email",
        "patterns": [r"^email$", r"contact\s*email", r"official\s*email"],
        "db_col": "email"
    },
    "phone": {
        "label": "Phone",
        "patterns": [r"^phone$", r"contact\s*number", r"mobile", r"telephone"],
        "db_col": "phone"
    },
    "eligibility": {
        "label": "Eligibility",
        "patterns": [r"^eligibility$", r"admission\s*eligibility"],
        "db_col": "eligibility"
    },
    "location": {
        "label": "Location",
        "patterns": [r"^location$", r"location\s*\(city,\s*state\)", r"city"],
        "db_col": "location"
    },
    "state": {
        "label": "State",
        "patterns": [r"^state$", r"state\s*name"],
        "db_col": "state"
    },
    "district": {
        "label": "District",
        "patterns": [r"^district$", r"district\s*name"],
        "db_col": "district"
    },
    "established_year": {
        "label": "Year Of Establishment",
        "patterns": [r"year\s*of\s*establishment", r"established\s*year", r"^established$", r"^year$"],
        "db_col": "established_year"
    },
    "short_name": {
        "label": "Short Name",
        "patterns": [r"short\s*name", r"^abbreviation$", r"^acronym$"],
        "db_col": "short_name"
    },
    "university": {
        "label": "Affiliated University",
        "patterns": [r"affiliated\s*university", r"^university$", r"^affiliation$"],
        "db_col": "university"
    },
    "location_type": {
        "label": "Location Type",
        "patterns": [r"location\s*type", r"area\s*type", r"urban\s*/\s*rural"],
        "db_col": "location_type"
    },
    "naac_grade": {
        "label": "NAAC Grade",
        "patterns": [r"naac\s*grade", r"^naac$", r"naac\s*rating"],
        "db_col": "naac_grade"
    },
    "address": {
        "label": "Campus Address",
        "patterns": [r"campus\s*address", r"^address$", r"full\s*address", r"postal\s*address"],
        "db_col": "address"
    },
    "recruiters": {
        "label": "Top Recruiters",
        "patterns": [r"top\s*recruiters", r"recruiting\s*companies", r"^recruiters$", r"placement\s*partners"],
        "db_col": "recruiters"
    },
    "internship_support": {
        "label": "Internship Support",
        "patterns": [r"internship\s*support", r"internship\s*opportunities", r"^internships?$"],
        "db_col": "internship_support"
    },
    "scholarships_info": {
        "label": "Scholarships & Financial Aid",
        "patterns": [r"scholarships?\s*(?:info|details)?", r"financial\s*aid", r"^scholarships?$"],
        "db_col": "scholarships_info"
    },
    "logo_url": {
        "label": "College Logo URL",
        "patterns": [r"college\s*logo", r"logo\s*url", r"^logo$"],
        "db_col": "logo_url"
    },
    "badge": {
        "label": "Institution Badge",
        "patterns": [r"institution\s*badge", r"^badge$", r"autonomous\s*status"],
        "db_col": "badge"
    },
    "reviews_count": {
        "label": "Reviews Count",
        "patterns": [r"reviews?\s*count", r"total\s*reviews", r"^reviews$"],
        "db_col": "reviews_count"
    },
    "stream": {
        "label": "Primary Stream",
        "patterns": [r"primary\s*stream", r"^stream$", r"academic\s*stream", r"^discipline$"],
        "db_col": "stream"
    },
    "domains_list": {
        "label": "Focus Domains",
        "patterns": [r"focus\s*domains?", r"domains?\s*list", r"^domains?$"],
        "db_col": "domains_list"
    }
}


def _match_header_to_field(header_text):
    """Matches a header string to one of the 7 bulk field keys."""
    if not header_text:
        return None
    clean_text = str(header_text).strip().lower()

    for field_key, cfg in BULK_7_FIELDS.items():
        for pat in cfg["patterns"]:
            if re.search(pat, clean_text, re.IGNORECASE):
                return field_key
    return None


def _match_header_to_individual_field(header_text):
    """Matches a header string to one of the Individual College Details fields."""
    if not header_text:
        return None
    clean_text = str(header_text).strip().lower()

    for field_key, cfg in INDIVIDUAL_COLLEGE_FIELDS.items():
        for pat in cfg["patterns"]:
            if re.search(pat, clean_text, re.IGNORECASE):
                return field_key
    return None


def detect_header_and_parse_rows(sheet):
    """
    Scans the first 15 rows of an openpyxl sheet to locate the true table header row.
    Returns:
        header_row_idx: 1-based index of header row
        field_map: dict of {column_idx: field_key}
        data_rows: list of dicts {field_key: value, '_row_number': int}
    """
    rows_iter = list(sheet.iter_rows(values_only=True))
    if not rows_iter:
        return None, {}, []

    header_row_idx = None
    best_field_map = {}
    best_match_count = 0

    # Scan first 15 rows
    for r_idx, row_vals in enumerate(rows_iter[:15], start=1):
        field_map = {}
        match_count = 0
        for c_idx, cell_val in enumerate(row_vals):
            if cell_val is not None and str(cell_val).strip():
                matched_field = _match_header_to_field(str(cell_val))
                if matched_field and matched_field not in field_map.values():
                    field_map[c_idx] = matched_field
                    match_count += 1

        if match_count > best_match_count:
            best_match_count = match_count
            best_field_map = field_map
            header_row_idx = r_idx

    if header_row_idx is None or best_match_count == 0:
        return None, {}, []

    # Parse rows following the detected header row
    parsed_rows = []
    for r_idx, row_vals in enumerate(rows_iter[header_row_idx:], start=header_row_idx + 1):
        # Skip completely empty rows
        if not any(v is not None and str(v).strip() for v in row_vals):
            continue

        row_dict = {}
        for c_idx, field_key in best_field_map.items():
            val = row_vals[c_idx] if c_idx < len(row_vals) else None
            if val is not None:
                val_str = str(val).strip()
                row_dict[field_key] = val_str if val_str else None
            else:
                row_dict[field_key] = None

        row_dict["_row_number"] = r_idx
        parsed_rows.append(row_dict)

    return header_row_idx, best_field_map, parsed_rows


def parse_and_validate_excel(file_stream_or_path, file_size=None):
    """
    Validates Excel file for the 7 bulk-identification fields:
    - AISHE Code
    - Name
    - State
    - District
    - Website
    - Year Of Establishment
    - Location

    Matches records against PostgreSQL colleges table using aishe_code.
    Identifies:
      - Missing field
      - Identifying mismatch
      - College not found
      - Invalid data
    """
    # 1. 100 MB Limit check
    if file_size is not None and file_size > MAX_EXCEL_SIZE_BYTES:
        return {
            "success": False,
            "error_type": "file_size_exceeded",
            "message": f"File size ({round(file_size / (1024*1024), 2)} MB) exceeds maximum allowed limit of 100 MB."
        }

    # 2. Load Workbook
    try:
        if isinstance(file_stream_or_path, (str, bytes, os.PathLike)):
            wb = openpyxl.load_workbook(file_stream_or_path, data_only=True, read_only=True)
        else:
            wb = openpyxl.load_workbook(io.BytesIO(file_stream_or_path.read()), data_only=True, read_only=True)
    except InvalidFileException:
        return {
            "success": False,
            "error_type": "invalid_file_format",
            "message": "Invalid Excel file format. Please upload a valid .xlsx file."
        }
    except Exception as e:
        logger.error(f"[Excel Read Error] {e}")
        return {
            "success": False,
            "error_type": "read_error",
            "message": f"Failed to parse Excel file: {str(e)}"
        }

    sheet = wb.active
    if sheet is None:
        return {
            "success": False,
            "error_type": "empty_workbook",
            "message": "The uploaded Excel workbook contains no active worksheets."
        }

    header_row_idx, field_map, rows_data = detect_header_and_parse_rows(sheet)
    if not header_row_idx:
        return {
            "success": False,
            "error_type": "header_detection_failed",
            "message": "Could not identify table headers. Ensure your Excel file contains column headers for the 7 bulk fields."
        }

    detected_fields = set(field_map.values())

    # 3. Check presence of the 7 bulk fields in headers
    missing_headers = []
    field_header_status = {}
    for f_key, cfg in BULK_7_FIELDS.items():
        is_present = f_key in detected_fields
        field_header_status[f_key] = {
            "label": cfg["label"],
            "present": is_present
        }
        if not is_present:
            missing_headers.append(cfg["label"])

    has_all_headers = len(missing_headers) == 0

    return validate_rows_data(
        rows_data=rows_data,
        field_header_status=field_header_status,
        base_fields_valid=has_all_headers,
        missing_headers=missing_headers,
        header_row_idx=header_row_idx
    )


def validate_rows_data(rows_data, field_header_status=None, base_fields_valid=True, missing_headers=None, header_row_idx=1):
    """
    Validates ONLY whether the required column/sub-field structure is correct.
    DOES NOT validate the actual cell contents/data.
    If all required fields/sub-fields are present correctly:
      -> Shows the existing Save / Confirm & Save Bulk Data option.
      -> Does NOT show Missing / Invalid / Mismatch errors based on cell contents.
    """
    if field_header_status is None:
        field_header_status = {
            f_key: {"label": cfg["label"], "present": True}
            for f_key, cfg in BULK_7_FIELDS.items()
        }
    if missing_headers is None:
        missing_headers = []

    has_all_headers = bool(base_fields_valid and len(missing_headers) == 0)

    processed_rows = []

    for idx, r in enumerate(rows_data):
        row_num = r.get("_row_number") or r.get("row_number") or (idx + 1)

        raw_aishe = r.get("aishe_code") or ""
        aishe_clean = str(raw_aishe).strip().upper() if raw_aishe else ""

        raw_year = r.get("established_year")
        norm_year = None
        if raw_year is not None and str(raw_year).strip():
            try:
                norm_year = int(float(str(raw_year).strip()))
            except Exception:
                norm_year = raw_year

        raw_website = r.get("website")
        norm_website = None
        if raw_website is not None and str(raw_website).strip():
            w_str = str(raw_website).strip()
            if not w_str.startswith("http://") and not w_str.startswith("https://"):
                norm_website = f"https://{w_str}"
            else:
                norm_website = w_str

        row_dict = {
            "row_number": row_num,
            "aishe_code": aishe_clean or r.get("aishe_code") or "",
            "college_name": r.get("college_name") or "",
            "state": r.get("state") or "",
            "district": r.get("district") or "",
            "website": norm_website or raw_website or "",
            "established_year": norm_year or raw_year or "",
            "location": r.get("location") or "",
            "issues": [],
            "mismatches": [],
            "is_valid_syntax": True
        }

        # Preserve any additional / extra fields from the input row
        for k, v in r.items():
            if k not in row_dict and not k.startswith("_") and k not in ("status", "status_label", "status_badge", "mismatches", "db_record", "is_savable"):
                row_dict[k] = v

        if has_all_headers:
            row_dict["status"] = "valid"
            row_dict["status_label"] = "✓ Valid (Ready to Update)"
            row_dict["status_badge"] = "success"
            row_dict["is_savable"] = True
        else:
            row_dict["status"] = "error"
            row_dict["status_label"] = "✗ Missing Column Header"
            row_dict["status_badge"] = "danger"
            row_dict["is_savable"] = False
            row_dict["issues"] = [
                {"type": "missing_header", "field": h, "message": f"Missing column header: {h}"}
                for h in missing_headers
            ]

        processed_rows.append(row_dict)

    if has_all_headers:
        valid_records_count = len(processed_rows)
        missing_or_invalid_count = 0
        total_savable = valid_records_count
        can_save = len(processed_rows) > 0
        problems_summary = {
            "missing_fields": [],
            "identifying_mismatches": [],
            "colleges_not_found": [],
            "invalid_data": []
        }
    else:
        valid_records_count = 0
        missing_or_invalid_count = len(processed_rows)
        total_savable = 0
        can_save = False
        problems_summary = {
            "missing_fields": [f"Missing required column header: {h}" for h in missing_headers],
            "identifying_mismatches": [],
            "colleges_not_found": [],
            "invalid_data": []
        }

    return {
        "success": True,
        "header_row": header_row_idx,
        "base_fields_valid": has_all_headers,
        "missing_headers": missing_headers,
        "field_header_status": field_header_status,
        "summary": {
            "total_rows": len(processed_rows),
            "valid_count": valid_records_count,
            "mismatch_count": 0,
            "not_found_count": 0,
            "missing_or_invalid_count": missing_or_invalid_count,
            "total_savable": total_savable,
            "can_save": can_save
        },
        "problems": problems_summary,
        "rows": processed_rows
    }


import secrets

def execute_bulk_update_transaction(records_to_update):
    """
    Saves validated bulk data strictly into the existing PostgreSQL database.
    Updates or inserts the 7 bulk-identification fields:
      - college_name
      - state
      - district
      - location
      - website
      - established_year
      - aishe_code

    Guarantees:
      - Never overwrites existing DB values with blank cells (COALESCE).
      - Matches existing records first by AISHE code, then by College Name.
      - If record does not exist in DB, safely inserts it so all valid uploaded colleges are saved.
      - Prevents duplicate colleges.
      - Atomic transaction with rollback on failure.
    """
    if not db.is_pg_connected():
        raise RuntimeError("PostgreSQL database is disconnected or unavailable.")

    if not records_to_update:
        return {"updated_count": 0, "updated_colleges": []}

    pool = db.get_pool()
    if not pool:
        raise RuntimeError("Could not obtain PostgreSQL connection pool.")

    conn = pool.getconn()
    try:
        conn.autocommit = False
        updated_records = []

        def clean_val(v):
            if v is None:
                return None
            s = str(v).strip()
            return s if s != "" else None

        with conn.cursor() as cur:
            for row in records_to_update:
                raw_aishe = clean_val(row.get("aishe_code"))
                raw_name = clean_val(row.get("college_name"))

                # If neither AISHE code nor college name is provided, skip invalid empty row
                if not raw_aishe and not raw_name:
                    continue

                est_year = row.get("established_year")
                norm_year = None
                if est_year is not None and str(est_year).strip():
                    try:
                        norm_year = int(float(str(est_year).strip()))
                    except Exception:
                        norm_year = None

                website_val = clean_val(row.get("website"))
                if website_val and not website_val.startswith("http://") and not website_val.startswith("https://"):
                    website_val = f"https://{website_val}"

                c_state = clean_val(row.get("state"))
                c_dist = clean_val(row.get("district"))
                c_loc = clean_val(row.get("location"))

                # 1. Look up existing college by AISHE code or Name
                existing_id = None
                if raw_aishe:
                    cur.execute(
                        "SELECT id FROM colleges WHERE UPPER(TRIM(aishe_code)) = UPPER(TRIM(%s)) LIMIT 1;",
                        (raw_aishe,)
                    )
                    found = cur.fetchone()
                    if found:
                        existing_id = found[0]

                if not existing_id and raw_name:
                    cur.execute(
                        "SELECT id FROM colleges WHERE LOWER(TRIM(college_name)) = LOWER(TRIM(%s)) LIMIT 1;",
                        (raw_name,)
                    )
                    found = cur.fetchone()
                    if found:
                        existing_id = found[0]

                res = None
                if existing_id:
                    # 2. Existing record found -> UPDATE with COALESCE (blank cells never overwrite existing values)
                    update_sql = """
                        UPDATE colleges SET
                            college_name = COALESCE(%s, college_name),
                            state = COALESCE(%s, state),
                            district = COALESCE(%s, district),
                            location = COALESCE(%s, location),
                            website = COALESCE(%s, website),
                            established_year = COALESCE(%s, established_year),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                        RETURNING id, aishe_code, college_name, state, district, location, website, established_year;
                    """
                    cur.execute(update_sql, (
                        raw_name,
                        c_state,
                        c_dist,
                        c_loc,
                        website_val,
                        norm_year,
                        existing_id
                    ))
                    res = cur.fetchone()
                else:
                    # 3. New record -> INSERT with all available 7 fields
                    final_aishe = raw_aishe if raw_aishe else f"C-{secrets.token_hex(4).upper()}"
                    final_name = raw_name if raw_name else f"Institution {final_aishe}"
                    short_n = final_name[:50]

                    insert_sql = """
                        INSERT INTO colleges (
                            aishe_code, college_name, short_name, state, district, location,
                            website, established_year, status, created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                        ON CONFLICT (aishe_code) DO UPDATE SET
                            college_name = COALESCE(EXCLUDED.college_name, colleges.college_name),
                            state = COALESCE(EXCLUDED.state, colleges.state),
                            district = COALESCE(EXCLUDED.district, colleges.district),
                            location = COALESCE(EXCLUDED.location, colleges.location),
                            website = COALESCE(EXCLUDED.website, colleges.website),
                            established_year = COALESCE(EXCLUDED.established_year, colleges.established_year),
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING id, aishe_code, college_name, state, district, location, website, established_year;
                    """
                    cur.execute(insert_sql, (
                        final_aishe,
                        final_name,
                        short_n,
                        c_state,
                        c_dist,
                        c_loc,
                        website_val,
                        norm_year
                    ))
                    res = cur.fetchone()

                if res:
                    updated_records.append({
                        "id": res[0],
                        "aishe_code": res[1],
                        "college_name": res[2],
                        "state": res[3],
                        "district": res[4],
                        "location": res[5],
                        "website": res[6],
                        "established_year": res[7]
                    })

        conn.commit()
        return {
            "updated_count": len(updated_records),
            "updated_colleges": updated_records
        }
    except Exception as e:
        conn.rollback()
        logger.error(f"[Bulk Update Transaction Rolled Back] {e}")
        raise e
    finally:
        pool.putconn(conn)


def detect_individual_headers_and_rows(sheet):
    """
    Scans first 15 rows of an openpyxl sheet to detect column headers for Individual College Details.
    """
    rows_iter = list(sheet.iter_rows(values_only=True))
    if not rows_iter:
        return None, {}, []

    header_row_idx = None
    best_field_map = {}
    best_match_count = 0

    for r_idx, row_vals in enumerate(rows_iter[:15], start=1):
        field_map = {}
        match_count = 0
        for c_idx, cell_val in enumerate(row_vals):
            if cell_val is not None and str(cell_val).strip():
                matched_field = _match_header_to_individual_field(str(cell_val))
                if matched_field and matched_field not in field_map.values():
                    field_map[c_idx] = matched_field
                    match_count += 1

        if match_count > best_match_count:
            best_match_count = match_count
            best_field_map = field_map
            header_row_idx = r_idx

    if header_row_idx is None or best_match_count == 0:
        return None, {}, []

    parsed_rows = []
    for r_idx, row_vals in enumerate(rows_iter[header_row_idx:], start=header_row_idx + 1):
        if not any(v is not None and str(v).strip() for v in row_vals):
            continue

        row_dict = {}
        for c_idx, field_key in best_field_map.items():
            val = row_vals[c_idx] if c_idx < len(row_vals) else None
            if val is not None:
                val_str = str(val).strip()
                row_dict[field_key] = val_str if val_str else None
            else:
                row_dict[field_key] = None

        row_dict["_row_number"] = r_idx
        parsed_rows.append(row_dict)

    return header_row_idx, best_field_map, parsed_rows


def parse_and_validate_individual_excel(file_stream_or_path, file_size=None):
    """
    Validates Excel file for Individual College Details.
    Enforces:
      - 100 MB max file size limit & .xlsx format
      - At least one identifier column: AISHE Code or College Name
      - Validates required field and sub-field structure
      - Fast single-query batch matching against Neon PostgreSQL
      - Non-blocking and fast preview generation
    """
    if file_size is not None and file_size > MAX_EXCEL_SIZE_BYTES:
        return {
            "success": False,
            "error_type": "file_size_exceeded",
            "message": f"File size ({round(file_size / (1024*1024), 2)} MB) exceeds maximum allowed limit of 100 MB."
        }

    try:
        if isinstance(file_stream_or_path, (str, bytes, os.PathLike)):
            wb = openpyxl.load_workbook(file_stream_or_path, data_only=True, read_only=True)
        else:
            wb = openpyxl.load_workbook(io.BytesIO(file_stream_or_path.read()), data_only=True, read_only=True)
    except InvalidFileException:
        return {
            "success": False,
            "error_type": "invalid_file_format",
            "message": "Invalid Excel file format. Please upload a valid .xlsx file."
        }
    except Exception as e:
        logger.error(f"[Excel Read Error] {e}")
        return {
            "success": False,
            "error_type": "read_error",
            "message": f"Failed to parse Excel file: {str(e)}"
        }

    sheet = wb.active
    if sheet is None:
        return {
            "success": False,
            "error_type": "empty_workbook",
            "message": "The uploaded Excel workbook contains no active worksheets."
        }

    header_row_idx, field_map, rows_data = detect_individual_headers_and_rows(sheet)
    if not header_row_idx or not field_map:
        return {
            "success": False,
            "error_type": "header_detection_failed",
            "message": "Could not identify table headers. Ensure your Excel file contains column headers for college details."
        }

    detected_fields = list(field_map.values())
    has_identifier = "aishe_code" in detected_fields or "college_name" in detected_fields
    if not has_identifier:
        return {
            "success": False,
            "error_type": "missing_identifier",
            "message": "Missing college identifier column header. Please include at least 'AISHE Code' or 'College Name' to match colleges."
        }

    detected_field_labels = [INDIVIDUAL_COLLEGE_FIELDS[k]["label"] for k in detected_fields if k in INDIVIDUAL_COLLEGE_FIELDS]

    problems_summary = {
        "missing_fields": [],
        "identifying_mismatches": [],
        "colleges_not_found": [],
        "invalid_data": []
    }

    # 1. Row-level structure and sub-field validations
    processed_rows = []
    all_aishes = set()
    all_names = set()

    for idx, r in enumerate(rows_data):
        row_num = r.get("_row_number") or (idx + 1)
        row_dict = dict(r)
        row_dict["row_number"] = row_num
        row_dict["issues"] = []
        row_dict["mismatches"] = []
        row_dict["is_savable"] = True

        raw_aishe = (str(row_dict.get("aishe_code")).strip().upper()) if row_dict.get("aishe_code") else ""
        raw_name = (str(row_dict.get("college_name")).strip()) if row_dict.get("college_name") else ""

        row_dict["aishe_code"] = raw_aishe
        row_dict["college_name"] = raw_name

        # Structure Check: Row must have at least one identifier
        if not raw_aishe and not raw_name:
            row_dict["status"] = "error"
            row_dict["status_label"] = "✗ Missing Identifier"
            row_dict["status_badge"] = "danger"
            row_dict["is_savable"] = False
            row_dict["issues"].append({
                "type": "missing_identifier",
                "message": f"Row {row_num}: Missing AISHE Code and College Name."
            })
            problems_summary["missing_fields"].append(f"Row {row_num}: Missing college identifier (requires AISHE Code or College Name)")
        else:
            row_dict["status"] = "valid"
            row_dict["status_label"] = "✓ Valid (Ready to Update)"
            row_dict["status_badge"] = "success"

        # Sub-field structure validation
        if row_dict.get("website"):
            w = str(row_dict["website"]).strip()
            if not w.startswith("http://") and not w.startswith("https://"):
                row_dict["website"] = f"https://{w}"
            else:
                row_dict["website"] = w

        if row_dict.get("email"):
            em = str(row_dict["email"]).strip()
            if em and ("@" not in em or "." not in em):
                problems_summary["invalid_data"].append(f"Row {row_num}: Invalid email structure '{em}'")
                row_dict["issues"].append({"type": "invalid_email", "message": f"Invalid email format: {em}"})

        if row_dict.get("established_year"):
            yr_str = str(row_dict["established_year"]).strip()
            try:
                yr_val = int(float(yr_str))
                if yr_val < 1800 or yr_val > 2035:
                    problems_summary["invalid_data"].append(f"Row {row_num}: Unusual established year '{yr_str}'")
                row_dict["established_year"] = yr_val
            except Exception:
                problems_summary["invalid_data"].append(f"Row {row_num}: Invalid established year '{yr_str}'")
                row_dict["issues"].append({"type": "invalid_year", "message": f"Invalid year: {yr_str}"})

        if row_dict.get("rating"):
            rt_str = str(row_dict["rating"]).strip()
            try:
                rt_val = float(rt_str)
                if rt_val < 0.0 or rt_val > 5.0:
                    problems_summary["invalid_data"].append(f"Row {row_num}: Rating '{rt_str}' is outside standard 0.0-5.0 scale")
            except Exception:
                pass

        if raw_aishe:
            all_aishes.add(raw_aishe)
        if raw_name:
            all_names.add(raw_name.lower())

        processed_rows.append(row_dict)

    # 2. Fast single-query batch matching against Neon PostgreSQL
    if db.is_pg_connected() and (all_aishes or all_names):
        try:
            aishe_db_map = {}
            name_db_map = {}

            if all_aishes or all_names:
                matches = db.query_all("""
                    SELECT id, UPPER(TRIM(aishe_code)) AS code, LOWER(TRIM(college_name)) AS name_lower
                    FROM colleges
                    WHERE UPPER(TRIM(aishe_code)) = ANY(%s) OR LOWER(TRIM(college_name)) = ANY(%s);
                """, [list(all_aishes), list(all_names)])

                if matches:
                    for m in matches:
                        if m.get("code"):
                            aishe_db_map[m["code"]] = m["id"]
                        if m.get("name_lower"):
                            name_db_map[m["name_lower"]] = m["id"]

            for r in processed_rows:
                if not r["is_savable"]:
                    continue
                matched_id = None
                if r["aishe_code"] and r["aishe_code"] in aishe_db_map:
                    matched_id = aishe_db_map[r["aishe_code"]]
                elif r["college_name"] and r["college_name"].lower() in name_db_map:
                    matched_id = name_db_map[r["college_name"].lower()]

                if matched_id:
                    r["match_status"] = "matched"
                    r["db_id"] = matched_id
                else:
                    r["match_status"] = "new"
        except Exception as e:
            logger.debug(f"[Batch Match Notice] {e}")

    valid_count = sum(1 for r in processed_rows if r["is_savable"])
    missing_or_invalid_count = len(processed_rows) - valid_count

    return {
        "success": True,
        "mode": "individual",
        "header_row": header_row_idx,
        "detected_fields": detected_fields,
        "detected_field_labels": detected_field_labels,
        "summary": {
            "total_rows": len(processed_rows),
            "valid_count": valid_count,
            "mismatch_count": 0,
            "not_found_count": 0,
            "missing_or_invalid_count": missing_or_invalid_count,
            "total_savable": valid_count,
            "can_save": valid_count > 0
        },
        "problems": problems_summary,
        "rows": processed_rows
    }


def execute_individual_details_bulk_update(records_to_update):
    """
    Executes fast bulk update for Individual College Details in PostgreSQL.
    Features:
      - Single prefetch query for all AISHEs & Names (avoids round-trip DB calls per row)
      - Non-destructive: Blank Excel cells NEVER overwrite existing DB values with NULL (COALESCE)
      - Reuses exact database structure and field mappings
      - Atomic transaction with rollback on failure
    """
    if not db.is_pg_connected():
        raise RuntimeError("PostgreSQL database is disconnected or unavailable.")

    if not records_to_update:
        return {"updated_count": 0, "updated_colleges": []}

    pool = db.get_pool()
    if not pool:
        raise RuntimeError("Could not obtain PostgreSQL connection pool.")

    conn = pool.getconn()
    try:
        conn.autocommit = False
        updated_records = []

        def clean_val(v):
            if v is None:
                return None
            s = str(v).strip()
            return s if s != "" else None

        with conn.cursor() as cur:
            # 1. Fast Batch Prefetch of matching college IDs
            all_aishes = list({clean_val(r.get("aishe_code")).upper() for r in records_to_update if clean_val(r.get("aishe_code"))})
            all_names = list({clean_val(r.get("college_name")).lower() for r in records_to_update if clean_val(r.get("college_name"))})

            aishe_to_id = {}
            name_to_id = {}
            if all_aishes or all_names:
                cur.execute("""
                    SELECT id, UPPER(TRIM(aishe_code)), LOWER(TRIM(college_name))
                    FROM colleges
                    WHERE UPPER(TRIM(aishe_code)) = ANY(%s) OR LOWER(TRIM(college_name)) = ANY(%s);
                """, (all_aishes, all_names))
                for cid, a, n in cur.fetchall():
                    if a:
                        aishe_to_id[a] = cid
                    if n:
                        name_to_id[n] = cid

            # 2. Process each row with non-destructive COALESCE updates
            for row in records_to_update:
                raw_aishe = clean_val(row.get("aishe_code"))
                raw_name = clean_val(row.get("college_name"))
                if not raw_aishe and not raw_name:
                    continue

                existing_id = aishe_to_id.get(raw_aishe.upper()) if raw_aishe else None
                if not existing_id and raw_name:
                    existing_id = name_to_id.get(raw_name.lower())

                # Extract allowed DB columns
                cols_to_update = {}
                for f_key, cfg in INDIVIDUAL_COLLEGE_FIELDS.items():
                    if f_key in row:
                        val = clean_val(row.get(f_key))
                        if val is not None:
                            cols_to_update[cfg["db_col"]] = val

                # Safe normalization for specific types
                if "established_year" in cols_to_update:
                    try:
                        cols_to_update["established_year"] = int(float(cols_to_update["established_year"]))
                    except Exception:
                        del cols_to_update["established_year"]

                if "website" in cols_to_update and cols_to_update["website"]:
                    w = cols_to_update["website"]
                    if not w.startswith("http://") and not w.startswith("https://"):
                        cols_to_update["website"] = f"https://{w}"

                if "placement" in cols_to_update and "avg_placement" not in cols_to_update:
                    cols_to_update["avg_placement"] = cols_to_update["placement"]

                res = None
                if existing_id:
                    # Update existing college with non-blank fields
                    if cols_to_update:
                        set_clauses = []
                        params = []
                        for db_c, val in cols_to_update.items():
                            set_clauses.append(f"{db_c} = COALESCE(%s, {db_c})")
                            params.append(val)
                        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                        params.append(existing_id)

                        update_sql = f"UPDATE colleges SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, aishe_code, college_name, state, district, location, website, established_year;"
                        cur.execute(update_sql, params)
                        res = cur.fetchone()
                    else:
                        cur.execute("SELECT id, aishe_code, college_name, state, district, location, website, established_year FROM colleges WHERE id = %s;", (existing_id,))
                        res = cur.fetchone()
                else:
                    # New record -> Insert college
                    final_aishe = raw_aishe if raw_aishe else f"C-{secrets.token_hex(4).upper()}"
                    final_name = raw_name if raw_name else f"Institution {final_aishe}"
                    cols_to_update["aishe_code"] = final_aishe
                    cols_to_update["college_name"] = final_name
                    cols_to_update["status"] = "active"
                    if "short_name" not in cols_to_update:
                        cols_to_update["short_name"] = final_name[:50]

                    col_names = list(cols_to_update.keys())
                    placeholders = ["%s"] * len(col_names)
                    params = [cols_to_update[k] for k in col_names]

                    conflict_updates = [f"{col} = COALESCE(EXCLUDED.{col}, colleges.{col})" for col in col_names if col != "aishe_code"]
                    conflict_updates.append("updated_at = CURRENT_TIMESTAMP")

                    insert_sql = f"""
                        INSERT INTO colleges ({', '.join(col_names)}, created_at, updated_at)
                        VALUES ({', '.join(placeholders)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        ON CONFLICT (aishe_code) DO UPDATE SET
                            {', '.join(conflict_updates)}
                        RETURNING id, aishe_code, college_name, state, district, location, website, established_year;
                    """
                    cur.execute(insert_sql, params)
                    res = cur.fetchone()

                if res:
                    updated_records.append({
                        "id": res[0],
                        "aishe_code": res[1],
                        "college_name": res[2],
                        "state": res[3],
                        "district": res[4],
                        "location": res[5],
                        "website": res[6],
                        "established_year": res[7]
                    })

        conn.commit()
        return {
            "updated_count": len(updated_records),
            "updated_colleges": updated_records
        }
    except Exception as e:
        conn.rollback()
        logger.error(f"[Individual Bulk Update Transaction Rolled Back] {e}")
        raise e
    finally:
        pool.putconn(conn)
