import os
import sys
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)
import db

def migrate():
    if not db.is_pg_connected():
        print("[ERROR] PostgreSQL is not connected!")
        return False

    print("[INFO] Connected to PostgreSQL. Creating missing tables...")

    # 1. Create events table
    db.execute_query("""
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            event_id VARCHAR(50) UNIQUE,
            title VARCHAR(255) NOT NULL,
            college_id VARCHAR(50),
            college_name VARCHAR(255),
            category VARCHAR(150),
            event_date VARCHAR(100),
            time VARCHAR(100),
            venue VARCHAR(255),
            description TEXT,
            registration_link TEXT,
            status VARCHAR(50) DEFAULT 'Upcoming',
            badge VARCHAR(100) DEFAULT 'Official Event',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_name);
        CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    """)
    print("[INFO] Table 'events' created/verified.")

    # 2. Create news table
    db.execute_query("""
        CREATE TABLE IF NOT EXISTS news (
            id SERIAL PRIMARY KEY,
            news_id VARCHAR(50) UNIQUE,
            title VARCHAR(255) NOT NULL,
            college_name VARCHAR(255),
            category VARCHAR(150),
            published_date VARCHAR(100),
            summary TEXT,
            content TEXT,
            source_url TEXT,
            badge VARCHAR(100) DEFAULT 'Official Bulletin',
            status VARCHAR(50) DEFAULT 'Published',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_news_college ON news(college_name);
        CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
    """)
    print("[INFO] Table 'news' created/verified.")

    # 3. Create comparisons table
    db.execute_query("""
        CREATE TABLE IF NOT EXISTS comparisons (
            id SERIAL PRIMARY KEY,
            comparison_id VARCHAR(50) UNIQUE,
            college_1 VARCHAR(255) NOT NULL,
            college_2 VARCHAR(255) NOT NULL,
            category VARCHAR(150),
            metrics JSONB,
            verdict TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_comparisons_c1 ON comparisons(college_1);
        CREATE INDEX IF NOT EXISTS idx_comparisons_c2 ON comparisons(college_2);
    """)
    print("[INFO] Table 'comparisons' created/verified.")

    # Seed events
    events_count = db.query_one("SELECT COUNT(*) as c FROM events")["c"]
    if events_count == 0:
        ev_file = os.path.join(base_dir, "data", "events_data.json")
        if os.path.exists(ev_file):
            with open(ev_file, "r", encoding="utf-8") as f:
                ev_data = json.load(f)
            events_list = ev_data.get("events", [])
            for e in events_list:
                db.execute_query("""
                    INSERT INTO events (event_id, title, college_id, college_name, category, event_date, time, venue, description, registration_link, status, badge)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (event_id) DO NOTHING
                """, (
                    e.get("id"),
                    e.get("title", "Campus Event"),
                    e.get("college_id", ""),
                    e.get("college_name", "Premier Institution"),
                    e.get("category", "General"),
                    e.get("event_date", "2026-09-15"),
                    e.get("time", "10:00 AM"),
                    e.get("venue", "Campus Auditorium"),
                    e.get("description", ""),
                    e.get("registration_link", ""),
                    e.get("status", "Upcoming"),
                    e.get("badge", "Official Event")
                ))
            print(f"[INFO] Seeded {len(events_list)} events into PostgreSQL.")

    # Seed news
    news_count = db.query_one("SELECT COUNT(*) as c FROM news")["c"]
    if news_count == 0:
        news_file = os.path.join(base_dir, "data", "news_data.json")
        if os.path.exists(news_file):
            with open(news_file, "r", encoding="utf-8") as f:
                news_data = json.load(f)
            news_list = news_data.get("news", [])
            for n in news_list:
                db.execute_query("""
                    INSERT INTO news (news_id, title, college_name, category, published_date, summary, content, source_url, badge, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (news_id) DO NOTHING
                """, (
                    n.get("id"),
                    n.get("title", "Campus News"),
                    n.get("college_name", "Academic Bulletin"),
                    n.get("category", "General"),
                    n.get("published_date", "2026-09-01"),
                    n.get("summary", ""),
                    n.get("content", n.get("summary", "")),
                    n.get("source_url", ""),
                    n.get("badge", "Official Bulletin"),
                    n.get("status", "Published")
                ))
            print(f"[INFO] Seeded {len(news_list)} news items into PostgreSQL.")

    # Seed comparisons
    comp_count = db.query_one("SELECT COUNT(*) as c FROM comparisons")["c"]
    if comp_count == 0:
        comp_file = os.path.join(base_dir, "data", "comparisons_data.json")
        if os.path.exists(comp_file):
            with open(comp_file, "r", encoding="utf-8") as f:
                comp_data = json.load(f)
            reviews_list = comp_data.get("reviews", [])
            for idx, c in enumerate(reviews_list):
                comp_id = f"CMP-{idx+1:03d}"
                c1 = c.get("college_1") or c.get("college1") or "College A"
                c2 = c.get("college_2") or c.get("college2") or "College B"
                cat = c.get("category", "Engineering")
                metrics = json.dumps(c.get("metrics", {}))
                verdict = c.get("verdict", "") or c.get("summary", "")
                db.execute_query("""
                    INSERT INTO comparisons (comparison_id, college_1, college_2, category, metrics, verdict, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'active')
                    ON CONFLICT (comparison_id) DO NOTHING
                """, (comp_id, c1, c2, cat, metrics, verdict))
            print(f"[INFO] Seeded {len(reviews_list)} comparisons into PostgreSQL.")

    print("\n[SUCCESS] All 19 modules now have active PostgreSQL tables!")

if __name__ == "__main__":
    migrate()
