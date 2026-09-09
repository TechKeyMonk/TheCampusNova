import os
import json
import base64
import logging
from email.mime.text import MIMEText

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

_curr_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_curr_env):
    load_dotenv(dotenv_path=_curr_env, override=False)
else:
    load_dotenv()

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# Production & Vercel Multi-Provider Environment Variable Key Aliases
GMAIL_CLIENT_ID_KEYS = [
    "GMAIL_CLIENT_ID",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_ID",
    "CLIENT_ID"
]

GMAIL_CLIENT_SECRET_KEYS = [
    "GMAIL_CLIENT_SECRET",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "CLIENT_SECRET"
]

GMAIL_REFRESH_TOKEN_KEYS = [
    "GMAIL_REFRESH_TOKEN",
    "GOOGLE_REFRESH_TOKEN",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
    "GMAIL_TOKEN",
    "REFRESH_TOKEN"
]

GMAIL_USER_KEYS = [
    "GMAIL_USER",
    "GMAIL_EMAIL",
    "GOOGLE_USER",
    "SMTP_USER",
    "SMTP_FROM"
]

DEFAULT_OFFICIAL_EMAIL = "thecampusnova@gmail.com"


def _get_clean_env_val(keys, default=""):
    """
    Resolves environment variable across multiple candidate keys,
    safely stripping whitespace, carriage returns, and enclosing quotes.
    Supports:
    1. Exact match for keys
    2. Case-insensitive match across os.environ
    3. Trimmed key match (handles accidental spaces in variable names)
    4. Normalized match (handles prefixes and stripped underscores)
    """
    # 1. Exact match
    for k in keys:
        raw = os.getenv(k)
        if raw is not None:
            clean = str(raw).strip().strip("'\"")
            if clean:
                return clean

    # 2. Case-insensitive and trimmed key match
    env_keys_clean = {k.strip().upper(): k for k in os.environ.keys()}
    for k in keys:
        k_upper = k.strip().upper()
        if k_upper in env_keys_clean:
            actual_key = env_keys_clean[k_upper]
            raw = os.getenv(actual_key)
            if raw is not None:
                clean = str(raw).strip().strip("'\"")
                if clean:
                    return clean

    # 3. Normalized match (ignores underscores, hyphens, and common framework prefixes)
    normalized_targets = {k.upper().replace("_", "").replace("-", "") for k in keys}
    for env_k, env_v in os.environ.items():
        clean_env_k = (
            env_k.strip().upper()
            .replace("NEXT_PUBLIC_", "")
            .replace("VITE_", "")
            .replace("REACT_APP_", "")
            .replace("_", "")
            .replace("-", "")
        )
        if clean_env_k in normalized_targets:
            if env_v is not None:
                clean = str(env_v).strip().strip("'\"")
                if clean:
                    return clean

    return default


def _load_client_secret_file():
    """
    Fallback helper to read client_id and client_secret from client_secret.json
    if available locally.
    """
    cs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client_secret.json")
    if os.path.exists(cs_path):
        try:
            with open(cs_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                web = data.get("web") or data.get("installed") or {}
                return web.get("client_id", ""), web.get("client_secret", "")
        except Exception as e:
            logger.warning(f"[Gmail Client Secret File Warning] Failed to parse client_secret.json: {e}")
    return "", ""


def get_gmail_credentials():
    """
    Resolves and validates Gmail OAuth credentials from environment variables
    with multi-key fallback, sanitization, and client_secret.json fallback.
    """
    client_id = _get_clean_env_val(GMAIL_CLIENT_ID_KEYS)
    client_secret = _get_clean_env_val(GMAIL_CLIENT_SECRET_KEYS)
    refresh_token = _get_clean_env_val(GMAIL_REFRESH_TOKEN_KEYS)

    # Fallback to client_secret.json if client_id or client_secret missing in env
    if not client_id or not client_secret:
        f_cid, f_cs = _load_client_secret_file()
        if not client_id and f_cid:
            client_id = f_cid.strip().strip("'\"")
        if not client_secret and f_cs:
            client_secret = f_cs.strip().strip("'\"")

    missing = []
    if not refresh_token:
        missing.append("GMAIL_REFRESH_TOKEN (or GOOGLE_REFRESH_TOKEN)")
    if not client_id:
        missing.append("GMAIL_CLIENT_ID (or GOOGLE_CLIENT_ID)")
    if not client_secret:
        missing.append("GMAIL_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)")

    if missing:
        raise RuntimeError(f"Missing required Gmail credentials in environment: {', '.join(missing)}")

    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES
    )

    if not credentials.valid:
        credentials.refresh(Request())

    return credentials


def get_gmail_service():
    """
    Builds and returns the authorized Gmail API service Resource.
    Configures cache_discovery=False and dynamic discovery fallback
    to guarantee reliability in serverless (Vercel / Lambda) environments.
    """
    credentials = get_gmail_credentials()

    try:
        return build("gmail", "v1", credentials=credentials, cache_discovery=False)
    except Exception as e:
        logger.warning(f"[Gmail Build] Static discovery failed ({e}), attempting dynamic discovery fallback...")
        return build("gmail", "v1", credentials=credentials, cache_discovery=False, static_discovery=False)


def check_gmail_status():
    """
    Diagnostic helper for administrative health verification.
    Reports credential availability and API initialization status
    without exposing any secret tokens or passwords.
    """
    client_id = _get_clean_env_val(GMAIL_CLIENT_ID_KEYS)
    client_secret = _get_clean_env_val(GMAIL_CLIENT_SECRET_KEYS)
    refresh_token = _get_clean_env_val(GMAIL_REFRESH_TOKEN_KEYS)
    sender = _get_clean_env_val(GMAIL_USER_KEYS, default=DEFAULT_OFFICIAL_EMAIL)

    if not client_id or not client_secret:
        f_cid, f_cs = _load_client_secret_file()
        if not client_id and f_cid: client_id = f_cid
        if not client_secret and f_cs: client_secret = f_cs

    status = {
        "client_id_configured": bool(client_id),
        "client_secret_configured": bool(client_secret),
        "refresh_token_configured": bool(refresh_token),
        "sender_email": sender,
        "initialized": False,
        "detected_env_variable_names": [
            k for k in sorted(os.environ.keys())
            if any(term in k.upper() for term in ["GMAIL", "GOOGLE", "MAIL", "SMTP", "REFRESH", "CLIENT_ID", "CLIENT_SECRET", "TOKEN"])
        ],
        "error": None
    }

    try:
        service = get_gmail_service()
        status["initialized"] = bool(service)
    except Exception as e:
        status["error"] = str(e)

    return status


def send_email(subject, body, to_email=None):
    """
    Sends an email using the Gmail API service.
    Authoritative sender email defaults to official TheCampusNova Gmail.
    """
    sender = _get_clean_env_val(GMAIL_USER_KEYS, default=DEFAULT_OFFICIAL_EMAIL)
    recipient = to_email or sender

    service = get_gmail_service()

    message = MIMEText(body, "plain", "utf-8")
    message["to"] = recipient
    message["from"] = sender
    message["subject"] = subject

    raw_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    service.users().messages().send(
        userId="me",
        body={"raw": raw_message}
    ).execute()

    logger.info(f"[GMAIL API] Email delivered successfully to {recipient} | Subject: {subject}")
    return True
