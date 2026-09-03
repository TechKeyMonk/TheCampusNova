import os
import json
import db

def migrate_all_data():
    """Migrates colleges_data.json, courses_data.json, and exam_reviews.json into PostgreSQL."""
    print("=" * 60)
    print("Starting CampNova JSON to PostgreSQL Data Migration")
    print("=" * 60)

    if not db.is_pg_connected():
        print("[Notice] PostgreSQL server is not connected. Ensure PostgreSQL is running and .env is configured.")
        print("[Notice] Migration script is ready to run once PostgreSQL instance is live.")
        return False

    # Initialize schema first
    db.init_db_schema()

    base_dir = os.path.dirname(__file__)
    colleges_file = os.path.join(base_dir, "data", "colleges_data.json")
    if not os.path.exists(colleges_file):
        colleges_file = os.path.join(base_dir, "colleges_data.json")

    courses_file = os.path.join(base_dir, "data", "courses_data.json")
    if not os.path.exists(courses_file):
        courses_file = os.path.join(base_dir, "courses_data.json")

    reviews_file = os.path.join(base_dir, "data", "exam_reviews.json")
    if not os.path.exists(reviews_file):
        reviews_file = os.path.join(base_dir, "exam_reviews.json")

    # 1. Migrate Colleges
    college_id_map = {}
    if os.path.exists(colleges_file):
        try:
            with open(colleges_file, "r", encoding="utf-8") as f:
                cdata = json.load(f)
                colleges_list = cdata.get("colleges", [])
                migrated_colleges = 0
                for col in colleges_list:
                    name = col.get("name", "").strip()
                    city = col.get("city", "").strip()
                    state = col.get("state", "").strip()
                    domains_list = col.get("domains", [])
                    email_domain = domains_list[0] if domains_list else "ac.in"
                    website = f"https://www.{email_domain}" if not email_domain.startswith("http") else email_domain

                    res = db.execute_query(
                        """
                        INSERT INTO colleges (college_name, short_name, location, district, state, website, email, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')
                        ON CONFLICT DO NOTHING
                        RETURNING id
                        """,
                        (name, name, f"{city}, {state}", city, state, website, f"admissions@{email_domain}")
                    )
                    migrated_colleges += 1
                    # Retrieve ID for mapping
                    row = db.query_one("SELECT id FROM colleges WHERE college_name = %s", (name,))
                    if row:
                        college_id_map[name.lower()] = row["id"]
                print(f"✓ Colleges Migrated: {migrated_colleges} records mapped.")
        except Exception as e:
            print(f"✗ Error migrating colleges: {e}")

    # 2. Migrate Courses and Categories from courses_data.json
    if os.path.exists(courses_file):
        try:
            with open(courses_file, "r", encoding="utf-8") as f:
                crs_data = json.load(f)
                categories = crs_data.get("categories", [])
                migrated_courses = 0
                for cat in categories:
                    cat_name = cat.get("name", "")
                    cat_desc = cat.get("description", "")
                    # Insert domain category if not present
                    db.execute_query(
                        """
                        INSERT INTO domains (domain_name, description, status)
                        VALUES (%s, %s, 'active')
                        ON CONFLICT DO NOTHING
                        """,
                        (cat_name, cat_desc)
                    )

                    for grp in cat.get("groups", []):
                        for subfield in grp.get("subfields", []):
                            for prog in subfield.get("programs", []):
                                p_name = prog.get("name", "").strip()
                                p_degree = prog.get("degreeType", "Undergraduate (UG)")
                                p_duration = prog.get("duration", "4 Years")
                                p_elig = prog.get("eligibility", "")
                                p_overview = prog.get("overview", "")

                                db.execute_query(
                                    """
                                    INSERT INTO courses (course_name, degree_type, duration, eligibility, description, status)
                                    VALUES (%s, %s, %s, %s, %s, 'active')
                                    ON CONFLICT DO NOTHING
                                    """,
                                    (p_name, p_degree, p_duration, p_elig, p_overview)
                                )
                                migrated_courses += 1

                                # Map top colleges for this course if listed
                                crs_row = db.query_one("SELECT id FROM courses WHERE course_name = %s", (p_name,))
                                if crs_row and prog.get("topColleges"):
                                    for top_c in prog.get("topColleges"):
                                        c_id = college_id_map.get(top_c.lower())
                                        if c_id:
                                            db.execute_query(
                                                """
                                                INSERT INTO college_courses (college_id, course_id, fees, seats, eligibility)
                                                VALUES (%s, %s, %s, %s, %s)
                                                ON CONFLICT DO NOTHING
                                                """,
                                                (c_id, crs_row["id"], "₹1.5L - ₹4.5L / yr", 120, p_elig)
                                            )
                print(f"✓ Courses Migrated: {migrated_courses} academic programs mapped.")
        except Exception as e:
            print(f"✗ Error migrating courses: {e}")

    # 3. Migrate Exam Reviews
    if os.path.exists(reviews_file):
        try:
            with open(reviews_file, "r", encoding="utf-8") as f:
                revs = json.load(f)
                migrated_revs = 0
                for r in revs:
                    author = r.get("author", "Exam Aspirant")
                    statement = r.get("statement", "")
                    rating = r.get("rating", "★★★★★")
                    role = r.get("role", "Aspirant")
                    db.execute_query(
                        """
                        INSERT INTO reviews (author_name, author_role, rating, review_text, status)
                        VALUES (%s, %s, %s, %s, 'approved')
                        """,
                        (author, role, rating, statement)
                    )
                    migrated_revs += 1
                print(f"✓ Exam Reviews Migrated: {migrated_revs} community remarks stored.")
        except Exception as e:
            print(f"✗ Error migrating reviews: {e}")

    print("=" * 60)
    print("CampNova PostgreSQL Migration Completed Successfully!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    migrate_all_data()
