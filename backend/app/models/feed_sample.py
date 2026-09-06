from typing import Optional
from pydantic import BaseModel, Field

class FeedSample(BaseModel):
    sample_id: Optional[str] = None

    feed_type : str = Field(
        ...,
        description = "Type of feed or silage",
    )

    moisture : float = Field(
        ...,
        ge = 0,
        le = 100,
        description = "Moisture persentage",
    )

    temperature : float = Field(
        ...,
        description = "Temperature in degree Celsius",
    )

    ph : float = Field(
        ...,
        ge = 0,
        le = 14,
        description = "pH value",
    )

    humidity : float = Field(
        ...,
        ge = 0,
        le = 100,
        description = "Relative humidity percentage",
    )

    ammonia : Optional[float] = Field(
        default = None,
        ge = 0,
        description = "Simulated ammonia / gas reading"
    )