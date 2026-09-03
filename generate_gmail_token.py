from google_auth_oauthlib.flow import InstalledAppFlow

CLIENT_SECRET_FILE = "client_secret.json"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]

flow = InstalledAppFlow.from_client_secrets_file(
    CLIENT_SECRET_FILE,
    SCOPES
)

creds = flow.run_local_server(
    port=8000,
    access_type="offline",
    prompt="consent"
)

print("\nAuthorization successful!")
print("CLIENT_ID:", creds.client_id)
print("CLIENT_SECRET:", creds.client_secret)
print("REFRESH_TOKEN:", creds.refresh_token)