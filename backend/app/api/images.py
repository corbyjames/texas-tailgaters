from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from typing import Optional, List
from app.services.storage import storage_service
from app.services.cache import cache_service
from app.core.database import get_db
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    location: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    description: Optional[str] = None
):
    """Upload an image to the system"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Upload to MinIO
        file_data = await file.read()
        await file.seek(0)
        
        storage_result = storage_service.upload_image(
            file.file,
            file.filename,
            file.content_type
        )
        
        # Store metadata in Neo4j
        db = get_db()
        image_id = str(uuid.uuid4())
        
        query = """
        CREATE (i:Image {
            id: $id,
            filename: $filename,
            original_filename: $original_filename,
            upload_date: datetime(),
            location_name: $location,
            latitude: $latitude,
            longitude: $longitude,
            description: $description,
            size: $size
        })
        RETURN i
        """
        
        result = db.execute_write(query, {
            "id": image_id,
            "filename": storage_result["filename"],
            "original_filename": storage_result["original_filename"],
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "description": description,
            "size": file.size
        })
        
        # Clear cache
        cache_service.clear_pattern("images:*")
        
        return {
            "id": image_id,
            "filename": storage_result["filename"],
            "message": "Image uploaded successfully",
            "url": storage_service.get_image_url(storage_result["filename"])
        }
        
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_images(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List all uploaded images"""
    try:
        # Check cache first
        cache_key = f"images:list:{limit}:{offset}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        query = """
        MATCH (i:Image)
        RETURN i
        ORDER BY i.upload_date DESC
        SKIP $offset
        LIMIT $limit
        """
        
        results = db.execute_query(query, {"limit": limit, "offset": offset})
        
        images = []
        for result in results:
            image = result['i']
            image['url'] = storage_service.get_image_url(image['filename'])
            images.append(image)
        
        response = {
            "images": images,
            "count": len(images),
            "offset": offset,
            "limit": limit
        }
        
        # Cache the result
        cache_service.set(cache_key, response, ttl=300)  # 5 minutes
        
        return response
        
    except Exception as e:
        logger.error(f"Error listing images: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{image_id}")
async def get_image(image_id: str):
    """Get a specific image by ID"""
    try:
        # Check cache
        cache_key = f"image:{image_id}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        query = """
        MATCH (i:Image {id: $id})
        OPTIONAL MATCH (i)-[:CONTAINS]->(s:Species)
        OPTIONAL MATCH (i)-[:TAKEN_AT]->(l:Location)
        RETURN i, collect(DISTINCT s) as species, l as location
        """
        
        results = db.execute_query(query, {"id": image_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Image not found")
        
        result = results[0]
        image = result['i']
        image['url'] = storage_service.get_image_url(image['filename'])
        image['species'] = result['species']
        image['location'] = result['location']
        
        # Cache the result
        cache_service.set(cache_key, image, ttl=600)  # 10 minutes
        
        return image
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{image_id}")
async def delete_image(image_id: str):
    """Delete an image"""
    try:
        db = get_db()
        
        # Get image info first
        query = "MATCH (i:Image {id: $id}) RETURN i.filename as filename"
        results = db.execute_query(query, {"id": image_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Image not found")
        
        filename = results[0]['filename']
        
        # Delete from MinIO
        storage_service.delete_image(filename)
        
        # Delete from Neo4j
        delete_query = "MATCH (i:Image {id: $id}) DETACH DELETE i"
        db.execute_write(delete_query, {"id": image_id})
        
        # Clear cache
        cache_service.delete(f"image:{image_id}")
        cache_service.clear_pattern("images:*")
        
        return {"message": "Image deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image: {e}")
        raise HTTPException(status_code=500, detail=str(e))
