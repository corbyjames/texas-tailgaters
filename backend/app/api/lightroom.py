"""
Lightroom Integration API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import RedirectResponse
from typing import Optional, Dict, Any, List
from datetime import datetime
import secrets
import logging
from app.core.config import settings
from app.services.lightroom import LightroomAuth, LightroomAPIClient, LightroomSyncService
from app.services.storage import StorageService
from app.services.cache import CacheService

logger = logging.getLogger(__name__)

router = APIRouter()

# Store OAuth state and code verifiers temporarily (use Redis in production)
oauth_states = {}

def get_lightroom_auth() -> LightroomAuth:
    """Get Lightroom auth service instance"""
    return LightroomAuth(
        client_id=settings.ADOBE_CLIENT_ID,
        client_secret=settings.ADOBE_CLIENT_SECRET,
        redirect_uri=settings.ADOBE_REDIRECT_URI
    )

@router.get("/auth/connect")
async def connect_lightroom(
    auth_service: LightroomAuth = Depends(get_lightroom_auth)
):
    """
    Initiate OAuth flow with Adobe Lightroom
    Returns the authorization URL for the user to visit
    """
    # Generate a secure random state
    state = secrets.token_urlsafe(32)
    
    # Get authorization URL and code verifier
    auth_url, code_verifier = auth_service.get_authorization_url(state)
    
    # Store state and verifier temporarily (should use Redis in production)
    oauth_states[state] = {
        "code_verifier": code_verifier,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return {
        "auth_url": auth_url,
        "state": state,
        "message": "Visit the auth_url to connect your Adobe account"
    }

@router.get("/auth/callback")
async def lightroom_callback(
    code: str = Query(...),
    state: str = Query(...),
    auth_service: LightroomAuth = Depends(get_lightroom_auth),
    cache_service: CacheService = Depends(CacheService)
):
    """
    Handle OAuth callback from Adobe
    Exchange authorization code for access token
    """
    # Verify state
    if state not in oauth_states:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    state_data = oauth_states.pop(state)
    code_verifier = state_data["code_verifier"]
    
    try:
        # Exchange code for token
        token_data = await auth_service.exchange_code_for_token(code, code_verifier)
        
        # Store tokens securely (using cache for MVP, use database in production)
        cache_key = "lightroom:tokens:default"  # In production, use user ID
        await cache_service.set(cache_key, token_data, expire=3600)  # 1 hour
        
        # Store refresh token separately with longer expiration
        refresh_key = "lightroom:refresh:default"
        await cache_service.set(
            refresh_key, 
            token_data.get("refresh_token"),
            expire=2592000  # 30 days
        )
        
        return {
            "success": True,
            "message": "Successfully connected to Adobe Lightroom",
            "account_id": token_data.get("account", {}).get("id")
        }
        
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/auth/status")
async def auth_status(
    auth_service: LightroomAuth = Depends(get_lightroom_auth),
    cache_service: CacheService = Depends(CacheService)
):
    """Check if user is authenticated with Lightroom"""
    cache_key = "lightroom:tokens:default"
    token_data = await cache_service.get(cache_key)
    
    if not token_data:
        return {"connected": False}
    
    # Validate token
    is_valid = await auth_service.validate_token(token_data.get("access_token"))
    
    if not is_valid:
        # Try to refresh
        refresh_key = "lightroom:refresh:default"
        refresh_token = await cache_service.get(refresh_key)
        
        if refresh_token:
            try:
                new_token_data = await auth_service.refresh_access_token(refresh_token)
                await cache_service.set(cache_key, new_token_data, expire=3600)
                is_valid = True
            except:
                is_valid = False
    
    return {
        "connected": is_valid,
        "account_id": token_data.get("account", {}).get("id") if is_valid else None
    }

@router.get("/catalog")
async def get_catalog(
    cache_service: CacheService = Depends(CacheService)
):
    """Get user's Lightroom catalog information"""
    # Get access token
    token_data = await cache_service.get("lightroom:tokens:default")
    if not token_data:
        raise HTTPException(status_code=401, detail="Not authenticated with Lightroom")
    
    api_client = LightroomAPIClient(
        access_token=token_data["access_token"],
        api_key=settings.ADOBE_CLIENT_ID
    )
    
    try:
        catalog = await api_client.get_catalog()
        return catalog
    finally:
        await api_client.close()

@router.get("/albums")
async def get_albums(
    cache_service: CacheService = Depends(CacheService)
):
    """Get list of albums from Lightroom"""
    # Get access token
    token_data = await cache_service.get("lightroom:tokens:default")
    if not token_data:
        raise HTTPException(status_code=401, detail="Not authenticated with Lightroom")
    
    api_client = LightroomAPIClient(
        access_token=token_data["access_token"],
        api_key=settings.ADOBE_CLIENT_ID
    )
    
    try:
        # Get catalog first
        catalog = await api_client.get_catalog()
        catalog_id = catalog["id"]
        
        # Get all albums
        albums = await api_client.get_all_albums(catalog_id)
        
        # Format response
        album_list = []
        for album in albums:
            album_list.append({
                "id": album["id"],
                "name": album.get("name", "Untitled Album"),
                "asset_count": album.get("asset_count", 0),
                "created": album.get("created"),
                "updated": album.get("updated")
            })
        
        return {
            "catalog_id": catalog_id,
            "album_count": len(album_list),
            "albums": album_list
        }
        
    finally:
        await api_client.close()

@router.post("/sync/album/{album_id}")
async def sync_album(
    album_id: str,
    album_name: str = Query(...),
    cache_service: CacheService = Depends(CacheService),
    storage_service: StorageService = Depends(StorageService)
):
    """Sync a specific album from Lightroom"""
    # Get access token
    token_data = await cache_service.get("lightroom:tokens:default")
    if not token_data:
        raise HTTPException(status_code=401, detail="Not authenticated with Lightroom")
    
    api_client = LightroomAPIClient(
        access_token=token_data["access_token"],
        api_key=settings.ADOBE_CLIENT_ID
    )
    
    try:
        # Get catalog
        catalog = await api_client.get_catalog()
        catalog_id = catalog["id"]
        
        # Create sync service
        sync_service = LightroomSyncService(
            api_client=api_client,
            storage_service=storage_service,
            cache_service=cache_service
        )
        
        # Perform sync
        stats = await sync_service.sync_album(catalog_id, album_id, album_name)
        
        return stats
        
    finally:
        await api_client.close()

@router.get("/synced-albums")
async def get_synced_albums(
    storage_service: StorageService = Depends(StorageService),
    cache_service: CacheService = Depends(CacheService)
):
    """Get list of albums that have been synced to local storage"""
    # Get access token (to ensure connection)
    token_data = await cache_service.get("lightroom:tokens:default")
    if not token_data:
        # Can still show synced albums even if not currently connected
        pass
    
    api_client = LightroomAPIClient(
        access_token=token_data.get("access_token", ""),
        api_key=settings.ADOBE_CLIENT_ID
    ) if token_data else None
    
    try:
        sync_service = LightroomSyncService(
            api_client=api_client,
            storage_service=storage_service,
            cache_service=cache_service
        )
        
        albums = await sync_service.get_synced_albums()
        return {"albums": albums}
        
    finally:
        if api_client:
            await api_client.close()

@router.get("/album/{album_id}/assets")
async def get_album_assets(
    album_id: str,
    storage_service: StorageService = Depends(StorageService),
    cache_service: CacheService = Depends(CacheService)
):
    """Get assets from a synced album"""
    # Create sync service (doesn't need API client for reading synced data)
    sync_service = LightroomSyncService(
        api_client=None,
        storage_service=storage_service,
        cache_service=cache_service
    )
    
    assets = await sync_service.get_album_assets(album_id)
    
    # Add MinIO URLs for thumbnails
    for asset in assets:
        if asset.get("thumbnail_key"):
            asset["thumbnail_url"] = storage_service.get_image_url(
                asset["thumbnail_key"]
            )
    
    return {"assets": assets}

@router.get("/asset/{asset_id}")
async def get_asset_details(
    asset_id: str,
    storage_service: StorageService = Depends(StorageService),
    cache_service: CacheService = Depends(CacheService)
):
    """Get detailed information about a specific asset"""
    # Get access token for fetching high-res if needed
    token_data = await cache_service.get("lightroom:tokens:default")
    
    api_client = LightroomAPIClient(
        access_token=token_data["access_token"],
        api_key=settings.ADOBE_CLIENT_ID
    ) if token_data else None
    
    try:
        sync_service = LightroomSyncService(
            api_client=api_client,
            storage_service=storage_service,
            cache_service=cache_service
        )
        
        asset_data = await sync_service.get_asset_for_identification(asset_id)
        
        if not asset_data:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Don't return raw image data in JSON response
        if "image_data" in asset_data:
            asset_data["image_size"] = len(asset_data.pop("image_data"))
            asset_data["image_url"] = storage_service.get_image_url(
                asset_data["image_key"]
            )
        
        return asset_data
        
    finally:
        if api_client:
            await api_client.close()

@router.post("/disconnect")
async def disconnect_lightroom(
    auth_service: LightroomAuth = Depends(get_lightroom_auth),
    cache_service: CacheService = Depends(CacheService)
):
    """Disconnect from Adobe Lightroom"""
    # Get tokens
    token_data = await cache_service.get("lightroom:tokens:default")
    
    if token_data:
        # Revoke tokens
        await auth_service.revoke_token(
            token_data.get("access_token"),
            "access_token"
        )
        
        refresh_token = await cache_service.get("lightroom:refresh:default")
        if refresh_token:
            await auth_service.revoke_token(refresh_token, "refresh_token")
        
        # Clear cache
        await cache_service.delete("lightroom:tokens:default")
        await cache_service.delete("lightroom:refresh:default")
    
    return {"success": True, "message": "Disconnected from Adobe Lightroom"}