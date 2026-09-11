from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

class FeedSample(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    sample_id: Optional[str] = None

    feed_type : Literal["maize_silage", "dry_feed"] = Field(
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
        ge=-20,
        le=80,
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

    source: Literal["manual", "virtual", "dataset", "device"] = "manual"
