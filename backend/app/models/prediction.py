from typing import List
from pydantic import BaseModel, Field

class PredictionResult(BaseModel):
    quality_class : str

    quality_score : float = Field(
        ...,
        ge = 0,
        le = 100,
    )
    
    spoilage_risk : str

    confidence : float | None = Field(
        default=None,
        ge = 0,
        le = 1,
    )

    alerts : List[str] = []

    recommendation : str

    assessment_type: str = "rule-based-screening"
    note: str = "Prototype screening only. No calibrated confidence or toxin clearance."
