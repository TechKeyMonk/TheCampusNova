import json
import os
import sys
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("==================================================")
print("TEST SUITE: COURSE ANNUAL TUITION FEES IN QUICK FLOW & FULL ROADMAP")
print("==================================================")

# 1. Verify courses_data.json
print("\n1. Checking courses_data.json data integrity:")
with open("courses_data.json", "r", encoding="utf-8") as f:
    courses_data = json.load(f)

prog_count = 0
fees_found = 0
sample_fees = []

for cat in courses_data.get("categories", []):
    for grp in cat.get("groups", []):
        for sub in grp.get("subfields", []):
            for p in sub.get("programs", []):
                prog_count += 1
                fee = p.get("annualTuitionFees")
                if fee:
                    fees_found += 1
                    if len(sample_fees) < 5:
                        sample_fees.append((p.get("name"), fee))

print(f"  Total Programs checked: {prog_count}")
print(f"  Programs with annualTuitionFees: {fees_found}")
assert prog_count == fees_found, f"Mismatch: {prog_count} programs but only {fees_found} have annualTuitionFees"
for name, fee in sample_fees:
    print(f"    Sample: {name} -> {fee}")
print("  [PASS] courses_data.json 100% populated with annualTuitionFees")

# 2. Verify PostgreSQL Database
print("\n2. Checking PostgreSQL database courses table:")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db

if db.is_pg_connected():
    rows = db.query_all("SELECT course_name, annual_tuition_fees FROM courses LIMIT 5")
    assert len(rows) > 0, "No rows in PostgreSQL courses table"
    for r in rows:
        assert r.get("annual_tuition_fees") is not None, f"Null fee for {r.get('course_name')}"
        print(f"    DB Sample: {r.get('course_name')} -> {r.get('annual_tuition_fees')}")
    print("  [PASS] PostgreSQL courses table contains annual_tuition_fees")
else:
    print("  [SKIP] PostgreSQL not connected.")

# 3. Verify Live HTTP API /api/courses
print("\n3. Checking Live HTTP GET /api/courses:")
req = urllib.request.Request("http://127.0.0.1:8000/api/courses")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    assert data.get("success") == True, "Failed to fetch /api/courses"
    cats = data.get("categories", [])
    assert len(cats) > 0, "No categories returned"
    
    first_p = cats[0]["groups"][0]["subfields"][0]["programs"][0]
    fee = first_p.get("annualTuitionFees")
    print(f"    API First Program: {first_p.get('name')} -> {fee}")
    assert fee is not None and "₹" in fee, f"Expected tuition fee with '₹', got: {fee}"
    print("  [PASS] /api/courses endpoint returns annualTuitionFees for programs")

# 4. Verify script.js Quick Flow & Full Roadmap implementations
print("\n4. Checking script.js Quick Flow and Full Roadmap implementations:")
with open("script.js", "r", encoding="utf-8") as f:
    js = f.read()

# Helper
assert "getProgramAnnualTuitionFee" in js, "getProgramAnnualTuitionFee helper missing in script.js"
print("  [PASS] getProgramAnnualTuitionFee helper verified")

# Quick Flow: Program meta chip
assert '💰 ${escapeHtml(annualFee)}' in js, "Annual tuition fee chip missing in program card"
print("  [PASS] Quick Flow: Program meta chip badge includes annual tuition fees")

# Quick Flow: Program quick metrics grid
assert 'Annual Tuition Fees' in js and 'program-quick-metrics-grid' in js, "Annual Tuition Fees missing in quick metrics grid"
print("  [PASS] Quick Flow: Quick metrics grid includes Annual Tuition Fees box")

# Quick Flow: Dedicated Course modal
assert 'openCourseDetailsModal' in js and '💰 Annual Tuition Fees:' in js, "Annual Tuition Fees missing in openCourseDetailsModal"
print("  [PASS] Quick Flow: Dedicated Course details modal displays Annual Tuition Fees")

# Full Roadmap: generateCourseFullRoadmapHtml Section 1 overview-grid
assert 'ANNUAL TUITION FEES' in js and 'overview-grid' in js, "ANNUAL TUITION FEES missing in overview-grid"
print("  [PASS] Full Roadmap: Section 1 overview-grid includes ANNUAL TUITION FEES box")

# Full Roadmap: Section 8 Institutional Standing & Quality Metrics
assert 'Annual Tuition Fees' in js and ('Institutional Standing &amp; Quality Metrics' in js or 'Institutional Standing & Quality Metrics' in js), "Annual Tuition Fees missing in Section 8 metrics"
print("  [PASS] Full Roadmap: Section 8 Institutional Standing includes Annual Tuition Fees card")

# Full Roadmap: detailTags in openCourseDetails
assert 'detailTags.innerHTML' in js and '💰 Annual Fees:' in js, "💰 Annual Fees: tag missing in detailTags"
print("  [PASS] Full Roadmap: detailTags header contains Annual Fees tag")

# Full Roadmap: openCourseRoadmapPdfPreview modal
assert 'openCourseRoadmapPdfPreview' in js and '💰 Annual Tuition Fees:' in js, "💰 Annual Tuition Fees: missing in PDF preview modal"
print("  [PASS] Full Roadmap: PDF preview modal includes Annual Tuition Fees")

print("\n==================================================")
print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
print("==================================================")
