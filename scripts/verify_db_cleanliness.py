"""
verify_db_cleanliness.py
Inspects Neon PostgreSQL tables to ensure no QA or temporary test records remain.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db

def verify_clean():
    if not db.is_pg_connected():
        print("ERROR: Cannot connect to Neon DB")
        return False

    print("Checking user_activity for test records...")
    rows_act = db.query_all("""
        SELECT count(*) as cnt FROM user_activity 
        WHERE lower(search_query) like %s 
           or lower(search_query) like %s 
           or lower(search_query) like %s
           or lower(record_id) like %s;
    """, ('%test%', '%demo%', '%sample%', '%test%'))
    test_activity = rows_act[0]['cnt'] if rows_act else 0
    print(f"Test user_activity rows: {test_activity}")
    
    print("Checking events for test records...")
    rows_evt = db.query_all("SELECT count(*) as cnt FROM events WHERE lower(title) like %s OR lower(title) like %s;", ('%test%', '%qa%'))
    test_events = rows_evt[0]['cnt'] if rows_evt else 0
    print(f"Test events rows: {test_events}")
    
    print("Checking news for test records...")
    rows_news = db.query_all("SELECT count(*) as cnt FROM news WHERE lower(title) like %s OR lower(title) like %s;", ('%test%', '%qa%'))
    test_news = rows_news[0]['cnt'] if rows_news else 0
    print(f"Test news rows: {test_news}")

    print("Checking mentor_enquiries for test records...")
    rows_m = db.query_all("SELECT count(*) as cnt FROM mentor_enquiries WHERE lower(user_email) like %s OR lower(user_email) like %s;", ('%test%', '%example.com%'))
    test_mentor = rows_m[0]['cnt'] if rows_m else 0
    print(f"Test mentor_enquiries rows: {test_mentor}")

    print("Checking content_updates for test records...")
    rows_u = db.query_all("SELECT count(*) as cnt FROM content_updates WHERE lower(record_id) like %s OR lower(action) like %s;", ('%test%', '%test%'))
    test_updates = rows_u[0]['cnt'] if rows_u else 0
    print(f"Test content_updates rows: {test_updates}")

    all_clean = (test_activity == 0 and test_events == 0 and test_news == 0 and test_mentor == 0 and test_updates == 0)
    print("--------------------------------------------------")
    print("CLEAN STATUS:", "ALL CLEAN (0 test records)" if all_clean else "WARNING: Remaining test records found")
    print("--------------------------------------------------")
    return all_clean

if __name__ == '__main__':
    verify_clean()
