from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from django.http import JsonResponse, HttpResponseRedirect
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from cryptography.fernet import Fernet
import secrets
import base64

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
]

@api_view(["GET"])
def gmail_connect(request):
    flow = InstalledAppFlow.from_client_config(
        {
            "web": {
                "client_id": settings.GMAIL_CLIENT_ID,
                "client_secret": settings.GMAIL_CLIENT_SECRET,
                "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )

    # Manually generate state
    state = secrets.token_urlsafe(16)
    auth_url, _ = flow.authorization_url(prompt="consent", state=state)

    # Store state in session for verification in callback
    request.session["gmail_state"] = state

    return JsonResponse({"auth_url": auth_url})

@api_view(["GET"])
def gmail_callback(request):
    state = request.session.get("gmail_state")
    if not state:
        return JsonResponse({"error": "Invalid state"}, status=400)

    # Verify state matches (CSRF protection)
    if state != request.GET.get("state"):
        return JsonResponse({"error": "State mismatch"}, status=400)

    flow = InstalledAppFlow.from_client_config(
        {
            "web": {
                "client_id": settings.GMAIL_CLIENT_ID,
                "client_secret": settings.GMAIL_CLIENT_SECRET,
                "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )

    flow.fetch_token(authorization_response=request.build_absolute_uri())

    credentials = flow.credentials

    # Encrypt refresh token
    fernet = Fernet(settings.FERNET_KEY)
    encrypted_refresh = fernet.encrypt(credentials.refresh_token.encode()).decode()

    # Save to user
    request.user.gmail_refresh_token = encrypted_refresh
    request.user.gmail_access_token = credentials.token
    request.user.gmail_token_expiry = credentials.expiry
    request.user.save()

    # Clean session
    request.session.pop("gmail_state", None)

    return HttpResponseRedirect("http://localhost:3000/communication")

@api_view(["GET"])
def gmail_status(request):
    return Response({"connected": bool(request.user.gmail_refresh_token)})

@api_view(["GET"])
def gmail_sent_emails(request):
    if not request.user.gmail_refresh_token:
        return Response({"error": "Gmail not connected"}, status=403)

    fernet = Fernet(settings.FERNET_KEY)
    refresh_token = fernet.decrypt(request.user.gmail_refresh_token.encode()).decode()

    credentials = Credentials(
        token=request.user.gmail_access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GMAIL_CLIENT_ID,
        client_secret=settings.GMAIL_CLIENT_SECRET,
        scopes=SCOPES,
    )

    # Refresh if expired
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        request.user.gmail_access_token = credentials.token
        request.user.gmail_token_expiry = credentials.expiry
        request.user.save()

    service = build("gmail", "v1", credentials=credentials)
    results = service.users().messages().list(userId="me", labelIds=["SENT"]).execute()
    messages = results.get("messages", [])
    emails = []
    for msg in messages[:10]:
        msg_data = service.users().messages().get(userId="me", id=msg["id"], format="minimal").execute()
        headers = msg_data["payload"]["headers"]
        to = next((h["value"] for h in headers if h["name"] == "To"), "—")
        subject = next((h["value"] for h in headers if h["name"] == "Subject"), "—")
        sent_at = msg_data["internalDate"]
        emails.append({
            "id": msg["id"],
            "to": to,
            "subject": subject,
            "sent_at": sent_at,
        })
    return Response(emails)

@api_view(["POST"])
def gmail_send(request):
    if not request.user.gmail_refresh_token:
        return Response({"error": "Gmail not connected"}, status=403)

    fernet = Fernet(settings.FERNET_KEY)
    refresh_token = fernet.decrypt(request.user.gmail_refresh_token.encode()).decode()

    credentials = Credentials(
        token=request.user.gmail_access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GMAIL_CLIENT_ID,
        client_secret=settings.GMAIL_CLIENT_SECRET,
        scopes=SCOPES,
    )

    if credentials.expired:
        credentials.refresh(Request())
        request.user.gmail_access_token = credentials.token
        request.user.gmail_token_expiry = credentials.expiry
        request.user.save()

    service = build("gmail", "v1", credentials=credentials)

    raw_message = (
        f"To: {request.data['to']}\r\n"
        f"Cc: {request.data.get('cc', '')}\r\n"
        f"Bcc: {request.data.get('bcc', '')}\r\n"
        f"Subject: {request.data['subject']}\r\n\r\n"
        f"{request.data['body']}"
    ).encode("utf-8")

    message = {"raw": base64.urlsafe_b64encode(raw_message).decode("utf-8")}

    service.users().messages().send(userId="me", body=message).execute()
    return Response({"status": "sent"})

@api_view(["POST"])
def gmail_disconnect(request):
    request.user.gmail_refresh_token = None
    request.user.gmail_access_token = None
    request.user.gmail_token_expiry = None
    request.user.save()
    return Response({"status": "disconnected"})