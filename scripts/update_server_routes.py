import os

new_routes_code = '''# ----------------------------------------------------
# 1. RANKINGS API (/api/rankings)
# ----------------------------------------------------
@app.route("/api/rankings", methods=["GET"])
def api_get_rankings():
    state = request.args.get("state", "").strip().lower()
    district = request.args.get("district", "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    q = request.args.get("q", "").strip().lower()
    
    data = _load_json_data(RANKINGS_DATA_FILE, {"categories": ["Overall", "Engineering", "Arts & Science", "Management", "Medical"], "rankings": []})
    
    if db.is_pg_connected():
        sql = """
            SELECT r.id, r.college_id, c.college_name, c.state, c.district, r.rank, r.category, r.score,
                   c.nirf_rank, c.naac_grade, c.rating as student_rating, c.placement as median_package
            FROM rankings r
            LEFT JOIN colleges c ON r.college_id = c.id
            WHERE 1=1
        """
        params = []
        if state and state != "all":
            sql += " AND LOWER(c.state) LIKE %s"
            params.append(f"%{state}%")
        if district and district != "all":
            sql += " AND LOWER(c.district) LIKE %s"
            params.append(f"%{district}%")
        if category and category != "all":
            sql += " AND LOWER(r.category) = %s"
            params.append(category)
        if q:
            sql += " AND (LOWER(c.college_name) LIKE %s OR LOWER(r.ranking_body) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY r.rank ASC LIMIT 50"
        rows = db.query_all(sql, params)
        if rows:
            return jsonify({
                "success": True,
                "total": len(rows),
                "categories": data.get("categories", ["Overall", "Engineering", "Arts & Science", "Management", "Medical"]),
                "rankings": rows,
                "reviews": data.get("reviews", [])
            })
    
    rankings = data.get("rankings", [])
    if state and state != "all":
        rankings = [r for r in rankings if state in str(r.get("state", "")).lower()]
    if district and district != "all":
        rankings = [r for r in rankings if district in str(r.get("district", "")).lower()]
    if category and category != "all":
        rankings = [r for r in rankings if category == str(r.get("category", "")).lower()]
    if q:
        rankings = [r for r in rankings if q in str(r.get("college_name", "")).lower() or q in str(r.get("summary", "")).lower()]
        
    return jsonify({
        "success": True,
        "total": len(rankings),
        "categories": data.get("categories", []),
        "rankings": rankings[:50],
        "reviews": data.get("reviews", [])
    })

@app.route("/api/rankings", methods=["POST"])
@require_admin_auth
def api_create_ranking():
    body = request.get_json(force=True, silent=True) or {}
    college_id = body.get("college_id") or 1
    if db.is_pg_connected():
        if body.get("college_name"):
            col_row = db.query_one("SELECT id FROM colleges WHERE LOWER(college_name) = LOWER(%s)", (body["college_name"].strip(),))
            if not col_row:
                col_row = db.query_one("SELECT id FROM colleges WHERE college_name ILIKE %s LIMIT 1", (f"%{body['college_name'].strip()}%",))
            if col_row:
                college_id = col_row["id"]
        if not str(college_id).isdigit():
            college_id = 1
        
        rank_val = body.get("rank", 1)
        try: rank_val = int(str(rank_val).replace("#", "").strip())
        except Exception: rank_val = 1

        new_row = db.execute_query("""
            INSERT INTO rankings (college_id, ranking_body, category, rank, year, score)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (int(college_id), body.get("ranking_body", "NIRF / State Metric"), body.get("category", "Overall"), rank_val, body.get("year", 2026), str(body.get("score", "9.5"))))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Ranking Created", "Rankings", str(new_id), f"Created ranking for college {college_id}")

    data = _load_json_data(RANKINGS_DATA_FILE, {"categories": ["Overall", "Engineering", "Arts & Science", "Management", "Medical"], "rankings": []})
    rankings = data.get("rankings", [])
    body["id"] = body.get("id") or f"RNK-{len(rankings) + 1:03d}"
    rankings.insert(0, body)
    data["rankings"] = rankings
    _save_json_data(RANKINGS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Ranking created successfully in PostgreSQL", "ranking": body}), 201

@app.route("/api/rankings/<rank_id>", methods=["PUT"])
@require_admin_auth
def api_update_ranking(rank_id):
    body = request.get_json(force=True, silent=True) or {}
    if db.is_pg_connected() and str(rank_id).isdigit():
        rank_val = body.get("rank")
        try: rank_val = int(str(rank_val).replace("#", "").strip()) if rank_val else None
        except Exception: rank_val = None
        
        db.execute_query("""
            UPDATE rankings 
            SET category = COALESCE(%s, category),
                rank = COALESCE(%s, rank),
                score = COALESCE(%s, score),
                ranking_body = COALESCE(%s, ranking_body),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (body.get("category"), rank_val, str(body.get("score")) if body.get("score") else None, body.get("ranking_body"), int(rank_id)))
        _record_audit_log("Ranking Updated", "Rankings", str(rank_id), f"Updated ranking {rank_id}")

    data = _load_json_data(RANKINGS_DATA_FILE, {"categories": [], "rankings": []})
    for idx, r in enumerate(data.get("rankings", [])):
        if str(r.get("id")) == str(rank_id):
            data["rankings"][idx].update(body)
            break
    _save_json_data(RANKINGS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Ranking updated successfully in PostgreSQL"})

@app.route("/api/rankings/<rank_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_ranking(rank_id):
    if db.is_pg_connected() and str(rank_id).isdigit():
        db.execute_query("DELETE FROM rankings WHERE id = %s", (int(rank_id),))
        _record_audit_log("Ranking Deleted", "Rankings", str(rank_id), f"Deleted ranking {rank_id}")

    data = _load_json_data(RANKINGS_DATA_FILE, {"categories": [], "rankings": []})
    data["rankings"] = [r for r in data.get("rankings", []) if str(r.get("id")) != str(rank_id)]
    _save_json_data(RANKINGS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Ranking deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 2. CAREERS API (/api/careers)
# ----------------------------------------------------
@app.route("/api/careers", methods=["GET"])
@app.route("/api/careers/full", methods=["GET"])
def api_get_careers():
    q = request.args.get("q", "").strip().lower()
    tech = request.args.get("tech", "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    
    if db.is_pg_connected():
        sql = """
            SELECT c.id, c.career_name as name, c.career_name, c.domain_id, d.domain_name as category,
                   c.description, c.required_skills as skills, c.salary_range as avg_salary,
                   c.career_path as roadmap, c.status
            FROM careers c
            LEFT JOIN domains d ON c.domain_id = d.id
            WHERE c.status != 'deleted'
        """
        params = []
        if category and category != "all":
            sql += " AND LOWER(d.domain_name) LIKE %s"
            params.append(f"%{category}%")
        if q:
            sql += " AND (LOWER(c.career_name) LIKE %s OR LOWER(c.description) LIKE %s OR LOWER(c.required_skills) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
        sql += " ORDER BY c.id ASC"
        rows = db.query_all(sql, params)
        if rows:
            for r in rows:
                if isinstance(r.get("skills"), str):
                    r["languages"] = [s.strip() for s in r["skills"].split(",") if s.strip()]
                else:
                    r["languages"] = []
                r["importance_10yr"] = r.get("description", "")
                r["growth_rate"] = "28% YoY"
            return jsonify({
                "success": True,
                "total": len(rows),
                "career_areas": rows,
                "careers": rows,
                "reviews": []
            })
            
    data = _load_json_data(CAREERS_DATA_FILE, {"career_areas": [], "reviews": []})
    areas = data.get("career_areas", [])
    if q:
        areas = [a for a in areas if q in str(a.get("name", "")).lower() or any(q in l.lower() for l in a.get("languages", []))]
    return jsonify({
        "success": True,
        "total": len(areas),
        "career_areas": areas,
        "careers": areas,
        "reviews": data.get("reviews", [])
    })

@app.route("/api/careers", methods=["POST"])
@require_admin_auth
def api_create_career():
    body = request.get_json(force=True, silent=True) or {}
    name = body.get("name") or body.get("career_name") or "New Career Pathway"
    desc = body.get("description") or body.get("overview") or "High growth career track."
    skills = body.get("skills") or body.get("required_skills") or "Problem Solving, Core Concepts"
    if isinstance(skills, list): skills = ", ".join(skills)
    salary = body.get("salary") or body.get("salary_range") or body.get("avg_salary") or "₹12L - ₹25L CTC"
    domain_name = body.get("domain") or body.get("category") or ""
    
    dom_id = 1
    if db.is_pg_connected():
        if domain_name:
            d_row = db.query_one("SELECT id FROM domains WHERE LOWER(domain_name) = LOWER(%s)", (domain_name.strip(),))
            if d_row: dom_id = d_row["id"]
        roadmap_str = json.dumps(body.get("roadmap", [])) if isinstance(body.get("roadmap"), list) else str(body.get("roadmap", ""))
        new_row = db.execute_query("""
            INSERT INTO careers (career_name, domain_id, description, required_skills, salary_range, career_path, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'active')
            RETURNING id
        """, (name, dom_id, desc, skills, salary, roadmap_str))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Career Roadmap Created", "Careers", str(new_id), f"Created roadmap for {name}")

    data = _load_json_data(CAREERS_DATA_FILE, {"career_areas": [], "reviews": []})
    areas = data.get("career_areas", [])
    body["id"] = body.get("id") or f"CAR-{len(areas) + 1:02d}"
    areas.insert(0, body)
    data["career_areas"] = areas
    _save_json_data(CAREERS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Career roadmap created in PostgreSQL", "career": body}), 201

@app.route("/api/careers/<career_id>", methods=["PUT"])
@require_admin_auth
def api_update_career(career_id):
    body = request.get_json(force=True, silent=True) or {}
    name = body.get("name") or body.get("career_name")
    desc = body.get("description") or body.get("importance_10yr")
    skills = body.get("skills") or body.get("required_skills")
    if isinstance(skills, list): skills = ", ".join(skills)
    sal = body.get("salary") or body.get("salary_range") or body.get("avg_salary")
    status = body.get("status")

    if db.is_pg_connected() and str(career_id).isdigit():
        db.execute_query("""
            UPDATE careers
            SET career_name = COALESCE(%s, career_name),
                description = COALESCE(%s, description),
                required_skills = COALESCE(%s, required_skills),
                salary_range = COALESCE(%s, salary_range),
                status = COALESCE(%s, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (name, desc, skills, sal, status, int(career_id)))
        _record_audit_log("Career Roadmap Updated", "Careers", str(career_id), f"Updated career roadmap {career_id}")

    data = _load_json_data(CAREERS_DATA_FILE, {"career_areas": [], "reviews": []})
    for idx, a in enumerate(data.get("career_areas", [])):
        if str(a.get("id")) == str(career_id):
            data["career_areas"][idx].update(body)
            break
    _save_json_data(CAREERS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Career roadmap updated successfully in PostgreSQL"})

@app.route("/api/careers/<career_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_career(career_id):
    if db.is_pg_connected() and str(career_id).isdigit():
        db.execute_query("DELETE FROM careers WHERE id = %s", (int(career_id),))
        _record_audit_log("Career Roadmap Deleted", "Careers", str(career_id), f"Deleted career roadmap {career_id}")

    data = _load_json_data(CAREERS_DATA_FILE, {"career_areas": [], "reviews": []})
    data["career_areas"] = [a for a in data.get("career_areas", []) if str(a.get("id")) != str(career_id)]
    _save_json_data(CAREERS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Career roadmap deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 3. PLACEMENTS API (/api/placements)
# ----------------------------------------------------
@app.route("/api/placements", methods=["GET"])
@app.route("/api/placements/full", methods=["GET"])
def api_get_full_placements():
    college_q = request.args.get("college", "").strip().lower()
    company_q = request.args.get("company", "").strip().lower()
    
    if db.is_pg_connected():
        sql = """
            SELECT p.id, p.college_id, c.college_name, p.company_name, p.company_name as company,
                   p.year, p.highest_package, p.highest_package as highest, p.average_package, p.average_package as average,
                   p.placement_percentage, p.placement_percentage as percentage, p.total_placed, p.total_placed as placed,
                   p.description
            FROM placements p
            LEFT JOIN colleges c ON p.college_id = c.id
            WHERE 1=1
        """
        params = []
        if college_q and college_q != "all":
            sql += " AND LOWER(c.college_name) LIKE %s"
            params.append(f"%{college_q}%")
        if company_q and company_q != "all":
            sql += " AND LOWER(p.company_name) LIKE %s"
            params.append(f"%{company_q}%")
        sql += " ORDER BY p.id DESC"
        rows = db.query_all(sql, params)
        if rows:
            return jsonify({
                "success": True,
                "total_visits": len(rows),
                "company_visits": rows,
                "placements": rows,
                "reviews": []
            })
            
    data = _load_json_data(PLACEMENTS_DATA_FILE, {"stats": {}, "company_visits": [], "reviews": []})
    visits = data.get("company_visits", [])
    if company_q and company_q != "all":
        visits = [v for v in visits if company_q in str(v.get("company", "")).lower()]
    return jsonify({
        "success": True,
        "total_visits": len(visits),
        "company_visits": visits,
        "placements": visits,
        "reviews": data.get("reviews", [])
    })

@app.route("/api/placements", methods=["POST"], endpoint="api_create_placement_short")
@app.route("/api/placements/full", methods=["POST"], endpoint="api_create_placement_full")
@require_admin_auth
def api_create_placement():
    body = request.get_json(force=True, silent=True) or {}
    comp = body.get("company") or body.get("company_name") or "Leading Recruiter"
    pkg = body.get("package_range") or body.get("highest_package") or body.get("highest") or "₹12L - ₹25L CTC"
    avg = body.get("average_package") or body.get("average") or pkg
    desc = body.get("description") or body.get("industry") or "Technology campus hiring."
    pct = body.get("placement_percentage") or body.get("percentage") or "95%"
    total_p = body.get("total_placed") or body.get("placed") or 50
    college_id = body.get("college_id") or 1

    if db.is_pg_connected():
        if body.get("college_name"):
            col_row = db.query_one("SELECT id FROM colleges WHERE college_name ILIKE %s LIMIT 1", (f"%{body['college_name'].strip()}%",))
            if col_row: college_id = col_row["id"]
        if not str(college_id).isdigit(): college_id = 1
        
        new_row = db.execute_query("""
            INSERT INTO placements (college_id, company_name, year, highest_package, average_package, placement_percentage, total_placed, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (int(college_id), comp, 2026, pkg, avg, str(pct), int(total_p) if str(total_p).isdigit() else 50, desc))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Placement Created", "Placements", str(new_id), f"Created placement record for {comp}")

    data = _load_json_data(PLACEMENTS_DATA_FILE, {"company_visits": []})
    visits = data.get("company_visits", [])
    body["id"] = body.get("id") or f"PLC-{len(visits) + 1:02d}"
    visits.insert(0, body)
    data["company_visits"] = visits
    _save_json_data(PLACEMENTS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Placement record created in PostgreSQL", "placement": body}), 201

@app.route("/api/placements/<plc_id>", methods=["PUT"])
@require_admin_auth
def api_update_placement(plc_id):
    body = request.get_json(force=True, silent=True) or {}
    comp = body.get("company") or body.get("company_name")
    pkg = body.get("package_range") or body.get("highest_package") or body.get("highest")
    avg = body.get("average_package") or body.get("average")
    desc = body.get("description")

    if db.is_pg_connected() and str(plc_id).isdigit():
        db.execute_query("""
            UPDATE placements
            SET company_name = COALESCE(%s, company_name),
                highest_package = COALESCE(%s, highest_package),
                average_package = COALESCE(%s, average_package),
                description = COALESCE(%s, description),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (comp, pkg, avg, desc, int(plc_id)))
        _record_audit_log("Placement Updated", "Placements", str(plc_id), f"Updated placement {plc_id}")

    data = _load_json_data(PLACEMENTS_DATA_FILE, {"company_visits": []})
    for idx, v in enumerate(data.get("company_visits", [])):
        if str(v.get("id")) == str(plc_id):
            data["company_visits"][idx].update(body)
            break
    _save_json_data(PLACEMENTS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Placement updated successfully in PostgreSQL"})

@app.route("/api/placements/<plc_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_placement(plc_id):
    if db.is_pg_connected() and str(plc_id).isdigit():
        db.execute_query("DELETE FROM placements WHERE id = %s", (int(plc_id),))
        _record_audit_log("Placement Deleted", "Placements", str(plc_id), f"Deleted placement {plc_id}")

    data = _load_json_data(PLACEMENTS_DATA_FILE, {"company_visits": []})
    data["company_visits"] = [v for v in data.get("company_visits", []) if str(v.get("id")) != str(plc_id)]
    _save_json_data(PLACEMENTS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Placement deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 4. JOBS API (/api/jobs)
# ----------------------------------------------------
@app.route("/api/jobs", methods=["GET"])
@app.route("/api/jobs/full", methods=["GET"])
def api_get_jobs():
    role = request.args.get("role", "").strip().lower()
    q = request.args.get("q", "").strip().lower()

    if db.is_pg_connected():
        sql = """
            SELECT j.id, j.job_title as role, j.job_title, j.company_name as company, j.company_name,
                   d.domain_name as domain, j.location, j.job_type, j.experience as exp_level, j.salary,
                   j.application_url as website, j.deadline, j.description as why_join, j.status
            FROM jobs j
            LEFT JOIN domains d ON j.domain_id = d.id
            WHERE j.status != 'deleted'
        """
        params = []
        if role and role != "all":
            sql += " AND (LOWER(j.job_title) LIKE %s OR LOWER(d.domain_name) LIKE %s)"
            params.extend([f"%{role}%", f"%{role}%"])
        if q:
            sql += " AND (LOWER(j.company_name) LIKE %s OR LOWER(j.job_title) LIKE %s OR LOWER(j.location) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
        sql += " ORDER BY j.id DESC"
        rows = db.query_all(sql, params)
        if rows:
            return jsonify({
                "success": True,
                "total": len(rows),
                "jobs": rows,
                "reviews": []
            })

    data = _load_json_data(JOBS_DATA_FILE, {"jobs": [], "reviews": []})
    jobs = data.get("jobs", [])
    if q:
        jobs = [j for j in jobs if q in str(j.get("company", "")).lower() or q in str(j.get("role", "")).lower()]
    return jsonify({"success": True, "total": len(jobs), "jobs": jobs, "reviews": data.get("reviews", [])})

@app.route("/api/jobs", methods=["POST"])
@require_admin_auth
def api_create_job():
    body = request.get_json(force=True, silent=True) or {}
    title = body.get("role") or body.get("job_title") or body.get("title") or "Software Engineer"
    company = body.get("company") or body.get("company_name") or "Leading Tech Partner"
    domain_name = body.get("domain") or "Engineering"
    loc = body.get("location") or "Bengaluru / Hybrid"
    sal = body.get("salary") or "₹12,00,000 / yr"
    exp = body.get("exp_level") or body.get("experience") or "Entry / 1-3 Years"
    app_url = body.get("website") or body.get("application_url") or "https://thecampusnova.com"
    desc = body.get("why_join") or body.get("description") or "Leading technology role."

    if db.is_pg_connected():
        d_row = db.query_one("SELECT id FROM domains WHERE LOWER(domain_name) = LOWER(%s)", (domain_name.strip(),))
        dom_id = d_row["id"] if d_row else 1
        new_row = db.execute_query("""
            INSERT INTO jobs (job_title, company_name, domain_id, location, job_type, experience, salary, application_url, description, status)
            VALUES (%s, %s, %s, %s, 'Full-Time', %s, %s, %s, %s, 'active')
            RETURNING id
        """, (title, company, dom_id, loc, exp, sal, app_url, desc))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Job Posting Created", "Jobs", str(new_id), f"Created job {title} at {company}")

    data = _load_json_data(JOBS_DATA_FILE, {"jobs": [], "reviews": []})
    jobs = data.get("jobs", [])
    body["id"] = body.get("id") or f"JOB-{len(jobs) + 1:02d}"
    jobs.insert(0, body)
    data["jobs"] = jobs
    _save_json_data(JOBS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Job created successfully in PostgreSQL", "job": body}), 201

@app.route("/api/jobs/<job_id>", methods=["PUT"])
@require_admin_auth
def api_update_job(job_id):
    body = request.get_json(force=True, silent=True) or {}
    title = body.get("role") or body.get("job_title")
    company = body.get("company") or body.get("company_name")
    loc = body.get("location")
    sal = body.get("salary")
    exp = body.get("exp_level") or body.get("experience")
    status = body.get("status")

    if db.is_pg_connected() and str(job_id).isdigit():
        db.execute_query("""
            UPDATE jobs
            SET job_title = COALESCE(%s, job_title),
                company_name = COALESCE(%s, company_name),
                location = COALESCE(%s, location),
                salary = COALESCE(%s, salary),
                experience = COALESCE(%s, experience),
                status = COALESCE(%s, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (title, company, loc, sal, exp, status, int(job_id)))
        _record_audit_log("Job Posting Updated", "Jobs", str(job_id), f"Updated job {job_id}")

    data = _load_json_data(JOBS_DATA_FILE, {"jobs": [], "reviews": []})
    for idx, j in enumerate(data.get("jobs", [])):
        if str(j.get("id")) == str(job_id):
            data["jobs"][idx].update(body)
            break
    _save_json_data(JOBS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Job updated successfully in PostgreSQL"})

@app.route("/api/jobs/<job_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_job(job_id):
    if db.is_pg_connected() and str(job_id).isdigit():
        db.execute_query("DELETE FROM jobs WHERE id = %s", (int(job_id),))
        _record_audit_log("Job Posting Deleted", "Jobs", str(job_id), f"Deleted job {job_id}")

    data = _load_json_data(JOBS_DATA_FILE, {"jobs": [], "reviews": []})
    data["jobs"] = [j for j in data.get("jobs", []) if str(j.get("id")) != str(job_id)]
    _save_json_data(JOBS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Job deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 5. INTERNSHIPS API (/api/internships/full)
# ----------------------------------------------------
@app.route("/api/internships", methods=["GET"])
@app.route("/api/internships/full", methods=["GET"])
def api_get_full_internships():
    domain = request.args.get("domain", "").strip().lower()
    q = request.args.get("q", "").strip().lower()
    
    if db.is_pg_connected():
        sql = """
            SELECT i.id, i.title as role, i.title, i.company_name as company, i.company_name,
                   d.domain_name as domain, i.location, i.stipend, i.duration, i.eligibility,
                   i.application_url as website, i.deadline, i.description, i.status
            FROM internships i
            LEFT JOIN domains d ON i.domain_id = d.id
            WHERE i.status != 'deleted'
        """
        params = []
        if domain and domain != "all":
            sql += " AND LOWER(d.domain_name) LIKE %s"
            params.append(f"%{domain}%")
        if q:
            sql += " AND (LOWER(i.company_name) LIKE %s OR LOWER(i.title) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY i.id DESC"
        rows = db.query_all(sql, params)
        if rows:
            return jsonify({
                "success": True,
                "total": len(rows),
                "internships": rows,
                "reviews": []
            })
            
    data = _load_json_data(INTERNSHIPS_DATA_FILE, {"internships": [], "reviews": []})
    internships = data.get("internships", [])
    if q:
        internships = [i for i in internships if q in str(i.get("company", "")).lower() or q in str(i.get("role", "")).lower()]
    return jsonify({"success": True, "total": len(internships), "internships": internships, "reviews": data.get("reviews", [])})

@app.route("/api/internships", methods=["POST"], endpoint="api_create_internship_short")
@app.route("/api/internships/full", methods=["POST"], endpoint="api_create_internship_full")
@require_admin_auth
def api_create_internship():
    body = request.get_json(force=True, silent=True) or {}
    title = body.get("role") or body.get("title") or "Summer Intern"
    company = body.get("company") or body.get("company_name") or "Enterprise Partner"
    domain_name = body.get("domain") or "Engineering"
    loc = body.get("location") or "Bengaluru"
    stipend = body.get("stipend") or "₹40,000 / month"
    duration = body.get("duration") or "8 - 12 Weeks"
    elig = body.get("eligibility") or "Students in final/pre-final year."
    app_url = body.get("website") or body.get("application_url") or "https://thecampusnova.com"
    desc = body.get("details") or body.get("description") or "Hands-on project work."

    if db.is_pg_connected():
        d_row = db.query_one("SELECT id FROM domains WHERE LOWER(domain_name) = LOWER(%s)", (domain_name.strip(),))
        dom_id = d_row["id"] if d_row else 1
        new_row = db.execute_query("""
            INSERT INTO internships (title, company_name, domain_id, location, stipend, duration, eligibility, application_url, description, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
            RETURNING id
        """, (title, company, dom_id, loc, stipend, duration, elig, app_url, desc))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Internship Created", "Internships", str(new_id), f"Created internship for {company}")

    data = _load_json_data(INTERNSHIPS_DATA_FILE, {"internships": []})
    internships = data.get("internships", [])
    body["id"] = body.get("id") or f"INT-{len(internships) + 1:02d}"
    internships.insert(0, body)
    data["internships"] = internships
    _save_json_data(INTERNSHIPS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Internship created successfully in PostgreSQL", "internship": body}), 201

@app.route("/api/internships/<int_id>", methods=["PUT"])
@require_admin_auth
def api_update_internship(int_id):
    body = request.get_json(force=True, silent=True) or {}
    title = body.get("role") or body.get("title")
    company = body.get("company") or body.get("company_name")
    stipend = body.get("stipend")
    duration = body.get("duration")
    status = body.get("status")

    if db.is_pg_connected() and str(int_id).isdigit():
        db.execute_query("""
            UPDATE internships
            SET title = COALESCE(%s, title),
                company_name = COALESCE(%s, company_name),
                stipend = COALESCE(%s, stipend),
                duration = COALESCE(%s, duration),
                status = COALESCE(%s, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (title, company, stipend, duration, status, int(int_id)))
        _record_audit_log("Internship Updated", "Internships", str(int_id), f"Updated internship {int_id}")

    data = _load_json_data(INTERNSHIPS_DATA_FILE, {"internships": []})
    for idx, i in enumerate(data.get("internships", [])):
        if str(i.get("id")) == str(int_id):
            data["internships"][idx].update(body)
            break
    _save_json_data(INTERNSHIPS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Internship updated successfully in PostgreSQL"})

@app.route("/api/internships/<int_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_internship(int_id):
    if db.is_pg_connected() and str(int_id).isdigit():
        db.execute_query("DELETE FROM internships WHERE id = %s", (int(int_id),))
        _record_audit_log("Internship Deleted", "Internships", str(int_id), f"Deleted internship {int_id}")

    data = _load_json_data(INTERNSHIPS_DATA_FILE, {"internships": []})
    data["internships"] = [i for i in data.get("internships", []) if str(i.get("id")) != str(int_id)]
    _save_json_data(INTERNSHIPS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Internship deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 6. ADMISSIONS API (/api/admissions)
# ----------------------------------------------------
@app.route("/api/admissions", methods=["GET"])
def api_get_admissions():
    q = request.args.get("q", "").strip().lower()
    
    if db.is_pg_connected():
        sql = """
            SELECT a.id, a.college_id, c.college_name, c.state, c.district, a.admission_type,
                   a.eligibility, a.application_start, a.application_end, a.admission_process, a.fees, a.status
            FROM admissions a
            LEFT JOIN colleges c ON a.college_id = c.id
            WHERE a.status != 'deleted'
        """
        params = []
        if q:
            sql += " AND (LOWER(c.college_name) LIKE %s OR LOWER(a.admission_type) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY a.id DESC"
        rows = db.query_all(sql, params)
        if rows:
            return jsonify({
                "success": True,
                "active_admissions_count": len(rows),
                "total": len(rows),
                "admissions": rows,
                "admission_notifications": [{"id": r["id"], "college": r.get("college_name", ""), "title": f"Admission {r.get('admission_type', '')}", "date": r.get("application_end", ""), "badge": "Active"} for r in rows[:5]],
                "reviews": []
            })
            
    data = _load_json_data(ADMISSIONS_DATA_FILE, {"admissions": []})
    admissions = data.get("admissions", [])
    if q:
        admissions = [a for a in admissions if q in str(a.get("college_name", "")).lower() or q in str(a.get("admission_process", "")).lower()]
    return jsonify({"success": True, "total": len(admissions), "admissions": admissions, "reviews": []})

@app.route("/api/admissions", methods=["POST"])
@require_admin_auth
def api_create_admission():
    body = request.get_json(force=True, silent=True) or {}
    college_id = body.get("college_id") or 1
    adm_type = body.get("admission_type") or body.get("title") or "Merit & Counseling"
    elig = body.get("eligibility") or "10+2 with qualifying PCM/PCB marks"
    app_start = body.get("application_start") or body.get("opening_date", "May 2026")
    app_end = body.get("application_end") or body.get("closing_date", "June 2026")
    process = body.get("admission_process") or "Centralized Single Window Counseling"
    fees = body.get("fees") or body.get("fee_structure", "₹55,000 / yr")
    if isinstance(fees, (dict, list)): fees = json.dumps(fees)
    status = body.get("status", "active")

    if db.is_pg_connected():
        if body.get("college_name"):
            col_row = db.query_one("SELECT id FROM colleges WHERE college_name ILIKE %s LIMIT 1", (f"%{body['college_name'].strip()}%",))
            if col_row: college_id = col_row["id"]
        if not str(college_id).isdigit(): college_id = 1
        
        new_row = db.execute_query("""
            INSERT INTO admissions (college_id, admission_type, eligibility, application_start, application_end, admission_process, fees, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (int(college_id), adm_type[:100], elig, app_start, app_end, process, str(fees)[:100], status))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Admission Created", "Admissions", str(new_id), f"Created admission for college {college_id}")

    data = _load_json_data(ADMISSIONS_DATA_FILE, {"admissions": []})
    admissions = data.get("admissions", [])
    body["id"] = body.get("id") or f"ADM-{len(admissions) + 1:03d}"
    admissions.insert(0, body)
    data["admissions"] = admissions
    _save_json_data(ADMISSIONS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Admission created successfully in PostgreSQL", "admission": body}), 201

@app.route("/api/admissions/<adm_id>", methods=["PUT"])
@require_admin_auth
def api_update_admission(adm_id):
    body = request.get_json(force=True, silent=True) or {}
    adm_type = body.get("admission_type")
    elig = body.get("eligibility")
    app_end = body.get("application_end")
    fees = body.get("fees")
    status = body.get("status")

    if db.is_pg_connected() and str(adm_id).isdigit():
        db.execute_query("""
            UPDATE admissions
            SET admission_type = COALESCE(%s, admission_type),
                eligibility = COALESCE(%s, eligibility),
                application_end = COALESCE(%s, application_end),
                fees = COALESCE(%s, fees),
                status = COALESCE(%s, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (adm_type, elig, app_end, fees, status, int(adm_id)))
        _record_audit_log("Admission Updated", "Admissions", str(adm_id), f"Updated admission {adm_id}")

    data = _load_json_data(ADMISSIONS_DATA_FILE, {"admissions": []})
    for idx, a in enumerate(data.get("admissions", [])):
        if str(a.get("id")) == str(adm_id):
            data["admissions"][idx].update(body)
            break
    _save_json_data(ADMISSIONS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Admission updated successfully in PostgreSQL"})

@app.route("/api/admissions/<adm_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_admission(adm_id):
    if db.is_pg_connected() and str(adm_id).isdigit():
        db.execute_query("DELETE FROM admissions WHERE id = %s", (int(adm_id),))
        _record_audit_log("Admission Deleted", "Admissions", str(adm_id), f"Deleted admission {adm_id}")

    data = _load_json_data(ADMISSIONS_DATA_FILE, {"admissions": []})
    data["admissions"] = [a for a in data.get("admissions", []) if str(a.get("id")) != str(adm_id)]
    _save_json_data(ADMISSIONS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Admission deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 7. SCHOLARSHIPS API (/api/scholarships)
# ----------------------------------------------------
@app.route("/api/scholarships", methods=["GET"])
@app.route("/api/scholarships/full", methods=["GET"])
def api_get_full_scholarships():
    q = request.args.get("q", "").strip().lower()
    
    if db.is_pg_connected():
        sql = """
            SELECT s.id, s.scholarship_name, s.scholarship_name as name, s.provider, s.eligibility,
                   s.amount, s.amount as benefit, s.application_start, s.application_end, s.application_end as deadline,
                   s.application_url, s.application_url as portal_url, s.description, s.status
            FROM scholarships s
            WHERE s.status != 'deleted'
        """
        params = []
        if q:
            sql += " AND (LOWER(s.scholarship_name) LIKE %s OR LOWER(s.provider) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY s.id DESC"
        rows = db.query_all(sql, params)
        if rows:
            return jsonify({
                "success": True,
                "total": len(rows),
                "scholarships": rows,
                "application_flow": [],
                "reviews": []
            })
            
    data = _load_json_data(SCHOLARSHIPS_DATA_FILE, {"scholarships": []})
    scholarships = data.get("scholarships", [])
    if q:
        scholarships = [s for s in scholarships if q in str(s.get("name", "")).lower() or q in str(s.get("provider", "")).lower()]
    return jsonify({"success": True, "total": len(scholarships), "scholarships": scholarships, "reviews": []})

@app.route("/api/scholarships", methods=["POST"], endpoint="api_create_scholarship_short")
@app.route("/api/scholarships/full", methods=["POST"], endpoint="api_create_scholarship_full")
@require_admin_auth
def api_create_scholarship():
    body = request.get_json(force=True, silent=True) or {}
    name = body.get("name") or body.get("scholarship_name") or "Merit Scholarship Scheme"
    provider = body.get("provider") or body.get("type", "Government of India")
    elig = body.get("eligibility") or "Class 12 passed with >80th percentile"
    amount = body.get("amount") or body.get("benefit", "₹50,000 / year")
    app_start = body.get("application_start", "01 Aug 2026")
    app_end = body.get("application_end") or body.get("deadline", "31 Oct 2026")
    app_url = body.get("application_url") or body.get("portal_url", "https://scholarships.gov.in")
    desc = body.get("description", "Financial support for higher education.")
    status = body.get("status", "active")

    if db.is_pg_connected():
        new_row = db.execute_query("""
            INSERT INTO scholarships (scholarship_name, provider, eligibility, amount, application_start, application_end, application_url, description, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (name, provider, elig, amount, app_start, app_end, app_url, desc, status))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Scholarship Created", "Scholarships", str(new_id), f"Created scholarship {name}")

    data = _load_json_data(SCHOLARSHIPS_DATA_FILE, {"scholarships": []})
    scholarships = data.get("scholarships", [])
    body["id"] = body.get("id") or f"SCH-{len(scholarships) + 1:03d}"
    scholarships.insert(0, body)
    data["scholarships"] = scholarships
    _save_json_data(SCHOLARSHIPS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Scholarship created successfully in PostgreSQL", "scholarship": body}), 201

@app.route("/api/scholarships/<sch_id>", methods=["PUT"], endpoint="api_update_scholarship_short")
@app.route("/api/scholarships/full/<sch_id>", methods=["PUT"], endpoint="api_update_scholarship_full")
@require_admin_auth
def api_update_scholarship(sch_id):
    body = request.get_json(force=True, silent=True) or {}
    name = body.get("name") or body.get("scholarship_name")
    provider = body.get("provider")
    amount = body.get("amount") or body.get("benefit")
    elig = body.get("eligibility")
    status = body.get("status")

    if db.is_pg_connected() and str(sch_id).isdigit():
        db.execute_query("""
            UPDATE scholarships
            SET scholarship_name = COALESCE(%s, scholarship_name),
                provider = COALESCE(%s, provider),
                amount = COALESCE(%s, amount),
                eligibility = COALESCE(%s, eligibility),
                status = COALESCE(%s, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (name, provider, amount, elig, status, int(sch_id)))
        _record_audit_log("Scholarship Updated", "Scholarships", str(sch_id), f"Updated scholarship {sch_id}")

    data = _load_json_data(SCHOLARSHIPS_DATA_FILE, {"scholarships": []})
    for idx, s in enumerate(data.get("scholarships", [])):
        if str(s.get("id")) == str(sch_id):
            data["scholarships"][idx].update(body)
            break
    _save_json_data(SCHOLARSHIPS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Scholarship updated successfully in PostgreSQL"})

@app.route("/api/scholarships/<sch_id>", methods=["DELETE"], endpoint="api_delete_scholarship_short")
@app.route("/api/scholarships/full/<sch_id>", methods=["DELETE"], endpoint="api_delete_scholarship_full")
@require_admin_auth
def api_delete_scholarship(sch_id):
    if db.is_pg_connected() and str(sch_id).isdigit():
        db.execute_query("DELETE FROM scholarships WHERE id = %s", (int(sch_id),))
        _record_audit_log("Scholarship Deleted", "Scholarships", str(sch_id), f"Deleted scholarship {sch_id}")

    data = _load_json_data(SCHOLARSHIPS_DATA_FILE, {"scholarships": []})
    data["scholarships"] = [s for s in data.get("scholarships", []) if str(s.get("id")) != str(sch_id)]
    _save_json_data(SCHOLARSHIPS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Scholarship deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 8. COLLEGE FACILITIES API (/api/facilities)
# ----------------------------------------------------
@app.route("/api/facilities", methods=["GET"])
def api_get_facilities():
    q = request.args.get("q", "").strip().lower()
    
    if db.is_pg_connected():
        sql = """
            SELECT f.id, f.college_id, c.college_name, c.state, c.district, f.facility_name,
                   f.facility_name as highlight, f.description, f.available
            FROM facilities f
            LEFT JOIN colleges c ON f.college_id = c.id
            WHERE 1=1
        """
        params = []
        if q:
            sql += " AND (LOWER(c.college_name) LIKE %s OR LOWER(f.facility_name) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY f.id DESC"
        rows = db.query_all(sql, params)
        if rows:
            return jsonify({
                "success": True,
                "total": len(rows),
                "facilities": rows,
                "top_15_facilities_ranking": rows[:15],
                "reviews": []
            })
            
    data = _load_json_data(FACILITIES_DATA_FILE, {"top_15_facilities_ranking": [], "facilities_by_college": {}})
    ranking = data.get("top_15_facilities_ranking", [])
    return jsonify({"success": True, "total": len(ranking), "facilities": ranking, "top_15_facilities_ranking": ranking, "reviews": []})

@app.route("/api/facilities", methods=["POST"])
@require_admin_auth
def api_create_facility():
    body = request.get_json(force=True, silent=True) or {}
    fname = body.get("facility_name") or body.get("highlight") or "Campus Labs & High-Tech Facilities"
    desc = body.get("description") or "State-of-the-art campus infrastructure."
    avail = bool(body.get("available", True))
    college_id = body.get("college_id") or 1

    if db.is_pg_connected():
        if body.get("college_name"):
            col_row = db.query_one("SELECT id FROM colleges WHERE college_name ILIKE %s LIMIT 1", (f"%{body['college_name'].strip()}%",))
            if col_row: college_id = col_row["id"]
        if not str(college_id).isdigit(): college_id = 1
        
        new_row = db.execute_query("""
            INSERT INTO facilities (college_id, facility_name, description, available)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (int(college_id), fname, desc, avail))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        _record_audit_log("Facility Created", "Facilities", str(new_id), f"Created facility {fname} for college {college_id}")

    return jsonify({"success": True, "message": "Facility record created successfully in PostgreSQL", "facility": body}), 201

@app.route("/api/facilities/<fac_id>", methods=["PUT"])
@require_admin_auth
def api_update_facility(fac_id):
    body = request.get_json(force=True, silent=True) or {}
    fname = body.get("facility_name") or body.get("highlight")
    desc = body.get("description")
    avail = body.get("available")

    if db.is_pg_connected() and str(fac_id).isdigit():
        db.execute_query("""
            UPDATE facilities
            SET facility_name = COALESCE(%s, facility_name),
                description = COALESCE(%s, description),
                available = COALESCE(%s, available),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (fname, desc, avail, int(fac_id)))
        _record_audit_log("Facility Updated", "Facilities", str(fac_id), f"Updated facility {fac_id}")

    return jsonify({"success": True, "message": "Facility updated successfully in PostgreSQL"})

@app.route("/api/facilities/<fac_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_facility(fac_id):
    if db.is_pg_connected() and str(fac_id).isdigit():
        db.execute_query("DELETE FROM facilities WHERE id = %s", (int(fac_id),))
        _record_audit_log("Facility Deleted", "Facilities", str(fac_id), f"Deleted facility {fac_id}")
    return jsonify({"success": True, "message": "Facility deleted successfully from PostgreSQL"})

# ----------------------------------------------------
# 9. ENTRANCE EXAMS API (/api/entrance-exams)
# ----------------------------------------------------
@app.route("/api/entrance-exams", methods=["GET"])
def api_get_entrance_exams():
    field = request.args.get("field", "").strip().lower()
    q = request.args.get("q", "").strip().lower()
    
    if db.is_pg_connected():
        sql = """
            SELECT e.id, e.exam_name as name, e.exam_name, e.exam_type as field, e.conducting_body,
                   e.conducting_body as conducted_by, e.eligibility, e.exam_date, e.status, e.description as purpose,
                   ep.syllabus, ep.preparation_tips, ep.study_plan, ep.resources
            FROM exams e
            LEFT JOIN exam_preparation ep ON e.id = ep.exam_id
            WHERE e.status != 'archived'
        """
        params = []
        if field and field != "all":
            sql += " AND LOWER(e.exam_type) LIKE %s"
            params.append(f"%{field}%")
        if q:
            sql += " AND (LOWER(e.exam_name) LIKE %s OR LOWER(e.conducting_body) LIKE %s)"
            params.extend([f"%{q}%", f"%{q}%"])
        sql += " ORDER BY e.id ASC"
        rows = db.query_all(sql, params)
        if rows:
            for r in rows:
                r["cutoff_range"] = "Top 10-15 percentile"
                r["total_marks"] = 300
                r["roadmap_stages"] = [
                    {"phase": "Phase 1", "desc": "Syllabus Mastery & NCERT Foundations"},
                    {"phase": "Phase 2", "desc": "10-Year PYQ Drill & Timed Mocks"},
                    {"phase": "Phase 3", "desc": "Formula Revision & Exam Readiness"}
                ]
            return jsonify({
                "success": True,
                "total": len(rows),
                "exams": rows,
                "reviews": []
            })
            
    data = _load_json_data(ENTRANCE_EXAMS_DATA_FILE, {"exams": []})
    exams = data.get("exams", [])
    if q:
        exams = [e for e in exams if q in str(e.get("name", "")).lower() or q in str(e.get("purpose", "")).lower()]
    return jsonify({"success": True, "total": len(exams), "exams": exams, "reviews": []})

@app.route("/api/entrance-exams", methods=["POST"])
@require_admin_auth
def api_create_entrance_exam():
    body = request.get_json(force=True, silent=True) or {}
    name = body.get("name") or body.get("exam_name") or "National Entrance Exam"
    field = body.get("field") or body.get("exam_type", "Engineering")
    cbody = body.get("conducted_by") or body.get("conducting_body", "National Testing Body")
    cutoff = body.get("cutoff_range") or "85+ Percentile"
    purpose = body.get("purpose") or body.get("description", "Gateway for prestigious collegiate admissions.")
    status = body.get("status", "active")

    if db.is_pg_connected():
        new_row = db.execute_query("""
            INSERT INTO exams (exam_name, exam_type, conducting_body, description, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (name, field, cbody, purpose, status))
        new_id = new_row["id"] if new_row and "id" in new_row else 1
        body["id"] = new_id
        # Also create prep record
        db.execute_query("""
            INSERT INTO exam_preparation (exam_id, preparation_tips, study_plan)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (new_id, f"Cutoff: {cutoff}", "Phase 1: Foundations, Phase 2: Mock Tests"))
        _record_audit_log("Entrance Exam Created", "Entrance Prep", str(new_id), f"Created exam {name}")

    data = _load_json_data(ENTRANCE_EXAMS_DATA_FILE, {"exams": []})
    exams = data.get("exams", [])
    body["id"] = body.get("id") or f"EXM-{len(exams) + 1:02d}"
    exams.insert(0, body)
    data["exams"] = exams
    _save_json_data(ENTRANCE_EXAMS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Entrance exam created successfully in PostgreSQL", "exam": body}), 201

@app.route("/api/entrance-exams/<exam_id>", methods=["PUT"])
@require_admin_auth
def api_update_entrance_exam(exam_id):
    body = request.get_json(force=True, silent=True) or {}
    name = body.get("name") or body.get("exam_name")
    cbody = body.get("conducted_by") or body.get("conducting_body")
    status = body.get("status")
    purpose = body.get("purpose") or body.get("description")

    if db.is_pg_connected() and str(exam_id).isdigit():
        db.execute_query("""
            UPDATE exams
            SET exam_name = COALESCE(%s, exam_name),
                conducting_body = COALESCE(%s, conducting_body),
                status = COALESCE(%s, status),
                description = COALESCE(%s, description),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (name, cbody, status, purpose, int(exam_id)))
        _record_audit_log("Entrance Exam Updated", "Entrance Prep", str(exam_id), f"Updated exam {exam_id}")

    data = _load_json_data(ENTRANCE_EXAMS_DATA_FILE, {"exams": []})
    for idx, e in enumerate(data.get("exams", [])):
        if str(e.get("id")) == str(exam_id):
            data["exams"][idx].update(body)
            break
    _save_json_data(ENTRANCE_EXAMS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Entrance exam updated successfully in PostgreSQL"})

@app.route("/api/entrance-exams/<exam_id>", methods=["DELETE"])
@require_admin_auth
def api_delete_entrance_exam(exam_id):
    if db.is_pg_connected() and str(exam_id).isdigit():
        db.execute_query("DELETE FROM exam_preparation WHERE exam_id = %s", (int(exam_id),))
        db.execute_query("DELETE FROM exams WHERE id = %s", (int(exam_id),))
        _record_audit_log("Entrance Exam Deleted", "Entrance Prep", str(exam_id), f"Deleted exam {exam_id}")

    data = _load_json_data(ENTRANCE_EXAMS_DATA_FILE, {"exams": []})
    data["exams"] = [e for e in data.get("exams", []) if str(e.get("id")) != str(exam_id)]
    _save_json_data(ENTRANCE_EXAMS_DATA_FILE, data)
    return jsonify({"success": True, "message": "Entrance exam deleted successfully from PostgreSQL"})
'''

with open("server.py", "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "# ----------------------------------------------------\n# 1. RANKINGS API (/api/rankings)"
end_marker = "# ----------------------------------------------------\n# 10. REVIEW & COMPARISON API (/api/comparisons)"

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos == -1 or end_pos == -1:
    print(f"Markers not found! start_pos={start_pos}, end_pos={end_pos}")
else:
    new_content = content[:start_pos] + new_routes_code + "\n" + content[end_pos:]
    with open("server.py", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully replaced routes in server.py!")
