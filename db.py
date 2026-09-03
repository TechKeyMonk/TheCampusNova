import os
import json
import time
from dotenv import load_dotenv

# Load environment variables
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    load_dotenv(dotenv_path=_env_path, override=True)
else:
    load_dotenv()

# Check if psycopg2 is available
try:
    import psycopg2
    from psycopg2 import pool
    from psycopg2.extras import RealDictCursor, Json
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# Database configuration
DATABASE_URL = os.environ.get("DATABASE_URL")
PGHOST = os.environ.get("PGHOST", "localhost")
PGPORT = os.environ.get("PGPORT", "5432")
PGDATABASE = os.environ.get("PGDATABASE", "campnova")
PGUSER = os.environ.get("PGUSER", "postgres")
PGPASSWORD = os.environ.get("PGPASSWORD", "postgres")

_connection_pool = None
_is_connected = False
_last_pool_attempt = 0
_POOL_RETRY_INTERVAL = 20  # seconds between reconnect attempts

def get_connection_params():
    """Builds connection configuration dictionary."""
    database_url = os.environ.get("DATABASE_URL")
    if database_url and database_url.strip():
        return {"dsn": database_url.strip()}
    return {
        "host": os.environ.get("PGHOST", "localhost"),
        "port": os.environ.get("PGPORT", "5432"),
        "dbname": os.environ.get("PGDATABASE", "campnova"),
        "user": os.environ.get("PGUSER", "postgres"),
        "password": os.environ.get("PGPASSWORD", "postgres")
    }

def get_pool():
    """Initializes or returns threaded PostgreSQL connection pool."""
    global _connection_pool, _is_connected, _last_pool_attempt
    if not PSYCOPG2_AVAILABLE:
        _is_connected = False
        return None

    if _connection_pool is None:
        now = time.time()
        if now - _last_pool_attempt < _POOL_RETRY_INTERVAL:
            return None
        _last_pool_attempt = now

        try:
            params = get_connection_params()
            if "dsn" in params:
                dsn = params["dsn"]
                if "connect_timeout" not in dsn:
                    sep = "&" if "?" in dsn else "?"
                    dsn = f"{dsn}{sep}connect_timeout=1"
                _connection_pool = pool.ThreadedConnectionPool(minconn=1, maxconn=20, dsn=dsn)
            else:
                _connection_pool = pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=20,
                    host=params["host"],
                    port=params["port"],
                    dbname=params["dbname"],
                    user=params["user"],
                    password=params["password"],
                    connect_timeout=1
                )
            _is_connected = True
            print(f"[PostgreSQL] Connected to database '{PGDATABASE}' at {PGHOST}:{PGPORT}")
        except Exception as e:
            _is_connected = False
            return None
    return _connection_pool

def is_pg_connected():
    """Returns True if active PostgreSQL connection pool is available."""
    p = get_pool()
    return p is not None

def query_all(sql, params=None):
    """Executes a SELECT query and returns all records as a list of dicts."""
    p = get_pool()
    if not p:
        return []
    conn = None
    try:
        conn = p.getconn()
        try:
            conn.rollback()
        except Exception:
            pass
        conn.autocommit = True
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        print(f"[PostgreSQL Query Error] {e} (SQL: {sql[:60]}...)")
        if conn:
            try: conn.rollback()
            except Exception: pass
        return []
    finally:
        if conn and p:
            p.putconn(conn)

def query_one(sql, params=None):
    """Executes a SELECT query and returns a single record as a dict or None."""
    p = get_pool()
    if not p:
        return None
    conn = None
    try:
        conn = p.getconn()
        try:
            conn.rollback()
        except Exception:
            pass
        conn.autocommit = True
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            row = cur.fetchone()
            return dict(row) if row else None
    except Exception as e:
        print(f"[PostgreSQL Query One Error] {e}")
        if conn:
            try: conn.rollback()
            except Exception: pass
        return None
    finally:
        if conn and p:
            p.putconn(conn)

def execute_query(sql, params=None):
    """Executes an INSERT, UPDATE, or DELETE query and commits."""
    p = get_pool()
    if not p:
        return None
    conn = None
    try:
        conn = p.getconn()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            conn.commit()
            if cur.description:
                row = cur.fetchone()
                return dict(row) if row else None
            return cur.rowcount
    except Exception as e:
        print(f"[PostgreSQL Execute Error] {e} (SQL: {sql[:60]}...)")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn and p:
            p.putconn(conn)

def init_db_schema():
    """Runs schema.sql and seed.sql to initialize all 20 tables if not existing."""
    if not is_pg_connected():
        return False

    schema_file = os.path.join(os.path.dirname(__file__), "database", "schema.sql")
    seed_file = os.path.join(os.path.dirname(__file__), "database", "seed.sql")

    try:
        if os.path.exists(schema_file):
            with open(schema_file, "r", encoding="utf-8") as f:
                schema_sql = f.read()
                execute_query(schema_sql)
                print("[PostgreSQL] Schema initialization complete (20 tables verified).")

        # Check if users exist before seeding
        user_count = query_one("SELECT COUNT(*) as count FROM users")
        if user_count and user_count.get("count", 0) == 0:
            if os.path.exists(seed_file):
                with open(seed_file, "r", encoding="utf-8") as f:
                    seed_sql = f.read()
                    execute_query(seed_sql)
                    print("[PostgreSQL] Seed data loaded successfully.")
        return True
    except Exception as e:
        print(f"[PostgreSQL Init Error] {e}")
        return False

def run_migration_file(filename):
    """Applies one idempotent SQL migration and reports whether it committed."""
    if not is_pg_connected():
        return False

    migration_file = os.path.join(os.path.dirname(__file__), "database", "migrations", filename)
    if not os.path.exists(migration_file):
        raise FileNotFoundError(migration_file)

    with open(migration_file, "r", encoding="utf-8") as f:
        migration_sql = f.read()
    return execute_query(migration_sql) is not None
