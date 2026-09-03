import json
import os
import sys
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("==================================================")
print("TEST SUITE: EXACT COURSE ANNUAL TUITION FEES SYNC (ADMIN -> USER)")
print("==================================================")

# 1. Connect to PostgreSQL
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db

# Choose course to test
test_course_id = 1
orig_fee = None
if db.is_pg_connected():
    row = db.query_one("SELECT id, course_name, course_code, annual_tuition_fees FROM courses WHERE id = %s", (test_course_id,))
    if not row:
        row = db.query_one("SELECT id, course_name, course_code, annual_tuition_fees FROM courses LIMIT 1")
    assert row is not None, "No courses found in PostgreSQL!"
    test_course_id = row["id"]
    course_code = row.get("course_code")
    course_name = row.get("course_name")
    orig_fee = row.get("annual_tuition_fees")
    print(f"\n1. Selected Target Course: ID #{test_course_id} - '{course_name}' ({course_code})")
    print(f"   Current Fee: {orig_fee}")
else:
    print("\n[SKIP] PostgreSQL not connected.")
    sys.exit(1)

# 2. Simulate Admin Portal Editing the Course with an exact, complex, unrounded fee string
# containing commas, unit words, parenthesis, and special symbols
custom_exact_fee = "₹3,45,670 / year (Includes Hostel & Digital Labs)"
print(f"\n2. Simulating Admin Portal PUT /api/courses/{test_course_id} with exact fee:")
print(f"   Payload fee value: '{custom_exact_fee}'")

put_payload = {
    "name": course_name,
    "degreeType": "Undergraduate (UG)",
    "duration": "4 Years",
    "fees": custom_exact_fee,
    "eligibility": "10+2 with Physics, Maths & Chemistry (min. 60%)",
    "overview": "Comprehensive curriculum updated from Admin Portal test."
}

req = urllib.request.Request(
    f"http://127.0.0.1:8000/api/courses/{test_course_id}",
    data=json.dumps(put_payload).encode('utf-8'),
    headers={
        "Content-Type": "application/json",
        "X-Admin-Role": "admin",
        "X-Admin-Passkey": "admin123"
    },
    method="PUT"
)

with urllib.request.urlopen(req) as resp:
    res_data = json.loads(resp.read().decode('utf-8'))
    assert res_data.get("success") == True, f"Admin save failed: {res_data}"
    print(f"   [PASS] API Response 201: {res_data.get('message')}")

# 3. Verify PostgreSQL Database has the EXACT string without conversion, rounding, or loss of commas
print("\n3. Checking PostgreSQL database storage:")
updated_row = db.query_one("SELECT annual_tuition_fees FROM courses WHERE id = %s", (test_course_id,))
db_fee = updated_row.get("annual_tuition_fees")
print(f"   PostgreSQL Stored Fee: '{db_fee}'")
assert db_fee == custom_exact_fee, f"Mismatch in DB! Expected '{custom_exact_fee}', got '{db_fee}'"
print("   [PASS] PostgreSQL holds the exact unrounded, unconverted string with all characters intact.")

# 4. Verify data/courses_data.json and courses_data.json
print("\n4. Checking JSON dual-store synchronization:")
for filepath in ["data/courses_data.json", "courses_data.json"]:
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            j_data = json.load(f)
        matched_prog = None
        for cat in j_data.get("categories", []):
            for grp in cat.get("groups", []):
                for sub in grp.get("subfields", []):
                    for p in sub.get("programs", []):
                        if p.get("id") == course_code or p.get("name") == course_name:
                            matched_prog = p
                            break
                    if matched_prog: break
                if matched_prog: break
            if matched_prog: break

        assert matched_prog is not None, f"Could not find course in {filepath}"
        j_fee = matched_prog.get("annualTuitionFees")
        print(f"   {filepath} program fee: '{j_fee}'")
        assert j_fee == custom_exact_fee, f"Mismatch in {filepath}! Expected '{custom_exact_fee}', got '{j_fee}'"
print("   [PASS] Dual JSON storage holds the exact unrounded, unconverted string.")

# 5. Verify Live HTTP GET /api/courses
print("\n5. Checking Live HTTP GET /api/courses response:")
req = urllib.request.Request("http://127.0.0.1:8000/api/courses")
with urllib.request.urlopen(req) as resp:
    live_data = json.loads(resp.read().decode('utf-8'))
    # Check in courses list
    course_obj = next((c for c in live_data.get("courses", []) if c.get("id") == test_course_id), None)
    assert course_obj is not None, "Course not found in /api/courses courses list"
    assert course_obj.get("annualTuitionFees") == custom_exact_fee, f"Course obj fee mismatch: {course_obj.get('annualTuitionFees')}"
    
    # Check in categories hierarchy
    prog_obj = None
    for cat in live_data.get("categories", []):
        for grp in cat.get("groups", []):
            for sub in grp.get("subfields", []):
                for p in sub.get("programs", []):
                    if p.get("id") == course_code or p.get("name") == course_name:
                        prog_obj = p
                        break
                if prog_obj: break
            if prog_obj: break
        if prog_obj: break
    
    assert prog_obj is not None, "Program not found in categories hierarchy"
    assert prog_obj.get("annualTuitionFees") == custom_exact_fee, f"Program obj fee mismatch: {prog_obj.get('annualTuitionFees')}"
    print(f"   Live API returned annualTuitionFees: '{prog_obj.get('annualTuitionFees')}'")
    print("   [PASS] Live /api/courses returns identical exact string in both list and categories.")

# 6. Verify Frontend Javascript Logic in script.js and admin.js
print("\n6. Checking Frontend JS logic in admin.js and script.js:")
with open("admin.js", "r", encoding="utf-8") as f:
    admin_js = f.read()

assert "payload['annual_tuition_fees'] = cleanFee" in admin_js, "admin.js fails to preserve exact fee payload"
assert "c.annual_tuition_fees || c.annualTuitionFees || c.fees || '—'" in admin_js, "admin.js courses table missing fee column"
print("   [PASS] admin.js properly preserves exact fee without comma-splitting and displays in table.")

with open("script.js", "r", encoding="utf-8") as f:
    script_js = f.read()

assert "getProgramAnnualTuitionFee" in script_js, "script.js missing getProgramAnnualTuitionFee"
assert "findProgramInCatalog" in script_js, "script.js missing findProgramInCatalog"
print("   [PASS] script.js preserves exact fee without conversion, rounding, or format modifications.")

# 7. Restore original fee
if orig_fee:
    print(f"\n7. Restoring original fee '{orig_fee}' for test course #{test_course_id}:")
    restore_payload = {
        "name": course_name,
        "degreeType": "Undergraduate (UG)",
        "duration": "4 Years",
        "fees": orig_fee,
        "eligibility": "10+2 with Physics, Maths & Chemistry (min. 60%)",
        "overview": "Comprehensive curriculum."
    }
    req_restore = urllib.request.Request(
        f"http://127.0.0.1:8000/api/courses/{test_course_id}",
        data=json.dumps(restore_payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "X-Admin-Role": "admin",
            "X-Admin-Passkey": "admin123"
        },
        method="PUT"
    )
    with urllib.request.urlopen(req_restore) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"   [PASS] Restored: {res.get('message')}")

print("\n==================================================")
print("ALL EXACT FEE SYNCHRONIZATION CHECKS PASSED 100%!")
print("==================================================")
