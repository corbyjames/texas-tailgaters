from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Marine Life ID"
    
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "marinelife123")
    
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "marine-images")
    MINIO_SECURE: bool = False
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    GOOGLE_VISION_API_KEY: Optional[str] = os.getenv("GOOGLE_VISION_API_KEY")
    INATURALIST_APP_ID: Optional[str] = os.getenv("INATURALIST_APP_ID")
    INATURALIST_APP_SECRET: Optional[str] = os.getenv("INATURALIST_APP_SECRET")
    
    # Adobe Lightroom API settings
    ADOBE_CLIENT_ID: str = os.getenv("ADOBE_CLIENT_ID", "")
    ADOBE_CLIENT_SECRET: str = os.getenv("ADOBE_CLIENT_SECRET", "")
    ADOBE_REDIRECT_URI: str = os.getenv("ADOBE_REDIRECT_URI", "https://localhost:8000/api/v1/lightroom/auth/callback")
    
    # Claude Vision API settings
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    FREE_MONTHLY_IDS: int = 50  # Free identifications per month
    
    MAX_IMAGE_SIZE: int = 100 * 1024 * 1024
    THUMBNAIL_SIZE: tuple = (300, 300)
    PREVIEW_SIZE: tuple = (1200, 1200)
    
    MIN_CONFIDENCE_THRESHOLD: float = 0.5
    HIGH_CONFIDENCE_THRESHOLD: float = 0.8
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
