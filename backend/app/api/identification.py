from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional

router = APIRouter()

@router.post("/")
async def identify_species(
    file: UploadFile = File(...),
    lat: Optional[float] = None,
    lon: Optional[float] = None
):
    return {
        "message": "Species identification endpoint",
        "filename": file.filename,
        "location": {"lat": lat, "lon": lon}
    }
