import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db

COURSE_FEES_MAP = {
    # Engineering, IT & Computer Applications
    "prog-be-cse": "₹1.25L - ₹3.80L / yr",
    "prog-btech-cse": "₹1.50L - ₹4.50L / yr",
    "prog-bsc-cs": "₹45,000 - ₹1.20L / yr",
    "prog-bca": "₹55,000 - ₹1.50L / yr",
    "prog-mtech-cse": "₹90,000 - ₹2.20L / yr",
    "prog-mca": "₹75,000 - ₹1.80L / yr",
    "prog-btech-it": "₹1.40L - ₹4.20L / yr",
    "prog-bsc-it": "₹40,000 - ₹1.10L / yr",
    "prog-btech-eee": "₹1.20L - ₹3.60L / yr",
    "prog-btech-mech": "₹1.10L - ₹3.50L / yr",
    "prog-btech-civil": "₹1.00L - ₹3.20L / yr",
    "prog-btech-aiml": "₹1.60L - ₹4.80L / yr",
    "prog-mtech-ai": "₹1.00L - ₹2.50L / yr",
    "prog-btech-ds": "₹1.50L - ₹4.20L / yr",
    "prog-btech-cyber": "₹1.50L - ₹4.40L / yr",
    "prog-btech-cloud": "₹1.45L - ₹4.20L / yr",
    "prog-btech-iot": "₹1.35L - ₹3.90L / yr",
    "prog-bca-fullstack": "₹65,000 - ₹1.80L / yr",
    "prog-btech-robotics": "₹1.50L - ₹4.50L / yr",

    # Commerce, Management & Finance
    "prog-bcom-gen": "₹30,000 - ₹95,000 / yr",
    "prog-bba-gen": "₹65,000 - ₹2.20L / yr",
    "prog-ca-icai": "₹35,000 - ₹75,000 (Registration & Training Fees)",
    "prog-cs-icsi": "₹25,000 - ₹60,000 (Registration & Training Fees)",
    "prog-bba-fintech": "₹90,000 - ₹2.80L / yr",
    "prog-bba-ba": "₹85,000 - ₹2.60L / yr",
    "prog-bba-dm": "₹75,000 - ₹2.40L / yr",
    "prog-bcom-ecom": "₹45,000 - ₹1.35L / yr",
    "prog-bba-scm": "₹80,000 - ₹2.50L / yr",
    "prog-bcom-risk": "₹60,000 - ₹1.80L / yr",

    # Medical, Allied Health & Life Sciences
    "prog-mbbs": "₹1.20L - ₹16.5L / yr",
    "prog-bds": "₹1.50L - ₹6.50L / yr",
    "prog-bams": "₹80,000 - ₹3.50L / yr",
    "prog-bhms": "₹60,000 - ₹2.80L / yr",
    "prog-bpharm": "₹75,000 - ₹2.20L / yr",
    "prog-nursing": "₹45,000 - ₹1.60L / yr",
    "prog-bpt": "₹55,000 - ₹1.80L / yr",
    "prog-bmlt": "₹40,000 - ₹1.25L / yr",
    "prog-biotech": "₹85,000 - ₹2.60L / yr",
    "prog-bioinfo": "₹70,000 - ₹2.20L / yr",

    # Design, Media & Creative Arts
    "prog-bfa": "₹40,000 - ₹1.40L / yr",
    "prog-fashion": "₹1.20L - ₹3.80L / yr",
    "prog-uiux": "₹1.40L - ₹4.20L / yr",
    "prog-product": "₹1.30L - ₹3.90L / yr",
    "prog-graphic": "₹95,000 - ₹3.00L / yr",
    "prog-gamedev": "₹1.10L - ₹3.50L / yr",
    "prog-vfx": "₹90,000 - ₹2.80L / yr",
    "prog-arvr": "₹1.25L - ₹3.80L / yr",

    # Arts, Humanities & Social Sciences
    "prog-ba-lit": "₹20,000 - ₹65,000 / yr",
    "prog-ba-history": "₹18,000 - ₹55,000 / yr",
    "prog-ba-polsci": "₹22,000 - ₹70,000 / yr",
    "prog-ba-phil": "₹18,000 - ₹50,000 / yr",
    "prog-psychology": "₹35,000 - ₹1.20L / yr",
    "prog-bjmc": "₹55,000 - ₹1.80L / yr",
    "prog-behav-econ": "₹45,000 - ₹1.50L / yr",
    "prog-dig-hum": "₹35,000 - ₹1.10L / yr",

    # Law & Public Policy
    "prog-llb3": "₹40,000 - ₹1.50L / yr",
    "prog-ballb": "₹95,000 - ₹3.20L / yr",
    "prog-bballb": "₹1.10L - ₹3.50L / yr",
    "prog-llm-corp": "₹65,000 - ₹2.00L / yr",
    "prog-cyberlaw": "₹50,000 - ₹1.60L / yr",
    "prog-iplaw": "₹55,000 - ₹1.75L / yr",
    "prog-mpp": "₹80,000 - ₹2.50L / yr",

    # Online, Distance & Skill-Based Learning
    "prog-onl-bca": "₹35,000 - ₹75,000 / yr",
    "prog-cloud-cert": "₹25,000 - ₹65,000 (Complete Track)",
    "prog-code-bootcamp": "₹45,000 - ₹1.20L (Placement-Linked Track)",
    "prog-data-cert": "₹30,000 - ₹85,000 (Complete Track)",
    "prog-exec-mgmt": "₹1.20L - ₹3.50L (Executive Track)",
    "prog-voc-ai-iot": "₹28,000 - ₹65,000 / yr",
    "prog-pm-accelerator": "₹35,000 - ₹95,000 (Accelerator Track)"
}

def compute_program_fee(name, degree_type, pid=None):
    if pid and pid in COURSE_FEES_MAP:
        return COURSE_FEES_MAP[pid]
    n = (name or "").lower()
    d = (degree_type or "").lower()
    if "mbbs" in n:
        return "₹1.20L - ₹16.5L / yr"
    if "bds" in n:
        return "₹1.50L - ₹6.50L / yr"
    if "pharm" in n:
        return "₹75,000 - ₹2.20L / yr"
    if "nursing" in n:
        return "₹45,000 - ₹1.60L / yr"
    if "physio" in n or "bpt" in n:
        return "₹55,000 - ₹1.80L / yr"
    if "b.tech" in n or "b.e." in n or "engineering" in n or "technology" in n:
        if "ai" in n or "robot" in n or "cyber" in n or "data" in n or "cloud" in n:
            return "₹1.50L - ₹4.50L / yr"
        return "₹1.25L - ₹3.80L / yr"
    if "m.tech" in n or "m.e." in n:
        return "₹90,000 - ₹2.20L / yr"
    if "mca" in n:
        return "₹75,000 - ₹1.80L / yr"
    if "bca" in n:
        return "₹55,000 - ₹1.50L / yr"
    if "b.sc" in n or "bsc" in n:
        return "₹45,000 - ₹1.20L / yr"
    if "b.com" in n or "bcom" in n:
        return "₹30,000 - ₹95,000 / yr"
    if "bba" in n:
        return "₹65,000 - ₹2.20L / yr"
    if "mba" in n:
        return "₹1.80L - ₹7.50L / yr"
    if "ca" in n or "chartered" in n:
        return "₹35,000 - ₹75,000 (Registration & Training Fees)"
    if "law" in n or "ll.b" in n or "llb" in n:
        return "₹90,000 - ₹3.20L / yr"
    if "design" in n or "b.des" in n or "ui/ux" in n or "fashion" in n:
        return "₹1.20L - ₹4.20L / yr"
    if "b.a." in n or "arts" in n:
        return "₹20,000 - ₹65,000 / yr"
    if "postgraduate" in d or "pg" in d:
        return "₹90,000 - ₹2.40L / yr"
    if "undergraduate" in d or "ug" in d:
        return "₹1.10L - ₹3.20L / yr"
    return "₹85,000 - ₹2.80L / yr"

for filepath in ["courses_data.json", os.path.join("data", "courses_data.json")]:
    if not os.path.exists(filepath):
        continue
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    cnt = 0
    for cat in data.get("categories", []):
        for grp in cat.get("groups", []):
            for sub in grp.get("subfields", []):
                for p in sub.get("programs", []):
                    pid = p.get("id")
                    fee = compute_program_fee(p.get("name"), p.get("degreeType"), pid)
                    p["annualTuitionFees"] = fee
                    cnt += 1

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[PASS] Updated {cnt} programs in {filepath}")

# 2. Update PostgreSQL database
if db.is_pg_connected():
    try:
        db.execute_query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS annual_tuition_fees VARCHAR(150)")
        for pid, fee in COURSE_FEES_MAP.items():
            db.execute_query(
                "UPDATE courses SET annual_tuition_fees = %s WHERE course_code = %s",
                (fee, pid)
            )
        db.execute_query("UPDATE courses SET annual_tuition_fees = %s WHERE annual_tuition_fees IS NULL AND degree_type LIKE %s", ("₹1.25L - ₹3.80L / yr", "%Undergraduate%"))
        db.execute_query("UPDATE courses SET annual_tuition_fees = %s WHERE annual_tuition_fees IS NULL AND degree_type LIKE %s", ("₹90,000 - ₹2.40L / yr", "%Postgraduate%"))
        db.execute_query("UPDATE courses SET annual_tuition_fees = %s WHERE annual_tuition_fees IS NULL", ("₹75,000 - ₹2.50L / yr",))
        print("[PASS] Successfully updated courses table in PostgreSQL")
    except Exception as e:
        print(f"[FAIL] Error updating PostgreSQL: {e}")
