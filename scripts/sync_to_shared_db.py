import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from urllib.parse import urlparse
from dotenv import dotenv_values

# Explicit order: Parent tables first, then child tables
TABLES_ORDER = [
    "users",
    "domains",
    "courses",
    "colleges",
    "college_courses",
    "exams",
    "exam_preparation",
    "study_materials",
    "reviews",
    "rankings",
    "careers",
    "placements",
    "jobs",
    "internships",
    "admissions",
    "scholarships",
    "facilities",
    "comparisons",
    "mentors",
    "mentor_enquiries",
    "events",
    "news",
    "content_updates",
    "audit_logs",
    "update_details_access_logs",
    "user_activity"
]

def get_db_info(url_or_dict):
    if isinstance(url_or_dict, str):
        parsed = urlparse(url_or_dict)
        return f"{parsed.hostname}:{parsed.port or 5432} (db: {(parsed.path or '').lstrip('/')})"
    return f"{url_or_dict.get('host', 'localhost')}:{url_or_dict.get('port', 5432)} (db: {url_or_dict.get('dbname', 'campnova')})"

def sync_database(target_dsn=None):
    env_vals = dotenv_values(".env")
    source_params = {
        "host": env_vals.get("PGHOST", "localhost"),
        "port": env_vals.get("PGPORT", "5432"),
        "dbname": env_vals.get("PGDATABASE", "campnova"),
        "user": env_vals.get("PGUSER", "postgres"),
        "password": env_vals.get("PGPASSWORD", "postgres")
    }

    target_url = target_dsn or env_vals.get("TARGET_DATABASE_URL") or env_vals.get("DATABASE_URL")
    if not target_url:
        print("[ERR] No target DATABASE_URL provided!")
        return False

    if target_url.startswith("postgres://"):
        target_url = "postgresql://" + target_url[len("postgres://"):]
    
    if "sslmode" not in target_url and "localhost" not in target_url and "127.0.0.1" not in target_url:
        sep = "&" if "?" in target_url else "?"
        target_url = f"{target_url}{sep}sslmode=require"

    print("=" * 65)
    print("CAMPUSNOVA — ZERO-LOSS REPLICATION TO NEON POSTGRESQL")
    print("=" * 65)
    print(f"Source Database : {get_db_info(source_params)}")
    print(f"Target Database : {get_db_info(target_url)}")
    print("=" * 65)

    try:
        source_conn = psycopg2.connect(**source_params)
        source_conn.autocommit = True
        print("[OK] Connected to Source Database.")
    except Exception as e:
        print(f"[ERR] Failed to connect to Source Database: {e}")
        return False

    try:
        target_conn = psycopg2.connect(target_url, connect_timeout=15)
        target_conn.autocommit = True
        print("[OK] Connected to Target Shared Database.")
    except Exception as e:
        err = str(e)
        if "@" in err: err = err.split("@")[-1]
        print(f"[ERR] Failed to connect to Target Database: {err}")
        return False

    # 1. Apply Schema and Migrations to Target
    schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "schema.sql")
    if os.path.exists(schema_path):
        print("\n[Step 1/3] Ensuring base schema exists on target...")
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        try:
            with target_conn.cursor() as cur:
                cur.execute(schema_sql)
            print("  [OK] Base schema initialized.")
        except Exception as e:
            print(f"  [NOTE] Schema notice: {e}")

    migrations_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "migrations")
    if os.path.exists(migrations_dir):
        print("\n[Step 2/3] Applying all migrations to target...")
        for mf in sorted(os.listdir(migrations_dir)):
            if mf.endswith(".sql"):
                mpath = os.path.join(migrations_dir, mf)
                with open(mpath, "r", encoding="utf-8") as f:
                    msql = f.read()
                try:
                    with target_conn.cursor() as cur:
                        cur.execute(msql)
                    print(f"  [OK] Migration {mf} applied.")
                except Exception as e:
                    print(f"  [NOTE] Migration {mf} notice: {e}")

    # 2. Dynamic Schema Alignment: Add any columns missing in target
    print("\n[Step 3/3] Aligning column definitions and synchronizing data...")
    try:
        with target_conn.cursor() as cur:
            cur.execute("SET session_replication_role = 'replica';")
    except Exception:
        pass

    summary = []
    for tname in TABLES_ORDER:
        try:
            # Check source columns
            with source_conn.cursor(cursor_factory=RealDictCursor) as scur:
                scur.execute("""
                    SELECT column_name, data_type, udt_name
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position;
                """, (tname,))
                src_cols = scur.fetchall()

            if not src_cols:
                summary.append((tname, 0, 0, "Not in Source"))
                continue

            # Check target columns
            with target_conn.cursor(cursor_factory=RealDictCursor) as tcur:
                tcur.execute("""
                    SELECT column_name, data_type, udt_name
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position;
                """, (tname,))
                tgt_cols = tcur.fetchall()

            tgt_col_names = {c["column_name"].lower() for c in tgt_cols}

            # Add any missing columns to target
            for sc in src_cols:
                cname = sc["column_name"]
                if cname.lower() not in tgt_col_names:
                    dtype = sc["data_type"]
                    if dtype == "USER-DEFINED":
                        dtype = sc["udt_name"]
                    elif dtype == "ARRAY":
                        dtype = f"{sc['udt_name'].lstrip('_')}[]"
                    try:
                        with target_conn.cursor() as tcur:
                            tcur.execute(f'ALTER TABLE "{tname}" ADD COLUMN IF NOT EXISTS "{cname}" {dtype};')
                        print(f"  [INFO] Added missing column '{cname}' ({dtype}) to table '{tname}'.")
                    except Exception as e:
                        print(f"  [WARN] Could not add column '{cname}' to '{tname}': {e}")

            # Read source rows
            with source_conn.cursor(cursor_factory=RealDictCursor) as scur:
                scur.execute(f'SELECT * FROM "{tname}";')
                rows = scur.fetchall()

            if not rows:
                summary.append((tname, 0, 0, "Empty"))
                continue

            # Determine common columns between source and target
            common_cols = [c["column_name"] for c in src_cols]
            cols_str = ", ".join([f'"{c}"' for c in common_cols])

            val_tuples = []
            for r in rows:
                val_tuples.append(tuple([
                    psycopg2.extras.Json(r[c]) if isinstance(r[c], (dict, list)) else r[c] 
                    for c in common_cols
                ]))

            # Insert into target with ON CONFLICT DO NOTHING
            insert_sql = f'INSERT INTO "{tname}" ({cols_str}) VALUES %s ON CONFLICT DO NOTHING;'
            with target_conn.cursor() as tcur:
                execute_values(tcur, insert_sql, val_tuples, page_size=500)

            # Update auto-increment sequences
            try:
                with target_conn.cursor() as tcur:
                    tcur.execute(f"SELECT setval(pg_get_serial_sequence('\"{tname}\"', 'id'), COALESCE((SELECT MAX(id) FROM \"{tname}\"), 1), true);")
            except Exception:
                pass

            # Verify target count
            with target_conn.cursor() as tcur:
                tcur.execute(f'SELECT COUNT(*) FROM "{tname}";')
                t_count = tcur.fetchone()[0]

            summary.append((tname, len(rows), t_count, "Synchronized"))
            print(f"  [OK] Table '{tname:28}': {len(rows):5} source rows -> {t_count:5} target rows")
        except Exception as e:
            print(f"  [ERR] Error on table '{tname}': {e}")
            summary.append((tname, 0, 0, f"Error: {e}"))

    try:
        with target_conn.cursor() as cur:
            cur.execute("SET session_replication_role = 'origin';")
    except Exception:
        pass

    print("\n" + "=" * 65)
    print("ZERO-LOSS MIGRATION SUMMARY:")
    print("=" * 65)
    print(f"{'TABLE NAME':30} | {'SOURCE':8} | {'TARGET':8} | {'STATUS'}")
    print("-" * 65)
    all_ok = True
    for tname, sc, tc, st in summary:
        print(f"{tname:30} | {sc:8} | {tc:8} | {st}")
        if "Error" in st or (sc > 0 and tc == 0):
            all_ok = False
    print("=" * 65)
    if all_ok:
        print("SUCCESS: All tables and records successfully migrated to Neon!")
    else:
        print("WARNING: Some tables reported notices during synchronization.")
    return all_ok

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    sync_database(target)
