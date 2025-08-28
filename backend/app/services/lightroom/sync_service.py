"""
Lightroom Sync Service
Handles syncing photos from Lightroom to local storage using MinIO and Neo4j
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
import io
from app.services.storage import StorageService
from app.services.cache import CacheService
from app.core.database import get_neo4j_driver
from .api_client import LightroomAPIClient

logger = logging.getLogger(__name__)

class LightroomSyncService:
    """Service for syncing Lightroom photos to our storage"""
    
    def __init__(
        self, 
        api_client: LightroomAPIClient,
        storage_service: StorageService,
        cache_service: CacheService
    ):
        self.api_client = api_client
        self.storage = storage_service
        self.cache = cache_service
        self.neo4j_driver = get_neo4j_driver()
    
    async def sync_album(
        self,
        catalog_id: str,
        album_id: str,
        album_name: str
    ) -> Dict[str, Any]:
        """
        Sync a single album from Lightroom
        Returns sync statistics
        """
        logger.info(f"Starting sync for album: {album_name} ({album_id})")
        
        stats = {
            "album_id": album_id,
            "album_name": album_name,
            "total_assets": 0,
            "new_assets": 0,
            "skipped_assets": 0,
            "errors": 0,
            "start_time": datetime.utcnow().isoformat()
        }
        
        try:
            # Get all assets from the album
            assets = await self.api_client.get_all_album_assets(catalog_id, album_id)
            stats["total_assets"] = len(assets)
            
            for asset in assets:
                try:
                    synced = await self.sync_asset(
                        catalog_id,
                        asset,
                        album_id,
                        album_name
                    )
                    if synced:
                        stats["new_assets"] += 1
                    else:
                        stats["skipped_assets"] += 1
                        
                except Exception as e:
                    logger.error(f"Error syncing asset {asset.get('id')}: {e}")
                    stats["errors"] += 1
            
        except Exception as e:
            logger.error(f"Error syncing album {album_name}: {e}")
            stats["error_message"] = str(e)
        
        stats["end_time"] = datetime.utcnow().isoformat()
        
        # Store sync stats in Neo4j
        await self.store_sync_stats(stats)
        
        logger.info(f"Sync complete for album {album_name}: {stats}")
        return stats
    
    async def sync_asset(
        self,
        catalog_id: str,
        asset: Dict[str, Any],
        album_id: str,
        album_name: str
    ) -> bool:
        """
        Sync a single asset (photo)
        Returns True if newly synced, False if already exists
        """
        asset_id = asset.get("id")
        
        # Check if already synced using Neo4j
        if await self.asset_exists(asset_id):
            logger.debug(f"Asset {asset_id} already synced, skipping")
            return False
        
        # Get asset metadata
        metadata = await self.api_client.get_asset_metadata(catalog_id, asset_id)
        
        # Get thumbnail for quick display
        thumbnail_url = await self.api_client.get_asset_rendition(
            catalog_id, 
            asset_id, 
            "thumbnail2x"
        )
        
        # Download and store thumbnail
        thumbnail_data = await self.api_client.download_rendition(thumbnail_url)
        thumbnail_key = f"thumbnails/{asset_id}.jpg"
        await self.storage.upload_image(
            io.BytesIO(thumbnail_data),
            thumbnail_key
        )
        
        # Store asset information in Neo4j
        await self.store_asset_node(
            asset_id=asset_id,
            catalog_id=catalog_id,
            album_id=album_id,
            album_name=album_name,
            asset_data=asset,
            metadata=metadata,
            thumbnail_key=thumbnail_key
        )
        
        # Cache the rendition URLs for on-demand fetching
        rendition_urls = {
            "thumbnail": thumbnail_url,
            "640": None,  # Fetch on demand
            "2048": None,  # Fetch on demand for identification
            "full": None  # Fetch on demand if needed
        }
        
        cache_key = f"lightroom:renditions:{asset_id}"
        await self.cache.set(cache_key, json.dumps(rendition_urls), expire=86400)  # 24 hours
        
        logger.info(f"Synced asset {asset_id} from album {album_name}")
        return True
    
    async def asset_exists(self, asset_id: str) -> bool:
        """Check if an asset is already synced in Neo4j"""
        with self.neo4j_driver.session() as session:
            result = session.run(
                "MATCH (a:Asset {lightroom_id: $asset_id}) RETURN a LIMIT 1",
                asset_id=asset_id
            )
            return result.single() is not None
    
    async def store_asset_node(
        self,
        asset_id: str,
        catalog_id: str,
        album_id: str,
        album_name: str,
        asset_data: Dict[str, Any],
        metadata: Dict[str, Any],
        thumbnail_key: str
    ):
        """Store asset information in Neo4j"""
        with self.neo4j_driver.session() as session:
            # Extract relevant metadata
            exif = metadata.get("exif", {})
            xmp = metadata.get("xmp", {})
            
            # Extract GPS coordinates if available
            gps = exif.get("gps", {})
            latitude = gps.get("latitude")
            longitude = gps.get("longitude")
            
            # Extract capture date
            capture_date = asset_data.get("captureDate")
            if not capture_date:
                capture_date = exif.get("dateTimeOriginal")
            
            # Create or update the asset node
            session.run("""
                MERGE (a:Asset {lightroom_id: $asset_id})
                SET a.catalog_id = $catalog_id,
                    a.album_id = $album_id,
                    a.album_name = $album_name,
                    a.filename = $filename,
                    a.capture_date = $capture_date,
                    a.latitude = $latitude,
                    a.longitude = $longitude,
                    a.camera_make = $camera_make,
                    a.camera_model = $camera_model,
                    a.lens = $lens,
                    a.iso = $iso,
                    a.aperture = $aperture,
                    a.shutter_speed = $shutter_speed,
                    a.focal_length = $focal_length,
                    a.keywords = $keywords,
                    a.caption = $caption,
                    a.thumbnail_key = $thumbnail_key,
                    a.sync_date = datetime(),
                    a.identified = false
                
                MERGE (album:Album {lightroom_id: $album_id})
                SET album.name = $album_name
                
                MERGE (a)-[:IN_ALBUM]->(album)
            """, {
                "asset_id": asset_id,
                "catalog_id": catalog_id,
                "album_id": album_id,
                "album_name": album_name,
                "filename": asset_data.get("filename", ""),
                "capture_date": capture_date,
                "latitude": latitude,
                "longitude": longitude,
                "camera_make": exif.get("make", ""),
                "camera_model": exif.get("model", ""),
                "lens": exif.get("lens", ""),
                "iso": exif.get("iso"),
                "aperture": exif.get("aperture"),
                "shutter_speed": exif.get("shutterSpeed"),
                "focal_length": exif.get("focalLength"),
                "keywords": xmp.get("keywords", []),
                "caption": xmp.get("caption", ""),
                "thumbnail_key": thumbnail_key
            })
    
    async def store_sync_stats(self, stats: Dict[str, Any]):
        """Store sync statistics in Neo4j"""
        with self.neo4j_driver.session() as session:
            session.run("""
                CREATE (s:SyncLog)
                SET s.album_id = $album_id,
                    s.album_name = $album_name,
                    s.total_assets = $total_assets,
                    s.new_assets = $new_assets,
                    s.skipped_assets = $skipped_assets,
                    s.errors = $errors,
                    s.start_time = $start_time,
                    s.end_time = $end_time
            """, stats)
    
    async def get_synced_albums(self) -> List[Dict[str, Any]]:
        """Get list of albums that have been synced"""
        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (album:Album)<-[:IN_ALBUM]-(asset:Asset)
                WITH album, count(asset) as photo_count
                RETURN album.lightroom_id as id,
                       album.name as name,
                       photo_count
                ORDER BY album.name
            """)
            
            return [dict(record) for record in result]
    
    async def get_album_assets(self, album_id: str) -> List[Dict[str, Any]]:
        """Get all assets from a synced album"""
        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (a:Asset)-[:IN_ALBUM]->(album:Album {lightroom_id: $album_id})
                RETURN a.lightroom_id as id,
                       a.filename as filename,
                       a.capture_date as capture_date,
                       a.thumbnail_key as thumbnail_key,
                       a.identified as identified,
                       a.species_name as species_name,
                       a.confidence as confidence
                ORDER BY a.capture_date DESC
            """, album_id=album_id)
            
            return [dict(record) for record in result]
    
    async def get_asset_for_identification(
        self, 
        asset_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get asset data and fetch high-res image for identification
        Returns asset data with image bytes
        """
        # Get asset info from Neo4j
        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (a:Asset {lightroom_id: $asset_id})
                RETURN a
            """, asset_id=asset_id)
            
            record = result.single()
            if not record:
                return None
            
            asset_data = dict(record["a"])
        
        # Get catalog ID from asset
        catalog_id = asset_data.get("catalog_id")
        
        # Fetch 2048px rendition for identification
        rendition_url = await self.api_client.get_asset_rendition(
            catalog_id,
            asset_id,
            "2048"
        )
        
        # Download the image
        image_data = await self.api_client.download_rendition(rendition_url)
        
        # Store in MinIO for caching (30 days)
        image_key = f"identification/{asset_id}_2048.jpg"
        await self.storage.upload_image(
            io.BytesIO(image_data),
            image_key
        )
        
        asset_data["image_data"] = image_data
        asset_data["image_key"] = image_key
        
        return asset_data