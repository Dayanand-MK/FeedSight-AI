from fastapi import APIRouter
from backend.app.services.sync_service import sync_assessments

router = APIRouter(
    prefix = "/api/v1",
    tags = ["Synchronization"],
)

@router.post("/sync")
def sync_data():
    return sync_assessments()