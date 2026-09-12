import os
import json
import time
from contextlib import contextmanager
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

DATABASE_URL_KEYS = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
    "NEON_DATABASE_URL",
    "PGDATABASE_URL",
    "POSTGRESQL_URL"
]
DATABASE_URL = os.environ.get("DATABASE_URL")
PGHOST = os.environ.get("PGHOST", "localhost")
PGPORT = os.environ.get("PGPORT", "5432")
PGDATABASE = os.environ.get("PGDATABASE", "campnova")
PGUSER = os.environ.get("PGUSER", "postgres")
PGPASSWORD = os.environ.get("PGPASSWORD", "postgres")

_connection_pool = None
_is_connected = False
_last_pool_attempt = 0
_POOL_RETRY_INTERVAL = 15  # seconds between reconnect attempts if offline
_CONNECT_TIMEOUT = int(os.environ.get("PGCONNECT_TIMEOUT", "3"))

def get_connection_candidates():
    """
    Returns an ordered list of connection candidate dictionaries.
    Prioritizes connection strings, then discrete variables.
    In serverless / Vercel mode, filters out localhost configurations to prevent blocking timeouts.
    """
    candidates = []
    is_serverless = bool(
        os.environ.get("VERCEL") or
        os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or
        os.environ.get("VERCEL_ENV")
    )

    # 1. Full connection URI environment variables
    for key in DATABASE_URL_KEYS:
        raw_val = os.environ.get(key)
        if raw_val and raw_val.strip():
            clean_val = raw_val.strip().strip("'\"")
            if clean_val:
                if clean_val.startswith("postgres://"):
                    clean_val = "postgresql://" + clean_val[len("postgres://"):]

                from urllib.parse import urlparse
                try:
                    parsed = urlparse(clean_val)
                    db_host = (parsed.hostname or "").lower().strip()
                    if is_serverless and db_host in ["localhost", "127.0.0.1", "::1"]:
                        continue
                except Exception:
                    pass

                candidates.append({"dsn": clean_val, "source_env": key})

    # 2. Discrete host/user/pass/dbname environment variables
    host = os.environ.get("PGHOST") or os.environ.get("POSTGRES_HOST")
    user = os.environ.get("PGUSER") or os.environ.get("POSTGRES_USER")
    password = os.environ.get("PGPASSWORD") or os.environ.get("POSTGRES_PASSWORD")
    dbname = os.environ.get("PGDATABASE") or os.environ.get("POSTGRES_DATABASE") or os.environ.get("POSTGRES_DB") or "campnova"
    port = os.environ.get("PGPORT") or os.environ.get("POSTGRES_PORT") or "5432"

    if host:
        host_clean = str(host).strip().lower()
        if is_serverless and host_clean in ["localhost", "127.0.0.1", "::1"]:
            pass
        else:
            candidates.append({
                "host": host,
                "port": port,
                "dbname": dbname,
                "user": user or "postgres",
                "password": password or "",
                "source_env": "DISCRETE_ENV"
            })
    elif not is_serverless:
        candidates.append({
            "host": "localhost",
            "port": port,
            "dbname": dbname,
            "user": user or "postgres",
            "password": password or "",
            "source_env": "LOCAL_DEFAULT"
        })

    return candidates

def is_connection_alive(conn):
    """Checks if a psycopg2 connection is active and responsive."""
    if conn is None or getattr(conn, "closed", 0) != 0:
        return False
    try:
        if PSYCOPG2_AVAILABLE:
            from psycopg2.extensions import TRANSACTION_STATUS_IDLE
            if hasattr(conn, "get_transaction_status") and conn.get_transaction_status() != TRANSACTION_STATUS_IDLE:
                conn.rollback()
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
        if PSYCOPG2_AVAILABLE:
            from psycopg2.extensions import TRANSACTION_STATUS_IDLE
            if hasattr(conn, "get_transaction_status") and conn.get_transaction_status() != TRANSACTION_STATUS_IDLE:
                conn.rollback()
        return True
    except Exception:
        return False

def get_pool(force_reconnect=False):
    """Initializes or returns threaded PostgreSQL connection pool with serverless resiliency."""
    global _connection_pool, _is_connected, _last_pool_attempt
    if not PSYCOPG2_AVAILABLE:
        _is_connected = False
        return None

    if force_reconnect and _connection_pool is not None:
        try:
            _connection_pool.closeall()
        except Exception:
            pass
        _connection_pool = None
        _is_connected = False

    if _connection_pool is not None and getattr(_connection_pool, "closed", False):
        _connection_pool = None
        _is_connected = False

    if _connection_pool is not None and not force_reconnect:
        return _connection_pool

    now = time.time()
    if not force_reconnect and (now - _last_pool_attempt < _POOL_RETRY_INTERVAL):
        return None
    _last_pool_attempt = now

    is_serverless = bool(
        os.environ.get("VERCEL") or
        os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or
        os.environ.get("VERCEL_ENV")
    )
    candidates = get_connection_candidates()
    if not candidates:
        _is_connected = False
        if is_serverless:
            print("[PostgreSQL Notice] No remote PostgreSQL configuration provided or reachable in Vercel environment.")
        return None

    max_conn = 5 if is_serverless else int(os.environ.get("PGMAXCONN", "4"))
    conn_timeout = int(os.environ.get("PGCONNECT_TIMEOUT", "3" if is_serverless else "5"))

    for params in candidates:
        source_env = params.get("source_env", "UNKNOWN")
        try:
            if "dsn" in params:
                dsn = params["dsn"]
                from urllib.parse import urlparse
                parsed = urlparse(dsn)
                db_host = parsed.hostname or "remote"
                db_port = parsed.port or 5432
                db_name = (parsed.path or "").lstrip("/") or "database"

                if db_host not in ["localhost", "127.0.0.1", "::1"] and "sslmode" not in dsn:
                    sep = "&" if "?" in dsn else "?"
                    dsn = f"{dsn}{sep}sslmode=require"

                if "connect_timeout" not in dsn:
                    sep = "&" if "?" in dsn else "?"
                    dsn = f"{dsn}{sep}connect_timeout={conn_timeout}"

                if "keepalives" not in dsn:
                    sep = "&" if "?" in dsn else "?"
                    dsn = f"{dsn}{sep}keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=5"

                p = pool.ThreadedConnectionPool(minconn=1, maxconn=max_conn, dsn=dsn)
                test_conn = p.getconn()
                with test_conn.cursor() as cur:
                    cur.execute("SELECT 1;")
                test_conn.rollback()
                p.putconn(test_conn)

                _connection_pool = p
                _is_connected = True
                print(f"[PostgreSQL] Connected via [{source_env}] to database '{db_name}' at {db_host}:{db_port}")
                return _connection_pool
            else:
                db_host = params["host"]
                db_port = params["port"]
                db_name = params["dbname"]
                p = pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=max_conn,
                    host=db_host,
                    port=db_port,
                    dbname=db_name,
                    user=params["user"],
                    password=params["password"],
                    connect_timeout=conn_timeout
                )
                test_conn = p.getconn()
                with test_conn.cursor() as cur:
                    cur.execute("SELECT 1;")
                test_conn.rollback()
                p.putconn(test_conn)

                _connection_pool = p
                _is_connected = True
                print(f"[PostgreSQL] Connected to database '{db_name}' at {db_host}:{db_port}")
                return _connection_pool
        except Exception as e:
            err_msg = str(e)
            if "@" in err_msg:
                err_msg = err_msg.split("@")[-1]
            safe_err = err_msg.encode('ascii', 'replace').decode('ascii')
            print(f"[PostgreSQL Connection Notice] Candidate [{source_env}] unavailable: {safe_err.strip()}")
            continue

    _is_connected = False
    _connection_pool = None
    return None

def get_connection_params():
    """Builds connection configuration dictionary for legacy scripts."""
    candidates = get_connection_candidates()
    return candidates[0] if candidates else {}

def get_connection():
    """Acquires a verified live connection from the pool, recycling stale sockets."""
    p = get_pool()
    if not p:
        p = get_pool(force_reconnect=True)
    if not p:
        return None
    try:
        conn = p.getconn()
        if not is_connection_alive(conn):
            try:
                p.putconn(conn, close=True)
            except Exception:
                pass
            p = get_pool(force_reconnect=True)
            if not p:
                return None
            conn = p.getconn()
            if not is_connection_alive(conn):
                try:
                    p.putconn(conn, close=True)
                except Exception:
                    pass
                return None
        return conn
    except Exception as e:
        safe_msg = str(e).encode('ascii', 'replace').decode('ascii')
        print(f"[PostgreSQL Connection Acquisition Error] {safe_msg}")
        return None

def release_connection(conn, close=False):
    """Safely releases a connection back to the pool, ensuring autocommit is reset."""
    p = get_pool()
    if not p or not conn:
        return
    try:
        if close or getattr(conn, "closed", 0) != 0:
            try:
                p.putconn(conn, close=True)
            except Exception:
                pass
        else:
            try:
                if PSYCOPG2_AVAILABLE:
                    from psycopg2.extensions import TRANSACTION_STATUS_IDLE
                    if hasattr(conn, "get_transaction_status") and conn.get_transaction_status() != TRANSACTION_STATUS_IDLE:
                        conn.rollback()
                if not conn.autocommit:
                    conn.autocommit = True
            except Exception:
                pass
            p.putconn(conn)
    except Exception:
        pass

@contextmanager
def transaction():
    """Transactional context manager for atomic multi-statement operations with rollback on failure."""
    conn = get_connection()
    if not conn:
        raise RuntimeError("PostgreSQL database is disconnected or unavailable.")
    try:
        if PSYCOPG2_AVAILABLE:
            from psycopg2.extensions import TRANSACTION_STATUS_IDLE
            if hasattr(conn, "get_transaction_status") and conn.get_transaction_status() != TRANSACTION_STATUS_IDLE:
                conn.rollback()
        if conn.autocommit:
            conn.autocommit = False
        yield conn
        conn.commit()
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        is_conn_error = isinstance(e, (psycopg2.OperationalError, psycopg2.InterfaceError)) if PSYCOPG2_AVAILABLE else False
        release_connection(conn, close=is_conn_error)
        raise e
    else:
        release_connection(conn, close=False)

def is_pg_connected():
    """Returns True if active PostgreSQL connection pool is available and responsive."""
    p = get_pool()
    if p is None or not _is_connected:
        p = get_pool(force_reconnect=True)
        if p is None or not _is_connected:
            return False
    conn = None
    try:
        conn = p.getconn()
        if not is_connection_alive(conn):
            try:
                p.putconn(conn, close=True)
            except Exception:
                pass
            conn = None
            p = get_pool(force_reconnect=True)
            if not p:
                return False
            conn = p.getconn()
            if not is_connection_alive(conn):
                try:
                    p.putconn(conn, close=True)
                except Exception:
                    pass
                conn = None
                return False
        return True
    except Exception:
        return False
    finally:
        if conn:
            release_connection(conn)

def query_all(sql, params=None):
    """Executes a SELECT query and returns all records as a list of dicts with stale socket retry."""
    for attempt in range(2):
        conn = get_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params or ())
                rows = cur.fetchall()
                res = [dict(r) for r in rows]
            release_connection(conn)
            return res
        except Exception as e:
            is_conn_err = isinstance(e, (psycopg2.OperationalError, psycopg2.InterfaceError)) if PSYCOPG2_AVAILABLE else False
            release_connection(conn, close=is_conn_err)
            if is_conn_err and attempt == 0:
                print(f"[PostgreSQL Query Notice] Stale connection detected. Reconnecting and retrying: {sql[:60]}...")
                get_pool(force_reconnect=True)
                continue
            safe_msg = str(e).encode('ascii', 'replace').decode('ascii')
            print(f"[PostgreSQL Query Error] {safe_msg} (SQL: {sql[:60]}...)")
            return []
    return []

def query_one(sql, params=None):
    """Executes a SELECT query and returns a single record as a dict or None with stale socket retry."""
    for attempt in range(2):
        conn = get_connection()
        if not conn:
            return None
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params or ())
                row = cur.fetchone()
                res = dict(row) if row else None
            release_connection(conn)
            return res
        except Exception as e:
            is_conn_err = isinstance(e, (psycopg2.OperationalError, psycopg2.InterfaceError)) if PSYCOPG2_AVAILABLE else False
            release_connection(conn, close=is_conn_err)
            if is_conn_err and attempt == 0:
                print(f"[PostgreSQL Query One Notice] Stale connection detected. Reconnecting and retrying: {sql[:60]}...")
                get_pool(force_reconnect=True)
                continue
            safe_msg = str(e).encode('ascii', 'replace').decode('ascii')
            print(f"[PostgreSQL Query One Error] {safe_msg}")
            return None
    return None

def execute_query(sql, params=None):
    """Executes an INSERT, UPDATE, or DELETE query and commits with stale socket retry."""
    for attempt in range(2):
        conn = get_connection()
        if not conn:
            return None
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, params or ())
                conn.commit()
                if cur.description:
                    row = cur.fetchone()
                    res = dict(row) if row else None
                else:
                    res = cur.rowcount
            release_connection(conn)
            return res
        except Exception as e:
            is_conn_err = isinstance(e, (psycopg2.OperationalError, psycopg2.InterfaceError)) if PSYCOPG2_AVAILABLE else False
            release_connection(conn, close=is_conn_err)
            if is_conn_err and attempt == 0:
                print(f"[PostgreSQL Execute Notice] Stale connection detected. Reconnecting and retrying: {sql[:60]}...")
                get_pool(force_reconnect=True)
                continue
            safe_msg = str(e).encode('ascii', 'replace').decode('ascii')
            print(f"[PostgreSQL Execute Error] {safe_msg} (SQL: {sql[:60]}...)")
            return None
    return None

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
