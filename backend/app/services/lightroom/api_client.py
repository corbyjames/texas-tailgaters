"""
Adobe Lightroom API Client
Handles all interactions with Lightroom Cloud API
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

class LightroomAPIClient:
    """Client for interacting with Adobe Lightroom API"""
    
    BASE_URL = "https://lr.adobe.io/v2/"
    
    def __init__(self, access_token: str, api_key: str):
        self.access_token = access_token
        self.api_key = api_key
        self.http_client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-API-Key": api_key
            },
            timeout=30.0
        )
    
    async def get_account(self) -> Dict[str, Any]:
        """Get user account information"""
        response = await self.http_client.get(urljoin(self.BASE_URL, "account"))
        response.raise_for_status()
        return response.json()
    
    async def get_catalog(self) -> Dict[str, Any]:
        """Get the user's catalog information"""
        response = await self.http_client.get(urljoin(self.BASE_URL, "catalog"))
        response.raise_for_status()
        return response.json()
    
    async def get_albums(
        self, 
        catalog_id: str,
        limit: int = 100,
        after_cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get albums from the catalog
        Returns paginated results with albums and pagination info
        """
        params = {"limit": limit}
        if after_cursor:
            params["after"] = after_cursor
        
        response = await self.http_client.get(
            urljoin(self.BASE_URL, f"catalogs/{catalog_id}/albums"),
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    async def get_album_assets(
        self,
        catalog_id: str,
        album_id: str,
        limit: int = 100,
        after_cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get assets (photos) from a specific album
        Returns paginated results with assets and pagination info
        """
        params = {"limit": limit}
        if after_cursor:
            params["after"] = after_cursor
        
        response = await self.http_client.get(
            urljoin(self.BASE_URL, f"catalogs/{catalog_id}/albums/{album_id}/assets"),
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    async def get_asset(
        self,
        catalog_id: str,
        asset_id: str
    ) -> Dict[str, Any]:
        """Get detailed information about a specific asset"""
        response = await self.http_client.get(
            urljoin(self.BASE_URL, f"catalogs/{catalog_id}/assets/{asset_id}")
        )
        response.raise_for_status()
        return response.json()
    
    async def get_asset_rendition(
        self,
        catalog_id: str,
        asset_id: str,
        rendition_type: str = "2048"
    ) -> str:
        """
        Get a rendition URL for an asset
        rendition_type options: "thumbnail2x", "640", "1280", "2048", "full"
        """
        response = await self.http_client.get(
            urljoin(self.BASE_URL, f"catalogs/{catalog_id}/assets/{asset_id}/renditions/{rendition_type}")
        )
        response.raise_for_status()
        
        # The response contains a redirect URL to the actual image
        rendition_data = response.json()
        return rendition_data.get("href", "")
    
    async def get_asset_metadata(
        self,
        catalog_id: str,
        asset_id: str
    ) -> Dict[str, Any]:
        """Get metadata for a specific asset including EXIF, keywords, etc."""
        response = await self.http_client.get(
            urljoin(self.BASE_URL, f"catalogs/{catalog_id}/assets/{asset_id}/metadata")
        )
        response.raise_for_status()
        return response.json()
    
    async def update_asset_metadata(
        self,
        catalog_id: str,
        asset_id: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update metadata for an asset (keywords, description, etc.)
        For MVP we'll focus on read-only, but this is here for future use
        """
        response = await self.http_client.put(
            urljoin(self.BASE_URL, f"catalogs/{catalog_id}/assets/{asset_id}/metadata"),
            json=metadata
        )
        response.raise_for_status()
        return response.json()
    
    async def get_all_albums(self, catalog_id: str) -> List[Dict[str, Any]]:
        """Get all albums from catalog (handling pagination)"""
        all_albums = []
        after_cursor = None
        
        while True:
            result = await self.get_albums(catalog_id, after_cursor=after_cursor)
            albums = result.get("resources", [])
            all_albums.extend(albums)
            
            # Check for more pages
            links = result.get("links", {})
            if "next" in links:
                after_cursor = links["next"].get("after")
            else:
                break
        
        logger.info(f"Retrieved {len(all_albums)} albums from catalog")
        return all_albums
    
    async def get_all_album_assets(
        self, 
        catalog_id: str, 
        album_id: str
    ) -> List[Dict[str, Any]]:
        """Get all assets from an album (handling pagination)"""
        all_assets = []
        after_cursor = None
        
        while True:
            result = await self.get_album_assets(
                catalog_id, 
                album_id, 
                after_cursor=after_cursor
            )
            assets = result.get("resources", [])
            all_assets.extend(assets)
            
            # Check for more pages
            links = result.get("links", {})
            if "next" in links:
                after_cursor = links["next"].get("after")
            else:
                break
        
        logger.info(f"Retrieved {len(all_assets)} assets from album {album_id}")
        return all_assets
    
    async def download_rendition(
        self,
        rendition_url: str,
        save_path: Optional[str] = None
    ) -> bytes:
        """Download image data from a rendition URL"""
        response = await self.http_client.get(rendition_url)
        response.raise_for_status()
        
        image_data = response.content
        
        if save_path:
            with open(save_path, 'wb') as f:
                f.write(image_data)
            logger.info(f"Saved image to {save_path}")
        
        return image_data
    
    async def close(self):
        """Close the HTTP client"""
        await self.http_client.aclose()