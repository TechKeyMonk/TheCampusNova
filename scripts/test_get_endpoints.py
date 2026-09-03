import requests

BASE = "http://127.0.0.1:8000"
endpoints = [
    "/admin.html",
    "/index.html",
    "/api/courses",
    "/api/colleges",
    "/api/domains",
    "/api/exams",
    "/api/study-materials",
    "/api/reviews",
    "/api/rankings",
    "/api/careers",
    "/api/placements",
    "/api/jobs",
    "/api/internships",
    "/api/admissions",
    "/api/scholarships",
    "/api/facilities",
    "/api/entrance-exams",
    "/api/comparisons",
    "/api/mentors",
    "/api/events",
    "/api/news"
]

print("=== VERIFYING ALL 19 MODULES PUBLIC & ADMIN GET API ENDPOINTS ===")
all_ok = True
for ep in endpoints:
    try:
        r = requests.get(BASE + ep)
        ok = r.status_code == 200
        count = ""
        if ok and ep.startswith("/api/"):
            try:
                data = r.json()
                if isinstance(data, list):
                    count = f"(Items: {len(data)})"
                elif isinstance(data, dict):
                    c = data.get("total") or len(data.get("courses") or data.get("colleges") or data.get("exams") or data.get("materials") or data.get("domains") or data.get("placements") or data.get("jobs") or data.get("internships") or data.get("scholarships") or data.get("facilities") or data.get("mentors") or data.get("events") or data.get("news") or data.get("comparisons") or [])
                    count = f"(Items: {c})"
            except Exception:
                pass
        if not ok:
            all_ok = False
        status_text = "PASS" if ok else "FAIL"
        print(f"[{status_text}] [{r.status_code}] {ep:25} {count}")
    except Exception as e:
        all_ok = False
        print(f"[FAIL] {ep:25} -> {e}")

print("===================================================================")
if all_ok:
    print("ALL 19 MODULE ENDPOINTS & HTML PAGES VERIFIED 100% OPERATIONAL!")
else:
    print("SOME ENDPOINTS FAILED.")
