import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db

rows = db.query_all("""
    SELECT id, enquiry_id, mentor_name, user_name, user_email 
    FROM mentor_enquiries 
    WHERE lower(user_email) like %s OR lower(user_email) like %s
""", ('%test%', '%example.com%'))
print("Target mentor enquiries:", rows)

if rows:
    ids = [r['id'] for r in rows]
    print(f"Cleaning IDs: {ids}")
    for target_id in ids:
        db.execute_query("DELETE FROM mentor_enquiries WHERE id = %s", (target_id,))
    print("Cleaned!")
