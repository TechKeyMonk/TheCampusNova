import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db

rows = db.query_all("""
    SELECT id, action_type, module, record_id, search_query 
    FROM user_activity 
    WHERE lower(search_query) like %s or lower(record_id) like %s
""", ('%test%', '%test%'))
print("Target rows:", rows)

if rows:
    ids = [r['id'] for r in rows]
    print(f"Cleaning IDs: {ids}")
    for target_id in ids:
        db.execute_query("DELETE FROM user_activity WHERE id = %s", (target_id,))
    print("Cleaned!")
