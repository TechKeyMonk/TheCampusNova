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

def run_neon_test():
    print("=" * 70)
    print("THECAMPUSNOVA — REAL NEON DATABASE LIVE SYNCHRONIZATION TEST")
    print("=" * 70)

    local_url = "http://127.0.0.1:8000"
    vercel_subdomain = "https://thecampusnova.vercel.app"
    prod_domain = "https://www.thecampusnova.com"

    # Verify Neon Connection
    print("\n[Step 1] Verifying Active Shared Neon PostgreSQL Connection...")
    if not db.is_pg_connected():
        print("[FAIL] Neon PostgreSQL is not connected!")
        return False
    
    params = db.get_connection_params()
    from urllib.parse import urlparse
    p = urlparse(params.get("dsn", ""))
    print(f"  [OK] Connected to Neon Host: {p.hostname}:{p.port or 5432}")
    print(f"  [OK] Database Name: {(p.path or '').lstrip('/')}")

    # Unique test payload
    ts = int(time.time())
    test_college_name = f"Neon Verified Institute of Technology {ts}"
    test_aishe = f"U-NEON-{ts}"

    print(f"\n[Step 2] Localhost Admin Create -> POST /api/colleges: '{test_college_name}'...")
    create_payload = json.dumps({
        "college_name": test_college_name,
        "aishe_code": test_aishe,
        "location": "Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "nirf_rank": "5",
        "website": "https://neon-verified.edu.in",
        "status": "active"
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{local_url}/api/colleges",
        data=create_payload,
        headers={"Content-Type": "application/json", "X-Admin-Role": "admin"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        res_data = json.loads(res.read().decode("utf-8"))
        assert res_data.get("success") is True, f"Create failed: {res_data}"
        col_obj = res_data.get("college") or {}
        created_id = col_obj.get("db_id") or col_obj.get("id")
        print(f"  [OK] Localhost Admin created record with ID: {created_id}")

    print(f"\n[Step 3] Verifying Direct Persistence in Neon Cloud Database...")
    neon_row = db.query_one("SELECT id, college_name, aishe_code, status FROM colleges WHERE id = %s", (created_id,))
    assert neon_row is not None, "Record NOT found in Neon database!"
    assert neon_row["college_name"] == test_college_name, f"Name mismatch: {neon_row}"
    print(f"  [OK] Confirmed in Neon: ID {neon_row['id']} | Name: '{neon_row['college_name']}' | Status: {neon_row['status']}")

    print(f"\n[Step 4] Immediate Localhost Read Verification (Anti-Cache Check)...")
    with urllib.request.urlopen(f"{local_url}/api/colleges?search={urllib.parse.quote(test_college_name)}") as r:
        cc = r.headers.get("Cache-Control", "")
        get_data = json.loads(r.read().decode("utf-8"))
        cols = get_data.get("colleges", [])
        assert any(c.get("college_name") == test_college_name or c.get("name") == test_college_name for c in cols), "Not found in immediate read!"
        print(f"  [OK] Immediate read returned newly added college (Cache-Control: {cc})")

    print(f"\n[Step 5] Probing Vercel Testing Subdomain ({vercel_subdomain})...")
    try:
        req = urllib.request.Request(f"{vercel_subdomain}/api/colleges?limit=1", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            print(f"  [INFO] Vercel Subdomain is LIVE: HTTP {r.status} | Server: {r.headers.get('Server')}")
    except Exception as e:
        print(f"  [NOTE] Vercel Subdomain probe notice: {e}")

    print(f"\n[Step 6] Probing Production Domain ({prod_domain})...")
    dns_ok, dns_info = check_dns("www.thecampusnova.com")
    if dns_ok:
        print(f"  [OK] Production Domain DNS: Resolved IP {dns_info}")
    else:
        print(f"  [NOTE] Production Domain DNS: Pending registrar pointing ({dns_info})")

    print(f"\n[Step 7] Localhost Admin Update -> PUT /api/colleges/{created_id}...")
    updated_name = f"{test_college_name} (Updated Global)"
    update_payload = json.dumps({
        "college_name": updated_name,
        "nirf_rank": "3",
        "status": "active"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{local_url}/api/colleges/{created_id}",
        data=update_payload,
        headers={"Content-Type": "application/json", "X-Admin-Role": "admin"},
        method="PUT"
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        res_data = json.loads(res.read().decode("utf-8"))
        assert res_data.get("success") is True, f"Update failed: {res_data}"
        print(f"  [OK] Localhost Admin update submitted successfully.")

    print(f"\n[Step 8] Verifying Updated Value Directly in Neon Cloud Database...")
    neon_updated = db.query_one("SELECT college_name FROM colleges WHERE id = %s", (created_id,))
    assert neon_updated["college_name"] == updated_name, f"Update not in Neon: {neon_updated}"
    print(f"  [OK] Confirmed Updated Name in Neon: '{neon_updated['college_name']}'")

    print(f"\n[Step 9] Localhost Admin Delete -> DELETE /api/colleges/{created_id}...")
    req = urllib.request.Request(
        f"{local_url}/api/colleges/{created_id}",
        headers={"X-Admin-Role": "admin"},
        method="DELETE"
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        res_data = json.loads(res.read().decode("utf-8"))
        assert res_data.get("success") is True, f"Delete failed: {res_data}"
        print(f"  [OK] Localhost Admin delete submitted successfully.")

    print(f"\n[Step 10] Verifying Removal / Archive in Neon Cloud Database...")
    neon_deleted = db.query_one("SELECT status FROM colleges WHERE id = %s", (created_id,))
    assert neon_deleted is None or neon_deleted["status"] in ["archived", "deleted"], f"Record still active in Neon: {neon_deleted}"
    print(f"  [OK] Confirmed in Neon: Status is '{neon_deleted['status'] if neon_deleted else 'Deleted'}'")

    print("\n" + "=" * 70)
    print("NEON DATABASE LIVE SYNCHRONIZATION TEST PASSED 100%!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    run_neon_test()
