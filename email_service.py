import os
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


def get_gmail_service():
    refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")
    client_id = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")

    missing = []
    if not refresh_token: missing.append("GMAIL_REFRESH_TOKEN")
    if not client_id: missing.append("GMAIL_CLIENT_ID")
    if not client_secret: missing.append("GMAIL_CLIENT_SECRET")
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

    return build("gmail", "v1", credentials=credentials)


def send_email(subject, body, to_email=None):
    sender = os.getenv("GMAIL_USER")
    if not sender:
        raise RuntimeError("Missing required environment variable: GMAIL_USER")

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

    return True

