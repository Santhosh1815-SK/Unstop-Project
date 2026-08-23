from fastapi import APIRouter
from config import settings
from logger import logger

router = APIRouter(tags=["health"])

@router.get("/health")
def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok", "debug": settings.DEBUG}
