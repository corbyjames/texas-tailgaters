from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import images, species, identification, search
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Marine Life ID System...")
    yield
    logger.info("Shutting down Marine Life ID System...")

app = FastAPI(
    title="Marine Life Identification System",
    description="AI-powered marine species identification and cataloging",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(images.router, prefix="/api/v1/images", tags=["images"])
app.include_router(species.router, prefix="/api/v1/species", tags=["species"])
app.include_router(identification.router, prefix="/api/v1/identify", tags=["identification"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])

@app.get("/")
async def root():
    return {"message": "Marine Life ID API", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
