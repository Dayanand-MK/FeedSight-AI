from uuid import uuid4
from fastapi import APIRouter
from backend.app.database.assessment_repository import (get_all_assessments, save_assessment,)
from backend.app.models.assessment import FeedAssessmentResponse
from backend.app.models.feed_sample import FeedSample
from backend.app.services.assessment_service import assess_feed

router = APIRouter(
    prefix = "/api/v1",
    tags = ["Feed Assessment"],
)

@router.post(
    "/assess",
    response_model = FeedAssessmentResponse,
)

@router.get("/assessments")
def list_assessments():
    return get_all_assessments

def assess_feed_sample(sample : FeedSample):
    sample_id = sample.sample_id or str(uuid4())
    sample.sample_id = sample_id

    prediction = assess_feed(sample)

    save_assessment(
        sample_id = sample_id,
        sample = sample,
        prediction = prediction,
    )

    return FeedAssessmentResponse(
        sample = sample,
        prediction = prediction,
    )