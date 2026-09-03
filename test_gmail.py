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


def send_test_email():
    service = get_gmail_service()

    sender = os.getenv("GMAIL_USER")

    message = MIMEText(
        """Hello,

This is a test email from TheCampusNova backend.

Gmail API integration is working successfully.

Regards,
TheCampusNova
"""
    )

    message["to"] = sender
    message["from"] = sender
    message["subject"] = "TheCampusNova | Gmail API Test"

    raw_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    service.users().messages().send(
        userId="me",
        body={"raw": raw_message}
    ).execute()

    print("TEST EMAIL SENT SUCCESSFULLY!")


if __name__ == "__main__":
    send_test_email()