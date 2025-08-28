from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.core.database import get_db
from app.services.cache import cache_service
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

class IdentificationFeedback(BaseModel):
    observation_id: Optional[str] = None
    prediction: Dict[str, Any]
    feedback_type: str  # 'correct', 'incorrect', 'correction'
    message: Optional[str] = None
    corrected_species: Optional[Dict[str, Any]] = None
    
class RetryRequest(BaseModel):
    observation_id: str
    feedback: Optional[str] = None
    exclude_species: Optional[list] = []

@router.post("/feedback")
async def submit_feedback(feedback: IdentificationFeedback):
    """
    Submit feedback on an identification
    """
    try:
        db = get_db()
        feedback_id = str(uuid.uuid4())
        
        # Store feedback in database
        query = """
        CREATE (f:Feedback {
            id: $id,
            observation_id: $observation_id,
            timestamp: datetime(),
            type: $type,
            message: $message,
            original_species: $original_species,
            corrected_species: $corrected_species,
            confidence: $confidence
        })
        """
        
        params = {
            "id": feedback_id,
            "observation_id": feedback.observation_id,
            "type": feedback.feedback_type,
            "message": feedback.message or "",
            "original_species": feedback.prediction.get("scientific_name"),
            "corrected_species": feedback.corrected_species.get("scientific_name") if feedback.corrected_species else None,
            "confidence": feedback.prediction.get("confidence", 0)
        }
        
        db.execute_write(query, params)
        
        # If this is a correction, update the observation
        if feedback.feedback_type == "correction" and feedback.corrected_species:
            update_query = """
            MATCH (o:Observation {id: $observation_id})
            OPTIONAL MATCH (o)-[r:IDENTIFIED_AS]->()
            DELETE r
            WITH o
            MATCH (s:Species {scientific_name: $species_name})
            CREATE (o)-[:IDENTIFIED_AS {corrected: true, confidence: 1.0}]->(s)
            CREATE (o)-[:CORRECTED_BY_USER {timestamp: datetime()}]->(s)
            RETURN o
            """
            
            db.execute_write(update_query, {
                "observation_id": feedback.observation_id,
                "species_name": feedback.corrected_species["scientific_name"]
            })
            
            # Clear cache for this observation
            cache_service.delete(f"recent_identification:{feedback.observation_id}")
        
        # Track learning data for improving the model
        if feedback.feedback_type == "incorrect":
            # Log incorrect predictions for analysis
            learning_query = """
            CREATE (l:LearningData {
                id: $id,
                timestamp: datetime(),
                incorrect_species: $incorrect,
                user_feedback: $feedback,
                confidence: $confidence
            })
            """
            
            db.execute_write(learning_query, {
                "id": str(uuid.uuid4()),
                "incorrect": feedback.prediction.get("scientific_name"),
                "feedback": feedback.message,
                "confidence": feedback.prediction.get("confidence", 0)
            })
        
        return {
            "status": "success",
            "feedback_id": feedback_id,
            "message": "Thank you for your feedback!"
        }
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retry")
async def retry_identification(request: RetryRequest):
    """
    Retry identification with additional context
    """
    try:
        db = get_db()
        
        # Get the original observation
        query = """
        MATCH (o:Observation {id: $id})
        RETURN o
        """
        
        results = db.execute_query(query, {"id": request.observation_id})
        
        if not results:
            raise HTTPException(status_code=404, detail="Observation not found")
        
        observation = results[0]['o']
        
        # Create a retry record
        retry_query = """
        MATCH (o:Observation {id: $observation_id})
        CREATE (r:RetryAttempt {
            id: $id,
            timestamp: datetime(),
            feedback: $feedback,
            excluded_species: $excluded
        })
        CREATE (o)-[:RETRY]->(r)
        RETURN r
        """
        
        retry_id = str(uuid.uuid4())
        db.execute_write(retry_query, {
            "observation_id": request.observation_id,
            "id": retry_id,
            "feedback": request.feedback or "",
            "excluded": request.exclude_species or []
        })
        
        return {
            "status": "success",
            "retry_id": retry_id,
            "message": "Retry request recorded. Please re-run identification with the feedback."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing retry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_feedback_stats():
    """
    Get statistics about identification feedback
    """
    try:
        db = get_db()
        cache_key = "feedback:stats"
        
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        # Count feedback types
        stats_query = """
        MATCH (f:Feedback)
        RETURN 
            count(CASE WHEN f.type = 'correct' THEN 1 END) as correct_count,
            count(CASE WHEN f.type = 'incorrect' THEN 1 END) as incorrect_count,
            count(CASE WHEN f.type = 'correction' THEN 1 END) as correction_count,
            count(f) as total_feedback
        """
        
        stats_result = db.execute_query(stats_query)
        
        # Get most corrected species
        corrected_query = """
        MATCH (f:Feedback {type: 'correction'})
        WHERE f.original_species IS NOT NULL
        RETURN f.original_species as species, count(f) as count
        ORDER BY count DESC
        LIMIT 5
        """
        
        corrected_species = db.execute_query(corrected_query)
        
        # Get accuracy rate
        accuracy_query = """
        MATCH (f:Feedback)
        WHERE f.type IN ['correct', 'incorrect']
        WITH count(CASE WHEN f.type = 'correct' THEN 1 END) as correct,
             count(f) as total
        RETURN CASE WHEN total > 0 THEN correct * 100.0 / total ELSE 0 END as accuracy
        """
        
        accuracy_result = db.execute_query(accuracy_query)
        
        stats = {
            "total_feedback": stats_result[0]["total_feedback"] if stats_result else 0,
            "correct_identifications": stats_result[0]["correct_count"] if stats_result else 0,
            "incorrect_identifications": stats_result[0]["incorrect_count"] if stats_result else 0,
            "corrections_provided": stats_result[0]["correction_count"] if stats_result else 0,
            "accuracy_rate": accuracy_result[0]["accuracy"] if accuracy_result else 0,
            "most_corrected_species": corrected_species
        }
        
        # Cache for 5 minutes
        cache_service.set(cache_key, stats, ttl=300)
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting feedback stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))