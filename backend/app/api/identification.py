from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Optional, List, Dict
from app.services.storage import storage_service
from app.services.cache import cache_service
from app.core.database import get_db
from app.core.config import settings
from app.services.ai_identification.google_vision_rest import google_vision_rest_service
from app.services.ai_identification.mock_service import MockIdentificationService
from app.services.ai_identification.free_classifier import free_classifier
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Create a singleton mock service instance to maintain state
mock_service = MockIdentificationService()

@router.post("/")
async def identify_species(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    save_image: bool = True
):
    """
    Identify species in an uploaded image using AI
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        await file.seek(0)
        
        # Use mock service for better variety (free classifier needs more work)
        # The free classifier is available but needs ML models for better accuracy
        use_mock_service = True  # Free, no API costs
        
        if use_mock_service:
            logger.info("Using mock identification service (free, no API required)")
            predictions = mock_service.identify_species(image_data)
            logger.info(f"Mock service returned {len(predictions)} predictions")
        else:
            # Alternative: Use free classifier (color/shape analysis)
            logger.info("Using free marine classifier")
            predictions = free_classifier.identify_species(image_data)
            logger.info(f"Free classifier returned {len(predictions)} predictions")
        
        if predictions:
            logger.info(f"First prediction: {predictions[0].get('common_name', 'Unknown')}")
        
        if not predictions:
            return {
                "status": "no_species_detected",
                "message": "No marine species detected in the image",
                "predictions": []
            }
        
        # Get additional species info from database
        db = get_db()
        enriched_predictions = []
        
        for pred in predictions:
            # Query species details
            query = """
            MATCH (s:Species {scientific_name: $name})
            OPTIONAL MATCH (s)-[:FOUND_IN]->(l:Location)
            RETURN s, collect(l.name) as locations
            """
            
            results = db.execute_query(query, {"name": pred["scientific_name"]})
            
            if results:
                species_data = dict(results[0]['s'])
                species_data['confidence'] = pred['confidence']
                species_data['locations'] = results[0]['locations']
                enriched_predictions.append(species_data)
            else:
                # Species not in database, use basic prediction
                enriched_predictions.append(pred)
        
        observation_id = str(uuid.uuid4())
        
        # Save image and create observation if requested
        if save_image:
            # Upload to storage
            storage_result = storage_service.upload_image(
                file.file,
                file.filename,
                file.content_type
            )
            
            # Create observation in database
            obs_query = """
            CREATE (o:Observation {
                id: $id,
                timestamp: datetime(),
                latitude: $lat,
                longitude: $lon,
                confidence: $confidence,
                filename: $filename
            })
            WITH o
            MATCH (s:Species {scientific_name: $species_name})
            CREATE (o)-[:IDENTIFIED_AS]->(s)
            RETURN o
            """
            
            # Save with highest confidence species
            if enriched_predictions:
                top_species = enriched_predictions[0]
                db.execute_write(obs_query, {
                    "id": observation_id,
                    "lat": lat,
                    "lon": lon,
                    "confidence": top_species['confidence'],
                    "filename": storage_result["filename"],
                    "species_name": top_species.get('scientific_name')
                })
        
        logger.info(f"Returning {len(enriched_predictions)} enriched predictions")
        
        response = {
            "status": "success",
            "observation_id": observation_id if save_image else None,
            "predictions": enriched_predictions,
            "location": {"latitude": lat, "longitude": lon} if lat and lon else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Cache recent identification
        cache_key = f"recent_identification:{observation_id}"
        cache_service.set(cache_key, response, ttl=3600)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error identifying species: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent")
async def get_recent_identifications(limit: int = 10):
    """
    Get recent species identifications
    """
    try:
        cache_key = f"identifications:recent:{limit}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        query = """
        MATCH (o:Observation)-[:IDENTIFIED_AS]->(s:Species)
        RETURN o, s
        ORDER BY o.timestamp DESC
        LIMIT $limit
        """
        
        results = db.execute_query(query, {"limit": limit})
        
        identifications = []
        for result in results:
            obs = dict(result['o'])
            # Convert datetime to string
            if 'timestamp' in obs and hasattr(obs['timestamp'], 'isoformat'):
                obs['timestamp'] = obs['timestamp'].isoformat()
            obs['species'] = dict(result['s'])
            if obs.get('filename'):
                obs['image_url'] = storage_service.get_image_url(obs['filename'])
            identifications.append(obs)
        
        response = {
            "identifications": identifications,
            "count": len(identifications)
        }
        
        # Cache for 5 minutes
        cache_service.set(cache_key, response, ttl=300)
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting recent identifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_identification_stats():
    """
    Get statistics about identifications
    """
    try:
        cache_key = "identifications:stats"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        db = get_db()
        
        # Total observations
        total_query = "MATCH (o:Observation) RETURN count(o) as total"
        total_result = db.execute_query(total_query)
        total = total_result[0]['total'] if total_result else 0
        
        # Most identified species
        top_species_query = """
        MATCH (o:Observation)-[:IDENTIFIED_AS]->(s:Species)
        RETURN s.common_name as species, count(o) as count
        ORDER BY count DESC
        LIMIT 5
        """
        top_species = db.execute_query(top_species_query)
        
        # Observations by confidence
        confidence_query = """
        MATCH (o:Observation)
        RETURN 
            sum(CASE WHEN o.confidence >= 0.8 THEN 1 ELSE 0 END) as high,
            sum(CASE WHEN o.confidence >= 0.5 AND o.confidence < 0.8 THEN 1 ELSE 0 END) as medium,
            sum(CASE WHEN o.confidence < 0.5 THEN 1 ELSE 0 END) as low
        """
        confidence_result = db.execute_query(confidence_query)
        
        stats = {
            "total_observations": total,
            "top_species": top_species,
            "confidence_distribution": confidence_result[0] if confidence_result else {}
        }
        
        # Cache for 10 minutes
        cache_service.set(cache_key, stats, ttl=600)
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting identification stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
