import os
import json
import base64
import smtplib
import logging
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Load local .env if available
_curr_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_curr_env):
    load_dotenv(dotenv_path=_curr_env, override=False)
else:
    load_dotenv()

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# Environment Variable Key Aliases
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

GMAIL_APP_PASS_KEYS = [
    "GMAIL_APP_PASSWORD",
    "GOOGLE_APP_PASSWORD",
    "SMTP_PASS",
    "SMTP_PASSWORD",
    "MAIL_PASSWORD"
]

SMTP_HOST_KEYS = [
    "SMTP_HOST",
    "GMAIL_SMTP_HOST",
    "MAIL_HOST"
]

SMTP_PORT_KEYS = [
    "SMTP_PORT",
    "GMAIL_SMTP_PORT",
    "MAIL_PORT"
]

DEFAULT_OFFICIAL_EMAIL = "thecampusnova@gmail.com"
DEFAULT_SMTP_HOST = "smtp.gmail.com"
DEFAULT_SMTP_PORT = 587


def _get_clean_env_val(keys, default=""):
    """
    Resolves environment variable across multiple candidate keys,
    safely stripping whitespace, carriage returns, and enclosing quotes.
    Supports:
    1. Exact match for keys
    2. Case-insensitive match across os.environ
    3. Normalized match (ignores prefixes, hyphens, and underscores)
    """
    # 1. Exact match
    for k in keys:
        raw = os.getenv(k)
        if raw is not None:
            clean = str(raw).strip().strip("'\"")
            if clean:
                return clean

    # 2. Case-insensitive match
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

    # 3. Normalized match
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
    Fallback helper to read client_id, client_secret, and redirect_uris
    from client_secret.json if available locally.
    """
    cs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client_secret.json")
    if os.path.exists(cs_path):
        try:
            with open(cs_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                web = data.get("web") or data.get("installed") or {}
                return (
                    web.get("client_id", ""),
                    web.get("client_secret", ""),
                    web.get("redirect_uris", [])
                )
        except Exception as e:
            logger.warning(f"[Gmail Client Secret File Warning] Failed to parse client_secret.json: {e}")
    return "", "", []


def update_env_refresh_token(new_refresh_token):
    """
    Safely updates or sets GMAIL_REFRESH_TOKEN in the local .env file
    and runtime os.environ without disturbing other environment variables.
    """
    if not new_refresh_token:
        return False

    clean_token = str(new_refresh_token).strip().strip("'\"")
    os.environ["GMAIL_REFRESH_TOKEN"] = clean_token
    os.environ["GOOGLE_REFRESH_TOKEN"] = clean_token

    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    try:
        lines = []
        found = False
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    stripped = line.strip()
                    if stripped.startswith("GMAIL_REFRESH_TOKEN=") or stripped.startswith("GOOGLE_REFRESH_TOKEN="):
                        lines.append(f"GMAIL_REFRESH_TOKEN={clean_token}\n")
                        found = True
                    else:
                        lines.append(line)
        if not found:
            lines.append(f"\nGMAIL_REFRESH_TOKEN={clean_token}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        logger.info("[Gmail Environment] GMAIL_REFRESH_TOKEN successfully updated in .env")
        return True
    except Exception as e:
        logger.warning(f"[Gmail Environment Update Error] Failed to write token to .env: {e}")
        return False


_last_oauth_failure_time = 0
_last_oauth_error = None


def get_gmail_credentials():
    """
    Resolves and validates Gmail OAuth credentials from environment variables
    with multi-key fallback, sanitization, client_secret.json fallback,
    and fast-failure caching to prevent server thread blocking.
    """
    global _last_oauth_failure_time, _last_oauth_error
    import time
    now = time.time()
    if _last_oauth_error and (now - _last_oauth_failure_time < 30):
        raise RuntimeError(f"Gmail OAuth token invalid or expired: {_last_oauth_error}")

    client_id = _get_clean_env_val(GMAIL_CLIENT_ID_KEYS)
    client_secret = _get_clean_env_val(GMAIL_CLIENT_SECRET_KEYS)
    refresh_token = _get_clean_env_val(GMAIL_REFRESH_TOKEN_KEYS)

    if not client_id or not client_secret:
        f_cid, f_cs, _ = _load_client_secret_file()
        if not client_id and f_cid:
            client_id = f_cid.strip().strip("'\"")
        if not client_secret and f_cs:
            client_secret = f_cs.strip().strip("'\"")

    missing = []
    if not refresh_token:
        missing.append("GMAIL_REFRESH_TOKEN")
    if not client_id:
        missing.append("GMAIL_CLIENT_ID")
    if not client_secret:
        missing.append("GMAIL_CLIENT_SECRET")

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
        try:
            import requests
            session = requests.Session()
            session.request = lambda method, url, **kwargs: requests.Session.request(session, method, url, timeout=kwargs.pop('timeout', 4), **kwargs)
            req = Request(session=session)
            credentials.refresh(req)
        except Exception as e:
            _last_oauth_failure_time = time.time()
            _last_oauth_error = str(e)
            raise

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


def send_via_gmail_api(subject, text_body, html_body=None, to_emails=None, cc_emails=None, reply_to=None):
    """
    Dispatches email using the official Google Gmail REST API (OAuth2).
    """
    sender = _get_clean_env_val(GMAIL_USER_KEYS, default=DEFAULT_OFFICIAL_EMAIL)
    recipients = [to_emails] if isinstance(to_emails, str) else list(to_emails or [sender])
    recipients = [r.strip() for r in recipients if r and "@" in r]
    if not recipients:
        recipients = [sender]

    if html_body:
        message = MIMEMultipart("alternative")
        message.attach(MIMEText(text_body, "plain", "utf-8"))
        message.attach(MIMEText(html_body, "html", "utf-8"))
    else:
        message = MIMEText(text_body, "plain", "utf-8")

    message["to"] = ", ".join(recipients)
    message["from"] = sender
    message["subject"] = subject
    if reply_to:
        message["Reply-To"] = reply_to
    if cc_emails:
        ccs = [cc_emails] if isinstance(cc_emails, str) else list(cc_emails)
        ccs = [c.strip() for c in ccs if c and "@" in c]
        if ccs:
            message["cc"] = ", ".join(ccs)

    service = get_gmail_service()
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

    service.users().messages().send(
        userId="me",
        body={"raw": raw_message}
    ).execute()

    logger.info(f"[GMAIL API SUCCESS] Email delivered via Gmail API to {recipients} | Subject: {subject}")
    return True


def send_via_gmail_smtp(subject, text_body, html_body=None, to_emails=None, cc_emails=None, reply_to=None):
    """
    Dispatches email using Gmail SMTP (smtp.gmail.com:587 STARTTLS or 465 SSL)
    with a Google App Password or SMTP credentials.
    This provides permanent reliability without 7-day testing token expirations.
    """
    sender = _get_clean_env_val(GMAIL_USER_KEYS, default=DEFAULT_OFFICIAL_EMAIL)
    app_password = _get_clean_env_val(GMAIL_APP_PASS_KEYS)
    if not app_password:
        raise RuntimeError("Missing Gmail App Password / SMTP_PASS in environment.")

    host = _get_clean_env_val(SMTP_HOST_KEYS, default=DEFAULT_SMTP_HOST)
    try:
        port = int(_get_clean_env_val(SMTP_PORT_KEYS, default=str(DEFAULT_SMTP_PORT)))
    except ValueError:
        port = DEFAULT_SMTP_PORT

    recipients = [to_emails] if isinstance(to_emails, str) else list(to_emails or [sender])
    recipients = [r.strip() for r in recipients if r and "@" in r]
    if not recipients:
        recipients = [sender]

    all_destinations = list(recipients)

    if html_body:
        message = MIMEMultipart("alternative")
        message.attach(MIMEText(text_body, "plain", "utf-8"))
        message.attach(MIMEText(html_body, "html", "utf-8"))
    else:
        message = MIMEText(text_body, "plain", "utf-8")

    message["to"] = ", ".join(recipients)
    message["from"] = sender
    message["subject"] = subject
    if reply_to:
        message["Reply-To"] = reply_to
    if cc_emails:
        ccs = [cc_emails] if isinstance(cc_emails, str) else list(cc_emails)
        ccs = [c.strip() for c in ccs if c and "@" in c]
        if ccs:
            message["cc"] = ", ".join(ccs)
            all_destinations.extend(ccs)

    # Clean password of any spaces (Google shows 16-char passwords as 4x4 with spaces)
    clean_pass = app_password.replace(" ", "")

    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=15) as server:
            server.login(sender, clean_pass)
            server.sendmail(sender, all_destinations, message.as_string())
    else:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender, clean_pass)
            server.sendmail(sender, all_destinations, message.as_string())

    logger.info(f"[GMAIL SMTP SUCCESS] Email delivered via Gmail SMTP to {all_destinations} | Subject: {subject}")
    return True


def send_email(subject, body, to_email=None, html_body=None, cc_emails=None, reply_to=None):
    """
    Unified dual-engine email sender for TheCampusNova:
    1. Tries Gmail REST API (OAuth2) if configured and valid.
    2. Seamlessly falls back to Gmail SMTP (App Password) if OAuth token is expired or revoked.
    3. If neither is functional, raises a clear error for administrative resolution.
    """
    errors = []

    # Attempt 1: Gmail REST API (OAuth2)
    has_oauth = bool(
        _get_clean_env_val(GMAIL_REFRESH_TOKEN_KEYS) and
        (_get_clean_env_val(GMAIL_CLIENT_ID_KEYS) or _load_client_secret_file()[0])
    )
    if has_oauth:
        try:
            return send_via_gmail_api(
                subject=subject,
                text_body=body,
                html_body=html_body,
                to_emails=to_email,
                cc_emails=cc_emails,
                reply_to=reply_to
            )
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"[Gmail Dispatch] OAuth2 API delivery attempt failed: {err_msg}")
            errors.append(f"Gmail API Error: {err_msg}")

    # Attempt 2: Gmail SMTP / Google App Password
    has_smtp = bool(_get_clean_env_val(GMAIL_APP_PASS_KEYS))
    if has_smtp:
        try:
            return send_via_gmail_smtp(
                subject=subject,
                text_body=body,
                html_body=html_body,
                to_emails=to_email,
                cc_emails=cc_emails,
                reply_to=reply_to
            )
        except Exception as e:
            err_msg = str(e)
            logger.error(f"[Gmail Dispatch] SMTP delivery attempt failed: {err_msg}")
            errors.append(f"Gmail SMTP Error: {err_msg}")

    # Neither succeeded
    detail = " | ".join(errors) if errors else "No valid Gmail credentials (neither active OAuth2 refresh token nor Google App Password) configured."
    logger.error(f"[Email Dispatch Failed] {detail}")
    raise RuntimeError(f"Email delivery failed: {detail}")


def check_gmail_status():
    """
    Comprehensive diagnostic helper for administrative verification.
    Reports OAuth2 status, SMTP/App Password status, and active delivery mechanism
    without exposing any secret tokens or passwords.
    """
    client_id = _get_clean_env_val(GMAIL_CLIENT_ID_KEYS)
    client_secret = _get_clean_env_val(GMAIL_CLIENT_SECRET_KEYS)
    refresh_token = _get_clean_env_val(GMAIL_REFRESH_TOKEN_KEYS)
    app_password = _get_clean_env_val(GMAIL_APP_PASS_KEYS)
    sender = _get_clean_env_val(GMAIL_USER_KEYS, default=DEFAULT_OFFICIAL_EMAIL)
    smtp_host = _get_clean_env_val(SMTP_HOST_KEYS, default=DEFAULT_SMTP_HOST)

    if not client_id or not client_secret:
        f_cid, f_cs, _ = _load_client_secret_file()
        if not client_id and f_cid:
            client_id = f_cid
        if not client_secret and f_cs:
            client_secret = f_cs

    status = {
        "sender_email": sender,
        "oauth2": {
            "client_id_configured": bool(client_id),
            "client_secret_configured": bool(client_secret),
            "refresh_token_configured": bool(refresh_token),
            "initialized": False,
            "error": None
        },
        "smtp": {
            "host": smtp_host,
            "app_password_configured": bool(app_password),
            "initialized": False,
            "error": None
        },
        "active_method": None,
        "is_operational": False
    }

    # Test OAuth2
    if client_id and client_secret and refresh_token:
        try:
            creds = get_gmail_credentials()
            if creds and creds.valid:
                status["oauth2"]["initialized"] = True
                status["active_method"] = "Gmail REST API (OAuth2)"
                status["is_operational"] = True
        except Exception as e:
            status["oauth2"]["error"] = str(e)

    # Test SMTP / App Password
    if app_password:
        try:
            clean_pass = app_password.replace(" ", "")
            with smtplib.SMTP(smtp_host, 587, timeout=6) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(sender, clean_pass)
                status["smtp"]["initialized"] = True
                if not status["active_method"]:
                    status["active_method"] = "Gmail SMTP (App Password)"
                status["is_operational"] = True
        except Exception as e:
            status["smtp"]["error"] = str(e)

    return status
