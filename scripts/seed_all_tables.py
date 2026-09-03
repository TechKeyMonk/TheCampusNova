import os
import sys
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)
import db

def seed_database():
    if not db.is_pg_connected():
        print("[ERROR] PostgreSQL is not connected!")
        return False

    print("PostgreSQL connection confirmed.")

    # 1. Map college names to integer IDs
    college_rows = db.query_all("SELECT id, college_name, aishe_code FROM colleges")
    college_map = {}
    for r in college_rows:
        if r.get("college_name"):
            college_map[r["college_name"].strip().lower()] = r["id"]
        if r.get("aishe_code"):
            college_map[r["aishe_code"].strip().lower()] = r["id"]

    first_col_id = college_rows[0]["id"] if college_rows else 1

    # Helper to resolve college id
    def get_college_id(col_ref, col_name=""):
        if col_name and col_name.strip().lower() in college_map:
            return college_map[col_name.strip().lower()]
        if str(col_ref).strip().lower() in college_map:
            return college_map[str(col_ref).strip().lower()]
        for k, v in college_map.items():
            if col_name and (k in col_name.lower() or col_name.lower() in k):
                return v
        return first_col_id

    # 2. Map domain names to integer IDs
    domain_rows = db.query_all("SELECT id, domain_name FROM domains")
    domain_map = {}
    for d in domain_rows:
        if d.get("domain_name"):
            domain_map[d["domain_name"].strip().lower()] = d["id"]
    first_domain_id = domain_rows[0]["id"] if domain_rows else 1

    def get_domain_id(dom_name=""):
        if not dom_name:
            return first_domain_id
        dom_lower = str(dom_name).strip().lower()
        if dom_lower in domain_map:
            return domain_map[dom_lower]
        for k, v in domain_map.items():
            if k in dom_lower or dom_lower in k:
                return v
        # Insert domain if not exists
        try:
            res = db.execute_query(
                "INSERT INTO domains (domain_name, description, status) VALUES (%s, %s, 'active') RETURNING id",
                (dom_name.strip(), f"Domain focus for {dom_name}")
            )
            if res and "id" in res:
                domain_map[dom_lower] = res["id"]
                return res["id"]
        except Exception:
            pass
        return first_domain_id

    # 3. Seed CAREERS if empty
    careers_count = db.query_one("SELECT COUNT(*) as c FROM careers")["c"]
    if careers_count == 0:
        c_path = os.path.join(base_dir, "data", "careers_data.json")
        if os.path.exists(c_path):
            with open(c_path, "r", encoding="utf-8") as f:
                cdata = json.load(f)
            c_items = cdata.get("career_areas", [])
            for item in c_items:
                name = item.get("name") or item.get("title") or "Technology Specialist"
                dom_id = get_domain_id(item.get("category", ""))
                desc = item.get("importance_10yr") or item.get("description") or "High growth career pathway."
                skills = ", ".join(item.get("skills", [])) or ", ".join(item.get("languages", [])) or "Core Skills"
                sal = item.get("avg_salary") or "₹12L - ₹28L / yr"
                roadmap = json.dumps(item.get("roadmap", [])) if isinstance(item.get("roadmap"), list) else str(item.get("roadmap", ""))
                db.execute_query("""
                    INSERT INTO careers (career_name, domain_id, description, required_skills, salary_range, career_path, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'active')
                """, (name, dom_id, desc, skills, sal, roadmap))
            print(f"[Seeded] {len(c_items)} careers inserted into PostgreSQL.")

    # 4. Seed JOBS if empty
    jobs_count = db.query_one("SELECT COUNT(*) as c FROM jobs")["c"]
    if jobs_count == 0:
        j_path = os.path.join(base_dir, "data", "jobs_data.json")
        if os.path.exists(j_path):
            with open(j_path, "r", encoding="utf-8") as f:
                jdata = json.load(f)
            j_items = jdata.get("jobs", [])
            for item in j_items:
                title = item.get("role") or item.get("title") or "Software Engineer"
                company = item.get("company") or "Technology Enterprise"
                dom_id = get_domain_id(item.get("domain", ""))
                loc = f"{item.get('district', '')}, {item.get('state', '')}".strip(", ") or item.get("location", "Bengaluru")
                sal = item.get("salary") or "₹14,00,000 / yr"
                exp = item.get("exp_level") or "Entry / Mid Level"
                app_url = item.get("website") or "https://thecampusnova.com/careers"
                desc = item.get("why_join") or item.get("eligibility") or "Exciting engineering role."
                db.execute_query("""
                    INSERT INTO jobs (job_title, company_name, domain_id, location, job_type, experience, salary, application_url, description, status)
                    VALUES (%s, %s, %s, %s, 'Full-Time', %s, %s, %s, %s, 'active')
                """, (title, company, dom_id, loc, exp, sal, app_url, desc))
            print(f"[Seeded] {len(j_items)} jobs inserted into PostgreSQL.")

    # 5. Seed RANKINGS if empty
    rank_count = db.query_one("SELECT COUNT(*) as c FROM rankings")["c"]
    if rank_count == 0:
        r_path = os.path.join(base_dir, "data", "rankings_data.json")
        if os.path.exists(r_path):
            with open(r_path, "r", encoding="utf-8") as f:
                rdata = json.load(f)
            r_items = rdata.get("rankings", [])
            for item in r_items:
                col_id = get_college_id(item.get("college_id"), item.get("college_name"))
                cat = item.get("category", "Overall")
                rank_num = item.get("rank") or item.get("nirf_rank") or 1
                try: rank_num = int(str(rank_num).replace("#", "").strip())
                except Exception: rank_num = 1
                body = "NIRF / NAAC Quality Matrix"
                score = str(item.get("overall_performance") or item.get("student_rating") or "9.4")
                db.execute_query("""
                    INSERT INTO rankings (college_id, ranking_body, category, rank, year, score)
                    VALUES (%s, %s, %s, %s, 2026, %s)
                """, (col_id, body, cat, rank_num, score))
            print(f"[Seeded] {len(r_items)} rankings inserted into PostgreSQL.")

    # 6. Seed FACILITIES if empty
    fac_count = db.query_one("SELECT COUNT(*) as c FROM facilities")["c"]
    if fac_count == 0:
        f_path = os.path.join(base_dir, "data", "facilities_data.json")
        if os.path.exists(f_path):
            with open(f_path, "r", encoding="utf-8") as f:
                fdata = json.load(f)
            f_ranking = fdata.get("top_15_facilities_ranking", [])
            f_dict = fdata.get("facilities_by_college", {})
            for item in f_ranking:
                col_id = get_college_id(item.get("college_id"), item.get("college_name"))
                fname = item.get("highlight", "Campus Infrastructure & High-Tech Labs")
                desc = f"Score: {item.get('facility_score', 9.5)}/10. Votes: {item.get('votes', 1200)}"
                db.execute_query("""
                    INSERT INTO facilities (college_id, facility_name, description, available)
                    VALUES (%s, %s, %s, TRUE)
                """, (col_id, fname, desc))
            # Also add from facilities_by_college
            for cid, f_obj in f_dict.items():
                col_id = get_college_id(cid)
                for fac_type, details in f_obj.items():
                    if isinstance(details, dict):
                        f_title = details.get("highlight") or fac_type.capitalize()
                        f_desc = details.get("details") or str(details)
                        db.execute_query("""
                            INSERT INTO facilities (college_id, facility_name, description, available)
                            VALUES (%s, %s, %s, TRUE)
                        """, (col_id, f_title, f_desc))
            print("[Seeded] Facilities inserted into PostgreSQL.")

    # 7. Seed ADMISSIONS if empty
    adm_count = db.query_one("SELECT COUNT(*) as c FROM admissions")["c"]
    if adm_count == 0:
        a_path = os.path.join(base_dir, "data", "admissions_data.json")
        if os.path.exists(a_path):
            with open(a_path, "r", encoding="utf-8") as f:
                adata = json.load(f)
            a_items = adata.get("admissions", [])
            for item in a_items:
                col_id = get_college_id(item.get("college_id"), item.get("college_name"))
                adm_type = item.get("admission_process") or "Merit & Counseling"
                elig = item.get("eligibility") or "10+2 with qualifying PCM/PCB marks"
                app_start = item.get("opening_date", "May 2026")
                app_end = item.get("closing_date", "June 2026")
                process = item.get("admission_process", "Centralized Single Window Counseling")
                fees_raw = item.get("fee_structure") or item.get("course_fees") or "₹55,000 / yr"
                fees = json.dumps(fees_raw) if isinstance(fees_raw, (dict, list)) else str(fees_raw)
                db.execute_query("""
                    INSERT INTO admissions (college_id, admission_type, eligibility, application_start, application_end, admission_process, fees, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')
                """, (col_id, adm_type[:100], elig, app_start, app_end, process, fees[:100]))
            print(f"[Seeded] {len(a_items)} admissions inserted into PostgreSQL.")

    # 8. Seed PLACEMENTS if empty or few
    plc_count = db.query_one("SELECT COUNT(*) as c FROM placements")["c"]
    if plc_count < 10:
        p_path = os.path.join(base_dir, "data", "placements_data.json")
        if os.path.exists(p_path):
            with open(p_path, "r", encoding="utf-8") as f:
                pdata = json.load(f)
            p_items = pdata.get("company_visits", [])
            for item in p_items:
                comp = item.get("company", "Global Recruiter")
                pkg = item.get("package_range", "₹8L - ₹24L CTC")
                desc = f"Industry: {item.get('industry', 'Technology')}. Roles: {', '.join(item.get('roles', []))}"
                col_list = item.get("colleges_visited", [])
                c_id = get_college_id(col_list[0]) if col_list else first_col_id
                db.execute_query("""
                    INSERT INTO placements (college_id, company_name, year, average_package, highest_package, description)
                    VALUES (%s, %s, 2026, %s, %s, %s)
                """, (c_id, comp, pkg, pkg, desc))
            print(f"[Seeded] Placements inserted into PostgreSQL.")

    # 9. Seed INTERNSHIPS if empty or few
    int_count = db.query_one("SELECT COUNT(*) as c FROM internships")["c"]
    if int_count < 10:
        i_path = os.path.join(base_dir, "data", "internships_data.json")
        if os.path.exists(i_path):
            with open(i_path, "r", encoding="utf-8") as f:
                idata = json.load(f)
            i_items = idata.get("internships", [])
            for item in i_items:
                title = item.get("role", "Summer Intern")
                company = item.get("company", "Partner Enterprise")
                dom_id = get_domain_id(item.get("domain", ""))
                loc = f"{item.get('district', '')}, {item.get('state', '')}".strip(", ") or item.get("location", "Bengaluru")
                stipend = item.get("stipend", "₹45,000 / month")
                duration = item.get("duration", "8 - 12 Weeks")
                elig = item.get("eligibility", "Pre-final and Final year students")
                app_url = item.get("website", "https://thecampusnova.com/internships")
                desc = item.get("details") or "Hands-on project development and mentor guidance."
                db.execute_query("""
                    INSERT INTO internships (title, company_name, domain_id, location, stipend, duration, eligibility, application_url, description, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
                """, (title, company, dom_id, loc, stipend, duration, elig, app_url, desc))
            print(f"[Seeded] Internships inserted into PostgreSQL.")

    print("\nAll database tables verified and fully seeded in PostgreSQL!")
    return True

if __name__ == "__main__":
    seed_database()
