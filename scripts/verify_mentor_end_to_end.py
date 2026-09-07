import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import db

BASE_URL = "http://127.0.0.1:8000"
ADMIN_PASSKEY = "admin123"

def http_req(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    h = headers or {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body)
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(resp_body)
        except Exception:
            parsed = {"raw": resp_body}
        return e.code, parsed

def run_tests():
    print("==================================================")
    print("THECAMPUSNOVA MENTORS END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Verify PostgreSQL Database Connection & Initial Row
    print("\n--- TEST 1: PostgreSQL Mentors Table Inspection ---")
    if not db.is_pg_connected():
        print("[FAIL] PostgreSQL not connected!")
        sys.exit(1)
    
    pg_rows = db.query_all("SELECT * FROM mentors WHERE status != 'archived';")
    print(f"[PASS] PostgreSQL connected. Active mentors in DB: {len(pg_rows)}")
    has_initial_mentor = any(m.get("mentor_id") == "MEN-007" for m in pg_rows)
    print(f"[INFO] Existing verified mentor MEN-007 present in PostgreSQL: {has_initial_mentor}")

    # 2. Verify User Website Public GET API (/api/mentors)
    print("\n--- TEST 2: User Website Public GET /api/mentors ---")
    status, data = http_req("/api/mentors")
    if status != 200 or not data.get("success"):
        print(f"[FAIL] GET /api/mentors returned {status}: {data}")
        sys.exit(1)
    print(f"[PASS] GET /api/mentors returned HTTP 200 with {data.get('total')} mentors.")
    
    # Check masking of public data
    for m in data.get("mentors", []):
        email = m.get("email", "")
        mobile = m.get("mobile_number", "")
        if "@" in email:
            assert "*" in email, f"Email must be masked: {email}"
        if mobile:
            assert "*" in mobile, f"Mobile must be masked: {mobile}"
        print(f"  [VERIFIED] Mentor '{m.get('name')}' -> Masked Email: {email}, Masked Phone: {mobile}")
    print("[PASS] Public privacy masking verified.")

    # 3. Verify Search Filtering by Name, Company, Profession, Domain
    print("\n--- TEST 3: Search Query Filtering (/api/mentors?q=...) ---")
    test_queries = ["JeganKumar", "TechKeyMonk", "Founder", "Graphic designing"]
    for q in test_queries:
        status, sdata = http_req(f"/api/mentors?q={urllib.parse.quote(q)}")
        assert status == 200 and sdata.get("success"), f"Search failed for {q}"
        assert len(sdata.get("mentors", [])) >= 1, f"Search '{q}' should find at least 1 mentor"
        print(f"  [PASS] Search '{q}' successfully returned matching mentor: {sdata['mentors'][0]['name']}")

    # Search with no match
    status, nomatch = http_req("/api/mentors?q=NonExistentCompanyOrMentor12345")
    assert status == 200 and nomatch.get("total") == 0
    print("  [PASS] Non-matching search returns 0 results cleanly (no error/crash).")

    # 4. Verify Admin Portal Add Mentor -> PostgreSQL Insert -> User Website GET API
    print("\n--- TEST 4: Admin Add Mentor -> PostgreSQL INSERT -> User Website Display ---")
    admin_headers = {
        "X-Admin-Role": "admin",
        "X-Admin-Passkey": ADMIN_PASSKEY
    }
    new_mentor_payload = {
        "name": "Dr. Kavitha Ramanathan",
        "company_name": "Google Research India",
        "profession": "Staff AI / ML Scientist",
        "domains": "Artificial Intelligence,Machine Learning,Deep Learning,Data Science",
        "email": "kavitha.ramanathan@googleresearch.com",
        "mobile_number": "9840198401",
        "profile_image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
        "facebook_url": "https://facebook.com/kavitha.ai",
        "instagram_url": "https://instagram.com/kavitha.ai",
        "linkedin_url": "https://linkedin.com/in/kavitha-ramanathan",
        "status": "active"
    }
    status, create_res = http_req("/api/admin/mentors", method="POST", data=new_mentor_payload, headers=admin_headers)
    if status != 201 or not create_res.get("success"):
        print(f"[FAIL] Admin create mentor failed: {status}, {create_res}")
        sys.exit(1)
    
    created_mentor = create_res.get("mentor", {})
    created_id = created_mentor.get("mentor_id") or created_mentor.get("id")
    print(f"[PASS] Admin API created mentor with ID: {created_id}")

    # Verify directly in PostgreSQL
    pg_record = db.query_one("SELECT * FROM mentors WHERE mentor_id = %s;", (created_id,))
    if not pg_record:
        print(f"[FAIL] Mentor {created_id} was NOT inserted into PostgreSQL!")
        sys.exit(1)
    print(f"[PASS] PostgreSQL verification: Found mentor in DB: '{pg_record['name']}' ({pg_record['company_name']})")

    # Verify via Public GET /api/mentors
    status, public_check = http_req("/api/mentors")
    found_in_public = any(m.get("mentor_id") == created_id for m in public_check.get("mentors", []))
    if not found_in_public:
        print(f"[FAIL] Newly added mentor {created_id} not returned by User Website GET /api/mentors!")
        sys.exit(1)
    print(f"[PASS] User Website GET /api/mentors successfully returned new mentor '{created_mentor['name']}'!")

    # 5. Verify Admin Portal Edit Mentor -> PostgreSQL Update -> User Website Refreshed
    print("\n--- TEST 5: Admin Edit Mentor -> PostgreSQL UPDATE -> User Website Refreshed ---")
    update_payload = {
        "name": "Dr. Kavitha Ramanathan",
        "company_name": "Google DeepMind",
        "profession": "Senior Director of AI Systems",
        "domains": "Artificial Intelligence,Machine Learning,Deep Learning,Autonomous Systems",
        "email": "kavitha.ramanathan@deepmind.com",
        "mobile_number": "9840198401",
        "status": "active"
    }
    status, update_res = http_req(f"/api/admin/mentors/{created_id}", method="PUT", data=update_payload, headers=admin_headers)
    if status != 200 or not update_res.get("success"):
        print(f"[FAIL] Admin update mentor failed: {status}, {update_res}")
        sys.exit(1)
    print("[PASS] Admin update API returned HTTP 200.")

    # Verify update in PostgreSQL
    pg_updated = db.query_one("SELECT * FROM mentors WHERE mentor_id = %s;", (created_id,))
    assert pg_updated["company_name"] == "Google DeepMind", "Company must be updated in PostgreSQL"
    assert pg_updated["profession"] == "Senior Director of AI Systems", "Profession must be updated in PostgreSQL"
    print(f"[PASS] PostgreSQL verification: Updated row confirms '{pg_updated['company_name']}' - '{pg_updated['profession']}'")

    # Verify User Website reflects update
    status, pub_updated = http_req("/api/mentors")
    target_pub = next((m for m in pub_updated.get("mentors", []) if m.get("mentor_id") == created_id), None)
    assert target_pub and target_pub["company_name"] == "Google DeepMind", "Public API must reflect updated company"
    print(f"[PASS] User Website GET /api/mentors confirms updated mentor: '{target_pub['company_name']}'")

    # 6. Verify Admin Portal Delete Mentor -> PostgreSQL Delete -> User Website Removal
    print("\n--- TEST 6: Admin Delete Mentor -> PostgreSQL DELETE -> User Website Removal ---")
    status, del_res = http_req(f"/api/admin/mentors/{created_id}", method="DELETE", headers=admin_headers)
    if status != 200 or not del_res.get("success"):
        print(f"[FAIL] Admin delete mentor failed: {status}, {del_res}")
        sys.exit(1)
    print(f"[PASS] Admin delete API returned HTTP 200 for mentor {created_id}.")

    # Verify deletion from PostgreSQL
    pg_deleted = db.query_one("SELECT * FROM mentors WHERE mentor_id = %s;", (created_id,))
    if pg_deleted:
        print(f"[FAIL] Mentor {created_id} still exists in PostgreSQL after deletion!")
        sys.exit(1)
    print("[PASS] PostgreSQL verification: Mentor successfully removed from DB.")

    # Verify removal from User Website
    status, pub_after_del = http_req("/api/mentors")
    still_present = any(m.get("mentor_id") == created_id for m in pub_after_del.get("mentors", []))
    if still_present:
        print(f"[FAIL] Deleted mentor {created_id} still returned by User Website GET /api/mentors!")
        sys.exit(1)
    print("[PASS] User Website GET /api/mentors confirms deleted mentor is no longer displayed.")

    # 7. Verify Enquiry Submission for Verified Mentor
    print("\n--- TEST 7: Mentor 1-on-1 Enquiry Workflow (/api/mentor-enquiries) ---")
    enquiry_payload = {
        "name": "Arun Prakash",
        "email": "arun.prakash@example.edu",
        "mobile": "9876543210",
        "terms_accepted": True,
        "mentor_id": "MEN-007",
        "mentor_name": "JeganKumar Perumal"
    }
    status, enq_res = http_req("/api/mentor-enquiries", method="POST", data=enquiry_payload, headers={"X-Test-Mode": "true"})
    if status != 201 or not enq_res.get("success"):
        print(f"[FAIL] Mentor enquiry submission failed: {status}, {enq_res}")
        sys.exit(1)
    enq_id = enq_res.get("enquiry_id")
    print(f"[PASS] Mentor enquiry submitted successfully with ID: {enq_id}")

    # Check Admin Enquiries
    status, admin_enqs = http_req("/api/admin/mentor-enquiries", headers=admin_headers)
    found_enq = any(e.get("enquiry_id") == enq_id or e.get("user_email") == "arun.prakash@example.edu" for e in admin_enqs.get("enquiries", []))
    assert found_enq, f"Enquiry {enq_id} must appear in Admin Enquiries"
    print(f"[PASS] Admin Portal confirms receipt of student mentorship enquiry {enq_id}.")

    # Clean up test enquiry from DB
    if enq_id:
        db.execute_query("DELETE FROM mentor_enquiries WHERE enquiry_id = %s;", (enq_id,))
        print(f"[INFO] Cleaned up temporary test enquiry {enq_id}.")

    print("\n==================================================")
    print("ALL END-TO-END MENTORS DATABASE TESTS PASSED 100%!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
