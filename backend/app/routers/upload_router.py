from fastapi import APIRouter
from app.services.s3_service import generate_upload_url

router = APIRouter(
    prefix="/upload",
    tags=["upload"]
)


@router.post("/url")
def create_upload_url(meeting_id: str):

    return generate_upload_url(meeting_id)