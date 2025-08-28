"""
Adobe Lightroom OAuth 2.0 Authentication Service
Handles authentication flow with Adobe Creative Cloud
"""
import secrets
import hashlib
import base64
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)

class LightroomAuth:
    """Handle Adobe OAuth 2.0 authentication for Lightroom API access"""
    
    ADOBE_AUTH_URL = "https://ims-na1.adobelogin.com/ims/authorize/v2"
    ADOBE_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3"
    ADOBE_API_BASE = "https://lr.adobe.io"
    
    SCOPES = [
        "openid",
        "creative_sdk",
        "lr_partner_apis",
        "lr_partner_apis_ro"  # Read-only access for MVP
    ]
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.http_client = httpx.AsyncClient()
        
    def generate_pkce_challenge(self) -> tuple[str, str]:
        """Generate PKCE code verifier and challenge for secure OAuth flow"""
        verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(verifier.encode()).digest()
        ).decode('utf-8').rstrip('=')
        return verifier, challenge
    
    def get_authorization_url(self, state: str) -> tuple[str, str]:
        """
        Generate the authorization URL for user consent
        Returns: (authorization_url, code_verifier)
        """
        code_verifier, code_challenge = self.generate_pkce_challenge()
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.SCOPES),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
        
        auth_url = f"{self.ADOBE_AUTH_URL}?{urlencode(params)}"
        return auth_url, code_verifier
    
    async def exchange_code_for_token(
        self, 
        code: str, 
        code_verifier: str
    ) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        data = {
            "grant_type": "authorization_code",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "code_verifier": code_verifier,
            "redirect_uri": self.redirect_uri
        }
        
        try:
            response = await self.http_client.post(
                self.ADOBE_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Add expiration timestamp
            if "expires_in" in token_data:
                token_data["expires_at"] = (
                    datetime.utcnow() + timedelta(seconds=token_data["expires_in"])
                ).isoformat()
            
            logger.info("Successfully obtained Adobe access token")
            return token_data
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to exchange code for token: {e}")
            raise
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh an expired access token"""
        data = {
            "grant_type": "refresh_token",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token
        }
        
        try:
            response = await self.http_client.post(
                self.ADOBE_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Add expiration timestamp
            if "expires_in" in token_data:
                token_data["expires_at"] = (
                    datetime.utcnow() + timedelta(seconds=token_data["expires_in"])
                ).isoformat()
            
            logger.info("Successfully refreshed Adobe access token")
            return token_data
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to refresh token: {e}")
            raise
    
    async def revoke_token(self, token: str, token_type: str = "access_token") -> bool:
        """Revoke an access or refresh token"""
        data = {
            "token": token,
            "token_type_hint": token_type,
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        try:
            response = await self.http_client.post(
                f"{self.ADOBE_TOKEN_URL}/revoke",
                data=data
            )
            response.raise_for_status()
            logger.info(f"Successfully revoked {token_type}")
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to revoke token: {e}")
            return False
    
    async def validate_token(self, access_token: str) -> bool:
        """Validate if an access token is still valid"""
        try:
            response = await self.http_client.get(
                f"{self.ADOBE_API_BASE}/v2/account",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-API-Key": self.client_id
                }
            )
            return response.status_code == 200
            
        except httpx.HTTPError:
            return False
    
    async def close(self):
        """Close the HTTP client"""
        await self.http_client.aclose()