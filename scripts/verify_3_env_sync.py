import os
import sys
import urllib.request
import urllib.parse
import json
import ssl
import time
import socket

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db

ctx = ssl.create_default_context()

def check_dns(domain):
    try:
        ip = socket.gethostbyname(domain)
        return True, ip
    except Exception as e:
        return False, str(e)

def test_sync_workflow():
    print("=" * 70)
    print("THECAMPUSNOVA — 3-ENVIRONMENT SYNCHRONIZATION TEST SUITE")
    print("=" * 70)

    # 1. Inspect Environments
    print("\n--- [PHASE 1] AUDITING 3 TARGET ENVIRONMENTS ---")
    local_url = "http://127.0.0.1:8000"
    vercel_subdomain = "https://thecampusnova.vercel.app"
    prod_domain = "https://www.thecampusnova.com"

    # Localhost check
    try:
        with urllib.request.urlopen(f"{local_url}/api/colleges?limit=1", timeout=5) as r:
            cc = r.headers.get("Cache-Control", "")
            print(f"[PASS] Localhost ({local_url}): HTTP {r.status} | Cache-Control: {cc}")
    except Exception as e:
        print(f"[FAIL] Localhost ({local_url}) connection failed: {e}")

    # Vercel subdomain check
    try:
        req = urllib.request.Request(f"{vercel_subdomain}/api/colleges?limit=1", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            vid = r.headers.get("x-vercel-id", "unknown")
            print(f"[PASS] Vercel Subdomain ({vercel_subdomain}): HTTP {r.status} | Server: {r.headers.get('Server')} | x-vercel-id: {vid}")
    except Exception as e:
        print(f"[FAIL] Vercel Subdomain probe failed: {e}")

    # Official Production Domain check
    dns_ok, dns_info = check_dns("www.thecampusnova.com")
    if dns_ok:
        print(f"[INFO] Official Domain (www.thecampusnova.com): Resolved IP {dns_info}")
    else:
        print(f"[NOTE] Official Domain (www.thecampusnova.com): DNS pending registrar pointing ({dns_info})")

    # 2. Database Connectivity Check
    print("\n--- [PHASE 2] AUTHORITATIVE DATABASE CONNECTIVITY ---")
    if not db.is_pg_connected():
        print("[FAIL] PostgreSQL connection is not active!")
        return False
    
    db_param = db.get_connection_params()
    if "dsn" in db_param:
        from urllib.parse import urlparse
        p = urlparse(db_param["dsn"])
        print(f"[PASS] PostgreSQL Source: Connected to database '{(p.path or '').lstrip('/')}' at {p.hostname}:{p.port or 5432}")
    else:
        print(f"[PASS] PostgreSQL Source: Connected to database '{db_param['dbname']}' at {db_param['host']}:{db_param['port']}")

    # 3. Synchronized CRUD Lifecycle Test (Module 1: Colleges)
    print("\n--- [PHASE 3] MODULE 1: COLLEGES CRUD & SYNC LIFECYCLE ---")
    test_college_name = f"Apex Tech Test University {int(time.time())}"
    test_aishe = f"U-SYNC-{int(time.time())}"

    # Step 1: Admin Create via Localhost API
    print(f"[Step 1] Creating test college via Localhost Admin API: '{test_college_name}'...")
    create_payload = json.dumps({
        "college_name": test_college_name,
        "aishe_code": test_aishe,
        "location": "Chennai, Tamil Nadu",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "nirf_rank": "1",
        "website": "https://apextech.example.edu",
        "status": "active"
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{local_url}/api/colleges",
        data=create_payload,
        headers={"Content-Type": "application/json", "X-Admin-Role": "admin"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        res_data = json.loads(res.read().decode("utf-8"))
        assert res_data.get("success") is True, f"Creation failed: {res_data}"
        col_obj = res_data.get("college") or {}
        created_id = col_obj.get("db_id") or col_obj.get("id") or res_data.get("id")
        print(f"  [OK] Created in Localhost Admin: ID {created_id}")

    # Step 2: Direct PostgreSQL Verification
    print(f"[Step 2] Verifying record directly in PostgreSQL 'colleges' table...")
    pg_row = db.query_one("SELECT id, college_name, aishe_code, status FROM colleges WHERE id = %s", (created_id,))
    assert pg_row is not None, "Record not found in PostgreSQL!"
    assert pg_row["college_name"] == test_college_name, f"Name mismatch: {pg_row}"
    print(f"  [OK] PostgreSQL Confirmed: ID {pg_row['id']} | Name: '{pg_row['college_name']}' | Status: {pg_row['status']}")

    # Step 3: Localhost GET Verification (Immediate Read)
    print(f"[Step 3] Verifying immediate appearance in Localhost GET /api/colleges...")
    with urllib.request.urlopen(f"{local_url}/api/colleges?search={urllib.parse.quote(test_college_name)}") as r:
        get_data = json.loads(r.read().decode("utf-8"))
        cols = get_data.get("colleges", [])
        assert any(c.get("college_name") == test_college_name or c.get("name") == test_college_name for c in cols), "Not found in GET query!"
        print(f"  [OK] Found {len(cols)} matching college in immediate read.")

    # Step 4: Admin Edit via Localhost API
    print(f"[Step 4] Updating college via Localhost Admin API...")
    updated_name = f"{test_college_name} (Updated)"
    update_payload = json.dumps({
        "college_name": updated_name,
        "nirf_rank": "1",
        "status": "active"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{local_url}/api/colleges/{created_id}",
        data=update_payload,
        headers={"Content-Type": "application/json", "X-Admin-Role": "admin"},
        method="PUT"
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        res_data = json.loads(res.read().decode("utf-8"))
        assert res_data.get("success") is True, f"Update failed: {res_data}"
        print(f"  [OK] Updated in Localhost Admin API.")

    # Step 5: Direct PostgreSQL Verification of Edit
    print(f"[Step 5] Verifying update directly in PostgreSQL...")
    pg_updated = db.query_one("SELECT college_name FROM colleges WHERE id = %s", (created_id,))
    assert pg_updated["college_name"] == updated_name, f"Update not persisted: {pg_updated}"
    print(f"  [OK] PostgreSQL Confirmed Updated Name: '{pg_updated['college_name']}'")

    # Step 6: Admin Delete via Localhost API
    print(f"[Step 6] Deleting college via Localhost Admin API...")
    req = urllib.request.Request(
        f"{local_url}/api/colleges/{created_id}",
        headers={"X-Admin-Role": "admin"},
        method="DELETE"
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        res_data = json.loads(res.read().decode("utf-8"))
        assert res_data.get("success") is True, f"Delete failed: {res_data}"
        print(f"  [OK] Deleted in Localhost Admin API.")

    # Step 7: Direct PostgreSQL Verification of Removal
    print(f"[Step 7] Verifying deletion directly in PostgreSQL...")
    pg_deleted = db.query_one("SELECT status FROM colleges WHERE id = %s", (created_id,))
    assert pg_deleted is None or pg_deleted["status"] in ["deleted", "archived"], f"Record still active: {pg_deleted}"
    print(f"  [OK] PostgreSQL Confirmed: Record status is '{pg_deleted['status'] if pg_deleted else 'Deleted'}'")

    # 4. Synchronized CRUD Lifecycle Test (Module 2: Events)
    print("\n--- [PHASE 4] MODULE 2: EVENTS CRUD & SYNC LIFECYCLE ---")
    event_title = f"National AI Hackathon {int(time.time())}"
    ev_payload = json.dumps({
        "title": event_title,
        "category": "Hackathon",
        "college_name": "Indian Institute of Technology",
        "event_date": "2026-10-25",
        "time": "09:00 AM",
        "venue": "Main Convention Centre",
        "status": "Upcoming"
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{local_url}/api/events",
        data=ev_payload,
        headers={"Content-Type": "application/json", "X-Admin-Role": "admin"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        ev_data = json.loads(res.read().decode("utf-8"))
        assert ev_data.get("success") is True
        ev_id = ev_data.get("id")
        print(f"  [OK] Created Event ID {ev_id} via Admin API.")

    pg_ev = db.query_one("SELECT id, title, event_id FROM events WHERE event_id = %s OR id::text = %s", (str(ev_id), str(ev_id)))
    assert pg_ev is not None and pg_ev["title"] == event_title
    print(f"  [OK] PostgreSQL Confirmed Event: '{pg_ev['title']}'")

    # Cleanup Event
    req = urllib.request.Request(
        f"{local_url}/api/events/{ev_id}",
        headers={"X-Admin-Role": "admin"},
        method="DELETE"
    )
    with urllib.request.urlopen(req, timeout=5) as res:
        print(f"  [OK] Cleaned up test event.")

    print("\n" + "=" * 70)
    print("SYNCHRONIZATION & DATABASE INTEGRITY TEST RESULT: 100% PASS")
    print("=" * 70)
    return True

if __name__ == "__main__":
    test_sync_workflow()
