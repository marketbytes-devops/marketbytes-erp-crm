from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from cryptography.fernet import Fernet
import os
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import redirect
from django.core.signing import Signer, BadSignature
from django.contrib.auth import get_user_model

# Load Fernet for encrypting refresh token using Django settings
fernet_key = getattr(settings, 'FERNET_KEY', None)
if not fernet_key:
    raise ImproperlyConfigured('FERNET_KEY is not configured. Add it to your .env or environment.')
if isinstance(fernet_key, str):
    fernet_key = fernet_key.encode()
fernet = Fernet(fernet_key)
User = get_user_model()
signer = Signer()

# ALLOW HTTP FOR LOCALHOST (Fixes "insecure_transport" error)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connect_gmail(request):
    """
    Returns the Google authorization URL for the frontend to redirect to.
    Embeds user ID in state for stateless verification.
    """
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GMAIL_CLIENT_ID,
                "client_secret": settings.GMAIL_CLIENT_SECRET,
                "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=['https://mail.google.com/']
    )
    
    # Sign the user ID to create a secure state parameter
    # This allows us to identify the user in the callback without cookies/sessions
    user_id_signed = signer.sign(str(request.user.id))
    
    flow.redirect_uri = settings.GMAIL_REDIRECT_URI
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=user_id_signed  # Use our signed user ID as state
    )
    
    print(f"DEBUG: Generated Auth URL for user {request.user.id}")
    return Response({'auth_url': authorization_url})


@api_view(['GET'])
@permission_classes([AllowAny]) # Allow Google to call this without JWT
def gmail_callback(request):
    """
    Handles the redirect from Google.
    Decodes user ID from state parameter.
    """
    received_state = request.GET.get('state')
    
    if not received_state:
        return Response({'error': 'Missing state parameter'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Verify signature and recover user ID
        user_id = signer.unsign(received_state)
        user = User.objects.get(id=user_id)
    except BadSignature:
        return Response({'error': 'Invalid state signature'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GMAIL_CLIENT_ID,
                "client_secret": settings.GMAIL_CLIENT_SECRET,
                "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=['https://mail.google.com/'],
        state=received_state
    )
    
    # CRITICAL FIX: Must explicitly set redirect_uri to match the one used in connect_gmail
    flow.redirect_uri = settings.GMAIL_REDIRECT_URI
    
    try:
        # Use simple authorization_response string to avoid potential URL parsing issues
        flow.fetch_token(authorization_response=request.build_absolute_uri())
        credentials = flow.credentials
        
        # Encrypt refresh token
        encrypted_refresh = fernet.encrypt(credentials.refresh_token.encode()).decode()

        # Save to user
        user.gmail_access_token = credentials.token
        user.gmail_refresh_token = encrypted_refresh
        user.gmail_token_expiry = credentials.expiry
        user.save()
        
        print(f"DEBUG: Gmail connected successfully for user {user.email}")
        
    except Exception as e:
        print(f"ERROR in callback: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Redirect back to frontend
    # Using the frontend URL from settings if available, else localhost default
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return redirect(f'{frontend_url}/sales/communication-tools')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gmail_status(request):
    """
    Returns whether the user has connected Gmail
    """
    connected = bool(request.user.gmail_refresh_token)
    return Response({'connected': connected})

# --- NEW IMPORTS ---
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sent_emails(request):
    """
    Fetches the last 10 sent emails from the user's Gmail account.
    """
    user = request.user
    if not user.gmail_refresh_token:
        return Response({'error': 'Gmail not connected'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 1. Decrypt Refresh Token
        refresh_token = fernet.decrypt(user.gmail_refresh_token.encode()).decode()
        
        # 2. Reconstruct Credentials
        creds = Credentials(
            token=user.gmail_access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GMAIL_CLIENT_ID,
            client_secret=settings.GMAIL_CLIENT_SECRET
        )

        # 3. Refresh Token if Expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Save new access token
            user.gmail_access_token = creds.token
            user.save()

        # 4. Build Gmail Service
        service = build('gmail', 'v1', credentials=creds)

        # 5. Fetch Sent Messages
        results = service.users().messages().list(userId='me', q='label:SENT', maxResults=10).execute()
        messages = results.get('messages', [])

        email_list = []
        for msg in messages:
            msg_detail = service.users().messages().get(userId='me', id=msg['id'], format='metadata').execute()
            headers = msg_detail['payload']['headers']
            
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(No Subject)')
            to = next((h['value'] for h in headers if h['name'] == 'To'), '(No Recipient)')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '')

            email_list.append({
                'id': msg['id'],
                'subject': subject,
                'to': to,
                'date': date,
                'snippet': msg_detail.get('snippet', '')
            })

        return Response(email_list)

    except Exception as e:
        print(f"Error fetching emails: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disconnect_gmail(request):
    """
    Disconnects the user's Gmail account by clearing tokens.
    """
    user = request.user
    user.gmail_access_token = None
    user.gmail_refresh_token = None
    user.gmail_token_expiry = None
    user.save()
    return Response({'message': 'Gmail disconnected successfully'})

# --- NEW IMPORTS FOR SENDING ---
from email.mime.text import MIMEText
import base64

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_gmail_email(request):
    """
    Sends an email using the user's Gmail account.
    """
    user = request.user
    if not user.gmail_refresh_token:
        return Response({'error': 'Gmail not connected'}, status=status.HTTP_400_BAD_REQUEST)

    to_email = request.data.get('to')
    subject = request.data.get('subject')
    message_text = request.data.get('body') or request.data.get('message') # Support both keys
    cc_email = request.data.get('cc', '')
    bcc_email = request.data.get('bcc', '')

    if not to_email or not subject or not message_text:
        return Response({'error': 'Missing required fields (to, subject, body)'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 1. Decrypt & Refresh Token (Same logic as fetching)
        refresh_token = fernet.decrypt(user.gmail_refresh_token.encode()).decode()
        
        creds = Credentials(
            token=user.gmail_access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GMAIL_CLIENT_ID,
            client_secret=settings.GMAIL_CLIENT_SECRET
        )

        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            user.gmail_access_token = creds.token
            user.save()

        service = build('gmail', 'v1', credentials=creds)

        # 2. Create Email Message
        message = MIMEText(message_text)
        message['to'] = to_email
        message['subject'] = subject
        if cc_email:
            message['cc'] = cc_email
        if bcc_email:
            message['bcc'] = bcc_email
            
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        body = {'raw': raw}

        # 3. Send via Gmail API
        sent_message = service.users().messages().send(userId='me', body=body).execute()

        return Response({'message': 'Email sent successfully', 'id': sent_message['id']})

    except Exception as e:
        print(f"Error sending email: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)