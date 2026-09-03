import os
import base64
from email.mime.text import MIMEText

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def get_gmail_service():
    credentials = Credentials(
        token=None,
        refresh_token=os.getenv("GMAIL_REFRESH_TOKEN"),
        client_id=os.getenv("GMAIL_CLIENT_ID"),
        client_secret=os.getenv("GMAIL_CLIENT_SECRET"),
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES
    )

    if not credentials.valid:
        credentials.refresh(Request())

    return build("gmail", "v1", credentials=credentials)


def send_email(subject, body, to_email=None):
    service = get_gmail_service()

    sender = os.getenv("GMAIL_USER")
    recipient = to_email or sender

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

