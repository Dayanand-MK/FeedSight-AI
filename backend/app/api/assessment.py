from fastapi import APIRouter
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

def assess_feed_sample(sample : FeedSample):
    prediction = assess_feed(sample)

    return FeedAssessmentResponse(
        sample = sample,
        prediction = prediction,
    )