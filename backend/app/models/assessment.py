from pydantic import BaseModel
from backend.app.models.feed_sample import FeedSample
from backend.app.models.prediction import PredictionResult

class FeedAssessmentResponse(BaseModel):
    sample : FeedSample
    prediction : PredictionResult