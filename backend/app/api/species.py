from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_species():
    return {"message": "Species list endpoint"}
