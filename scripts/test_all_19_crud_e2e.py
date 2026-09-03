import os
import sys
import json
import requests

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)
import db
db.fetch_one = db.query_one
db.fetch_all = db.query_all

BASE_URL = "http://127.0.0.1:8000"
ADMIN_HEADERS = {
    "Content-Type": "application/json",
    "X-Admin-Role": "admin",
    "X-Admin-Passkey": "admin123"
}

def run_tests():
    print("========================================================================")
    print("STARTING COMPLETE 19-MODULE END-TO-END CRUD & POSTGRESQL INTEGRATION TEST")
    print("========================================================================")
    
    if not db.is_pg_connected():
        print("[ERROR] PostgreSQL is not connected via db.py!")
        sys.exit(1)
        
    results = {}

    def report(module, step, ok, details=""):
        status = "PASS" if ok else "FAIL"
        safe_details = str(details).replace('₹', 'Rs.').replace('★', '*').replace('☆', '_')
        print(f"[{status}] {module:25} | {step:20} | {safe_details}")
        if module not in results:
            results[module] = []
        results[module].append((step, ok, safe_details))

    # ---------------------------------------------------------
    # 1. COURSES
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/courses", headers=ADMIN_HEADERS, json={
            "course_name": "Test Robotics Engineering 2026",
            "stream": "Engineering",
            "duration": "4 Years",
            "annual_tuition_fees": "Rs. 2,50,000",
            "description": "Comprehensive robotics program.",
            "colleges": ["IIT Madras"]
        })
        c_id = res.json().get("id") or res.json().get("course", {}).get("id")
        row = db.fetch_one("SELECT * FROM courses WHERE course_name = %s", ("Test Robotics Engineering 2026",))
        report("1. Courses", "POST -> DB Verify", row is not None, f"ID: {row['id'] if row else 'None'}")
        
        target_id = row['id'] if row else c_id
        res = requests.put(f"{BASE_URL}/api/courses/{target_id}", headers=ADMIN_HEADERS, json={
            "course_name": "Test Robotics Engineering 2026 UPDATED",
            "annual_tuition_fees": "Rs. 2,75,000"
        })
        row_up = db.fetch_one("SELECT annual_tuition_fees FROM courses WHERE id = %s", (target_id,))
        report("1. Courses", "PUT -> DB Verify", row_up and row_up['annual_tuition_fees'] == "Rs. 2,75,000")
        
        res = requests.delete(f"{BASE_URL}/api/courses/{target_id}", headers=ADMIN_HEADERS)
        report("1. Courses", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM courses WHERE id = %s", (target_id,)) is None)
    except Exception as e:
        report("1. Courses", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 2. COLLEGES
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/colleges", headers=ADMIN_HEADERS, json={
            "name": "Test Autonomous Institute of Tech",
            "college_name": "Test Autonomous Institute of Tech",
            "aishe": "C-99999",
            "aishe_code": "C-99999",
            "state": "Tamil Nadu",
            "district": "Coimbatore",
            "fees": "Rs. 1,80,000 / yr"
        })
        col = db.fetch_one("SELECT * FROM colleges WHERE aishe_code = 'C-99999'")
        report("2. Colleges", "POST -> DB Verify", col is not None, f"Col ID: {col['id'] if col else 'None'}")
        
        col_db_id = col['id'] if col else None
        if col_db_id:
            res = requests.put(f"{BASE_URL}/api/colleges/{col_db_id}", headers=ADMIN_HEADERS, json={
                "fees": "Rs. 2,10,000 / yr",
                "placement": "Median CTC: Rs. 16 LPA"
            })
            col_up = db.fetch_one("SELECT fees FROM colleges WHERE id = %s", (col_db_id,))
            report("2. Colleges", "PUT -> DB Verify", col_up and col_up['fees'] == "Rs. 2,10,000 / yr")
            
            res = requests.delete(f"{BASE_URL}/api/colleges/{col_db_id}", headers=ADMIN_HEADERS)
            col_del = db.fetch_one("SELECT status FROM colleges WHERE id = %s", (col_db_id,))
            report("2. Colleges", "DELETE -> DB Verify", col_del and col_del['status'] == 'archived')
            db.execute_query("DELETE FROM colleges WHERE aishe_code = 'C-99999'")
    except Exception as e:
        report("2. Colleges", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 3. DOMAINS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/domains", headers=ADMIN_HEADERS, json={
            "domain_name": "Test Quantum Machine Learning",
            "stream": "Engineering",
            "career_scope": "Rs. 18 LPA - Rs. 45 LPA",
            "skills": ["Qiskit", "PyTorch", "Linear Algebra"],
            "description": "Cutting edge quantum AI engineering track."
        })
        d_row = db.fetch_one("SELECT * FROM domains WHERE domain_name = 'Test Quantum Machine Learning'")
        report("3. Domains", "POST -> DB Verify", d_row is not None, f"ID: {d_row['id'] if d_row else 'None'}")
        
        if d_row:
            d_id = d_row['id']
            res = requests.put(f"{BASE_URL}/api/domains/{d_id}", headers=ADMIN_HEADERS, json={
                "career_scope": "Rs. 22 LPA - Rs. 50 LPA"
            })
            d_up = db.fetch_one("SELECT career_scope FROM domains WHERE id = %s", (d_id,))
            report("3. Domains", "PUT -> DB Verify", d_up and d_up['career_scope'] == "Rs. 22 LPA - Rs. 50 LPA")
            
            res = requests.delete(f"{BASE_URL}/api/domains/{d_id}", headers=ADMIN_HEADERS)
            report("3. Domains", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM domains WHERE id = %s", (d_id,)) is None)
    except Exception as e:
        report("3. Domains", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 4. EXAMS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/exams", headers=ADMIN_HEADERS, json={
            "exam_name": "Test National Tech Aptitude 2026",
            "name": "Test National Tech Aptitude 2026",
            "stream": "Engineering",
            "conducting_body": "National Testing Agency",
            "exam_date": "2026-11-20",
            "status": "active"
        })
        ex_row = db.fetch_one("SELECT * FROM exams WHERE exam_name = 'Test National Tech Aptitude 2026'")
        report("4. Exams", "POST -> DB Verify", ex_row is not None, f"ID: {ex_row['id'] if ex_row else 'None'}")
        
        if ex_row:
            ex_id = ex_row['id']
            res = requests.put(f"{BASE_URL}/api/exams/{ex_id}", headers=ADMIN_HEADERS, json={
                "status": "active",
                "exam_date": "2026-11-25"
            })
            ex_up = db.fetch_one("SELECT status, exam_date FROM exams WHERE id = %s", (ex_id,))
            report("4. Exams", "PUT -> DB Verify", ex_up and ex_up['status'] == "active" and str(ex_up['exam_date']) == "2026-11-25")
            
            res = requests.delete(f"{BASE_URL}/api/exams/{ex_id}", headers=ADMIN_HEADERS)
            report("4. Exams", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM exams WHERE id = %s", (ex_id,)) is None)
    except Exception as e:
        report("4. Exams", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 5. STUDY MATERIALS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/study-materials", headers=ADMIN_HEADERS, json={
            "title": "Test Deep Learning Architecture Guide 2026",
            "subject": "Artificial Intelligence",
            "stream": "Engineering",
            "resource_type": "PDF Guide",
            "resource_format": "pdf",
            "status": "approved",
            "description": "Comprehensive deep learning study material."
        })
        mat_id = res.json().get("id") or res.json().get("material", {}).get("id")
        sm_row = db.fetch_one("SELECT * FROM study_materials WHERE title = 'Test Deep Learning Architecture Guide 2026'")
        report("5. Study Materials", "POST -> DB Verify", sm_row is not None, f"ID: {sm_row['id'] if sm_row else 'None'}")
        
        target_sm_id = sm_row['id'] if sm_row else mat_id
        if target_sm_id:
            res = requests.put(f"{BASE_URL}/api/study-materials/{target_sm_id}", headers=ADMIN_HEADERS, json={
                "title": "Test Deep Learning Architecture Guide 2026 (Updated)",
                "subject": "Advanced AI & Transformers",
                "status": "approved"
            })
            sm_up = db.fetch_one("SELECT subject FROM study_materials WHERE id = %s", (target_sm_id,))
            report("5. Study Materials", "PUT -> DB Verify", sm_up and sm_up['subject'] == "Advanced AI & Transformers")
            
            res = requests.delete(f"{BASE_URL}/api/study-materials/{target_sm_id}", headers=ADMIN_HEADERS)
            report("5. Study Materials", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM study_materials WHERE id = %s", (target_sm_id,)) is None)
    except Exception as e:
        report("5. Study Materials", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 6. REVIEWS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/reviews", headers=ADMIN_HEADERS, json={
            "author": "Test Student Reviewer",
            "statement": "Outstanding campus facilities and peer group.",
            "context": "Ramakrishna Mission",
            "rating": "*****",
            "status": "approved"
        })
        rev_row = db.fetch_one("SELECT * FROM reviews WHERE author_name = 'Test Student Reviewer'")
        report("6. Reviews", "POST -> DB Verify", rev_row is not None, f"ID: {rev_row['id'] if rev_row else 'None'}")
        
        if rev_row:
            rev_id = rev_row['id']
            res = requests.put(f"{BASE_URL}/api/reviews/{rev_id}", headers=ADMIN_HEADERS, json={
                "rating": "****_",
                "status": "approved"
            })
            rev_up = db.fetch_one("SELECT rating FROM reviews WHERE id = %s", (rev_id,))
            report("6. Reviews", "PUT -> DB Verify", rev_up and rev_up['rating'] == "****_")
            
            res = requests.delete(f"{BASE_URL}/api/reviews/{rev_id}", headers=ADMIN_HEADERS)
            report("6. Reviews", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM reviews WHERE id = %s", (rev_id,)) is None)
    except Exception as e:
        report("6. Reviews", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 7. RANKINGS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/rankings", headers=ADMIN_HEADERS, json={
            "college_id": 2,
            "ranking_body": "NIRF",
            "category": "Overall",
            "rank": 99,
            "score": "82.50",
            "year": 2026
        })
        rank_row = db.fetch_one("SELECT * FROM rankings WHERE college_id = 2 AND rank = 99")
        report("7. Rankings", "POST -> DB Verify", rank_row is not None, f"ID: {rank_row['id'] if rank_row else 'None'}")
        
        if rank_row:
            r_id = rank_row['id']
            res = requests.put(f"{BASE_URL}/api/rankings/{r_id}", headers=ADMIN_HEADERS, json={
                "score": "85.20",
                "rank": 95
            })
            r_up = db.fetch_one("SELECT rank, score FROM rankings WHERE id = %s", (r_id,))
            report("7. Rankings", "PUT -> DB Verify", r_up and r_up['rank'] == 95 and r_up['score'] == "85.20")
            
            res = requests.delete(f"{BASE_URL}/api/rankings/{r_id}", headers=ADMIN_HEADERS)
            report("7. Rankings", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM rankings WHERE id = %s", (r_id,)) is None)
    except Exception as e:
        report("7. Rankings", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 8. CAREERS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/careers", headers=ADMIN_HEADERS, json={
            "career_name": "Test Quantum Systems Architect",
            "domain_name": "Quantum Computing",
            "salary_range": "Rs. 28,00,000",
            "required_skills": "Python, Qiskit",
            "description": "Designs quantum hardware-software stacks."
        })
        car_row = db.fetch_one("SELECT * FROM careers WHERE career_name = 'Test Quantum Systems Architect'")
        report("8. Careers", "POST -> DB Verify", car_row is not None, f"ID: {car_row['id'] if car_row else 'None'}")
        
        if car_row:
            c_id = car_row['id']
            res = requests.put(f"{BASE_URL}/api/careers/{c_id}", headers=ADMIN_HEADERS, json={
                "salary_range": "Rs. 32,00,000"
            })
            car_up = db.fetch_one("SELECT salary_range FROM careers WHERE id = %s", (c_id,))
            report("8. Careers", "PUT -> DB Verify", car_up and car_up['salary_range'] == "Rs. 32,00,000")
            
            res = requests.delete(f"{BASE_URL}/api/careers/{c_id}", headers=ADMIN_HEADERS)
            report("8. Careers", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM careers WHERE id = %s", (c_id,)) is None)
    except Exception as e:
        report("8. Careers", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 9. PLACEMENTS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/placements", headers=ADMIN_HEADERS, json={
            "company_name": "Test Nvidia Quantum AI",
            "college_id": 2,
            "average_package": "Rs. 24 LPA",
            "highest_package": "Rs. 65 LPA",
            "placement_percentage": "98%",
            "year": 2026
        })
        pl_row = db.fetch_one("SELECT * FROM placements WHERE company_name = 'Test Nvidia Quantum AI'")
        report("9. Placements", "POST -> DB Verify", pl_row is not None, f"ID: {pl_row['id'] if pl_row else 'None'}")
        
        if pl_row:
            p_id = pl_row['id']
            res = requests.put(f"{BASE_URL}/api/placements/{p_id}", headers=ADMIN_HEADERS, json={
                "highest_package": "Rs. 72 LPA"
            })
            pl_up = db.fetch_one("SELECT highest_package FROM placements WHERE id = %s", (p_id,))
            report("9. Placements", "PUT -> DB Verify", pl_up and pl_up['highest_package'] == "Rs. 72 LPA")
            
            res = requests.delete(f"{BASE_URL}/api/placements/{p_id}", headers=ADMIN_HEADERS)
            report("9. Placements", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM placements WHERE id = %s", (p_id,)) is None)
    except Exception as e:
        report("9. Placements", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 10. JOBS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/jobs", headers=ADMIN_HEADERS, json={
            "job_title": "Test Lead AI Compiler Engineer",
            "company_name": "Test Global Tech",
            "location": "Bengaluru",
            "salary": "Rs. 35L - Rs. 55L",
            "job_type": "Full-Time"
        })
        job_row = db.fetch_one("SELECT * FROM jobs WHERE job_title = 'Test Lead AI Compiler Engineer'")
        report("10. Jobs", "POST -> DB Verify", job_row is not None, f"ID: {job_row['id'] if job_row else 'None'}")
        
        if job_row:
            j_id = job_row['id']
            res = requests.put(f"{BASE_URL}/api/jobs/{j_id}", headers=ADMIN_HEADERS, json={
                "salary": "Rs. 40L - Rs. 60L"
            })
            job_up = db.fetch_one("SELECT salary FROM jobs WHERE id = %s", (j_id,))
            report("10. Jobs", "PUT -> DB Verify", job_up and job_up['salary'] == "Rs. 40L - Rs. 60L")
            
            res = requests.delete(f"{BASE_URL}/api/jobs/{j_id}", headers=ADMIN_HEADERS)
            report("10. Jobs", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM jobs WHERE id = %s", (j_id,)) is None)
    except Exception as e:
        report("10. Jobs", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 11. INTERNSHIPS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/internships", headers=ADMIN_HEADERS, json={
            "title": "Test Advanced ML Research Intern",
            "company_name": "Test DeepMind Research",
            "location": "Bengaluru",
            "stipend": "Rs. 75,000 / month",
            "duration": "6 Months"
        })
        int_row = db.fetch_one("SELECT * FROM internships WHERE title = 'Test Advanced ML Research Intern'")
        report("11. Internships", "POST -> DB Verify", int_row is not None, f"ID: {int_row['id'] if int_row else 'None'}")
        
        if int_row:
            i_id = int_row['id']
            res = requests.put(f"{BASE_URL}/api/internships/{i_id}", headers=ADMIN_HEADERS, json={
                "stipend": "Rs. 85,000 / month"
            })
            int_up = db.fetch_one("SELECT stipend FROM internships WHERE id = %s", (i_id,))
            report("11. Internships", "PUT -> DB Verify", int_up and int_up['stipend'] == "Rs. 85,000 / month")
            
            res = requests.delete(f"{BASE_URL}/api/internships/{i_id}", headers=ADMIN_HEADERS)
            report("11. Internships", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM internships WHERE id = %s", (i_id,)) is None)
    except Exception as e:
        report("11. Internships", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 12. ADMISSIONS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/admissions", headers=ADMIN_HEADERS, json={
            "college_id": 2,
            "admission_type": "Direct Merit Entrance 2026",
            "application_start": "2026-04-01",
            "application_end": "2026-06-30",
            "eligibility": "10+2 with 75% in PCM",
            "status": "active"
        })
        adm_row = db.fetch_one("SELECT * FROM admissions WHERE admission_type = 'Direct Merit Entrance 2026'")
        report("12. Admissions", "POST -> DB Verify", adm_row is not None, f"ID: {adm_row['id'] if adm_row else 'None'}")
        
        if adm_row:
            a_id = adm_row['id']
            res = requests.put(f"{BASE_URL}/api/admissions/{a_id}", headers=ADMIN_HEADERS, json={
                "status": "closed"
            })
            adm_up = db.fetch_one("SELECT status FROM admissions WHERE id = %s", (a_id,))
            report("12. Admissions", "PUT -> DB Verify", adm_up and adm_up['status'] == "closed")
            
            res = requests.delete(f"{BASE_URL}/api/admissions/{a_id}", headers=ADMIN_HEADERS)
            report("12. Admissions", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM admissions WHERE id = %s", (a_id,)) is None)
    except Exception as e:
        report("12. Admissions", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 13. SCHOLARSHIPS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/scholarships", headers=ADMIN_HEADERS, json={
            "name": "Test Merit Fellowship Scheme 2026",
            "provider": "Government of Tamil Nadu",
            "amount": "Rs. 1,00,000",
            "eligibility": "Top 1% rank in entrance exam."
        })
        sch_row = db.fetch_one("SELECT * FROM scholarships WHERE scholarship_name = 'Test Merit Fellowship Scheme 2026'")
        report("13. Scholarships", "POST -> DB Verify", sch_row is not None, f"ID: {sch_row['id'] if sch_row else 'None'}")
        
        if sch_row:
            s_id = sch_row['id']
            res = requests.put(f"{BASE_URL}/api/scholarships/{s_id}", headers=ADMIN_HEADERS, json={
                "amount": "Rs. 1,25,000"
            })
            sch_up = db.fetch_one("SELECT amount FROM scholarships WHERE id = %s", (s_id,))
            report("13. Scholarships", "PUT -> DB Verify", sch_up and sch_up['amount'] == "Rs. 1,25,000")
            
            res = requests.delete(f"{BASE_URL}/api/scholarships/{s_id}", headers=ADMIN_HEADERS)
            report("13. Scholarships", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM scholarships WHERE id = %s", (s_id,)) is None)
    except Exception as e:
        report("13. Scholarships", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 14. FACILITIES
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/facilities", headers=ADMIN_HEADERS, json={
            "college_id": 2,
            "facility_name": "Test High-Performance Computing Cluster",
            "description": "Dedicated fiber connectivity and 100 TFLOPS compute."
        })
        fac_row = db.fetch_one("SELECT * FROM facilities WHERE college_id = 2 AND facility_name = 'Test High-Performance Computing Cluster'")
        report("14. Facilities", "POST -> DB Verify", fac_row is not None, f"ID: {fac_row['id'] if fac_row else 'None'}")
        
        if fac_row:
            f_id = fac_row['id']
            res = requests.put(f"{BASE_URL}/api/facilities/{f_id}", headers=ADMIN_HEADERS, json={
                "facility_name": "Test High-Performance Computing Cluster (Upgraded)"
            })
            fac_up = db.fetch_one("SELECT facility_name FROM facilities WHERE id = %s", (f_id,))
            report("14. Facilities", "PUT -> DB Verify", fac_up and "Upgraded" in fac_up['facility_name'])
            
            res = requests.delete(f"{BASE_URL}/api/facilities/{f_id}", headers=ADMIN_HEADERS)
            report("14. Facilities", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM facilities WHERE id = %s", (f_id,)) is None)
    except Exception as e:
        report("14. Facilities", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 15. ENTRANCE EXAM PREPARATIONS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/entrance-exams", headers=ADMIN_HEADERS, json={
            "name": "Test Advanced Engineering Entrance Prep",
            "conducted_by": "National Testing Agency",
            "field": "Engineering",
            "total_marks": 300,
            "purpose": "Preparation roadmap and mock question bank for premiere engineering colleges.",
            "status": "active"
        })
        ee_row = db.fetch_one("SELECT * FROM exams WHERE exam_name = 'Test Advanced Engineering Entrance Prep'")
        report("15. Entrance Prep", "POST -> DB Verify", ee_row is not None, f"ID: {ee_row['id'] if ee_row else 'None'}")
        
        if ee_row:
            ee_id = ee_row['id']
            res = requests.put(f"{BASE_URL}/api/entrance-exams/{ee_id}", headers=ADMIN_HEADERS, json={
                "purpose": "Preparation roadmap and mock question bank (Updated)",
                "status": "active"
            })
            ee_up = db.fetch_one("SELECT description FROM exams WHERE id = %s", (ee_id,))
            report("15. Entrance Prep", "PUT -> DB Verify", ee_up and "Updated" in ee_up['description'])
            
            res = requests.delete(f"{BASE_URL}/api/entrance-exams/{ee_id}", headers=ADMIN_HEADERS)
            report("15. Entrance Prep", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM exams WHERE id = %s", (ee_id,)) is None)
    except Exception as e:
        report("15. Entrance Prep", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 16. COMPARISONS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/comparisons", headers=ADMIN_HEADERS, json={
            "college_1": "IIT Madras",
            "college_2": "NIT Trichy",
            "category": "Engineering",
            "verdict": "IIT Madras leads in deep research, while NIT Trichy offers top ROI.",
            "status": "active"
        })
        cmp_row = db.fetch_one("SELECT * FROM comparisons WHERE college_1 = 'IIT Madras' AND college_2 = 'NIT Trichy'")
        report("16. Comparisons", "POST -> DB Verify", cmp_row is not None, f"ID: {cmp_row['id'] if cmp_row else 'None'}")
        
        if cmp_row:
            cmp_id = cmp_row['id']
            res = requests.put(f"{BASE_URL}/api/comparisons/{cmp_id}", headers=ADMIN_HEADERS, json={
                "verdict": "IIT Madras leads in research & patents; NIT Trichy offers stellar core placements."
            })
            cmp_up = db.fetch_one("SELECT verdict FROM comparisons WHERE id = %s", (cmp_id,))
            report("16. Comparisons", "PUT -> DB Verify", cmp_up and "patents" in cmp_up['verdict'])
            
            res = requests.delete(f"{BASE_URL}/api/comparisons/{cmp_id}", headers=ADMIN_HEADERS)
            report("16. Comparisons", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM comparisons WHERE id = %s", (cmp_id,)) is None)
    except Exception as e:
        report("16. Comparisons", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 17. MENTORS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/mentors", headers=ADMIN_HEADERS, json={
            "name": "Dr. Test Mentor Scientist",
            "domains": "Artificial Intelligence",
            "profession": "Research Scientist",
            "company_name": "CampNova Research",
            "email": "mentor.test@campnova.edu",
            "status": "active"
        })
        m_row = db.fetch_one("SELECT * FROM mentors WHERE name = 'Dr. Test Mentor Scientist'")
        report("17. Mentors", "POST -> DB Verify", m_row is not None, f"ID: {m_row['id'] if m_row else 'None'}")
        
        if m_row:
            m_id = m_row['mentor_id'] or m_row['id']
            res = requests.put(f"{BASE_URL}/api/mentors/{m_id}", headers=ADMIN_HEADERS, json={
                "company_name": "Google DeepMind"
            })
            m_up = db.fetch_one("SELECT company_name FROM mentors WHERE id = %s", (m_row['id'],))
            report("17. Mentors", "PUT -> DB Verify", m_up and m_up['company_name'] == "Google DeepMind")
            
            res = requests.delete(f"{BASE_URL}/api/mentors/{m_id}", headers=ADMIN_HEADERS)
            report("17. Mentors", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM mentors WHERE id = %s", (m_row['id'],)) is None)
    except Exception as e:
        report("17. Mentors", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 18. EVENTS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/events", headers=ADMIN_HEADERS, json={
            "title": "Test National Hackathon & Summit 2026",
            "college_name": "IIT Madras",
            "category": "Technical",
            "event_date": "2026-10-18",
            "venue": "Campus Research Park Auditorium",
            "status": "Active"
        })
        ev_row = db.fetch_one("SELECT * FROM events WHERE title = 'Test National Hackathon & Summit 2026'")
        report("18. Events", "POST -> DB Verify", ev_row is not None, f"ID: {ev_row['id'] if ev_row else 'None'}")
        
        if ev_row:
            ev_id = ev_row['id']
            res = requests.put(f"{BASE_URL}/api/events/{ev_id}", headers=ADMIN_HEADERS, json={
                "venue": "Grand IC&SR Hall, IIT Madras",
                "status": "Active"
            })
            ev_up = db.fetch_one("SELECT venue FROM events WHERE id = %s", (ev_id,))
            report("18. Events", "PUT -> DB Verify", ev_up and "IC&SR" in ev_up['venue'])
            
            res = requests.delete(f"{BASE_URL}/api/events/{ev_id}", headers=ADMIN_HEADERS)
            report("18. Events", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM events WHERE id = %s", (ev_id,)) is None)
    except Exception as e:
        report("18. Events", "CRUD Exception", False, str(e))

    # ---------------------------------------------------------
    # 19. NEWS
    # ---------------------------------------------------------
    try:
        res = requests.post(f"{BASE_URL}/api/news", headers=ADMIN_HEADERS, json={
            "title": "Test IIT Madras Launches Next-Gen Quantum Centre",
            "college_name": "IIT Madras",
            "category": "Research",
            "published_date": "2026-09-03",
            "content": "A milestone in national quantum engineering and cryogenic computing."
        })
        nw_row = db.fetch_one("SELECT * FROM news WHERE title = 'Test IIT Madras Launches Next-Gen Quantum Centre'")
        report("19. News", "POST -> DB Verify", nw_row is not None, f"ID: {nw_row['id'] if nw_row else 'None'}")
        
        if nw_row:
            nw_id = nw_row['id']
            res = requests.put(f"{BASE_URL}/api/news/{nw_id}", headers=ADMIN_HEADERS, json={
                "category": "Technology & Innovation"
            })
            nw_up = db.fetch_one("SELECT category FROM news WHERE id = %s", (nw_id,))
            report("19. News", "PUT -> DB Verify", nw_up and nw_up['category'] == "Technology & Innovation")
            
            res = requests.delete(f"{BASE_URL}/api/news/{nw_id}", headers=ADMIN_HEADERS)
            report("19. News", "DELETE -> DB Verify", db.fetch_one("SELECT * FROM news WHERE id = %s", (nw_id,)) is None)
    except Exception as e:
        report("19. News", "CRUD Exception", False, str(e))

    print("========================================================================")
    total_checks = sum(len(steps) for steps in results.values())
    total_passed = sum(sum(1 for s in steps if s[1]) for steps in results.values())
    print(f"OVERALL SUMMARY: {total_passed} / {total_checks} CHECKS PASSED ACROSS ALL 19 MODULES!")
    print("========================================================================")
    if total_passed == total_checks:
        print("ALL 19 MODULES PERFECTLY INTEGRATED END-TO-END WITH POSTGRESQL!")
    else:
        print("SOME CHECKS FAILED. REVIEW DETAILS ABOVE.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
