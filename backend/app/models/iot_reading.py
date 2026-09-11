from typing import Optional
from pydantic import BaseModel, Field


class IoTReadingRequest(BaseModel):
    device_id: str = "wokwi-esp32-01"
    feed_type: str = "maize_silage"

    temperature: float
    humidity: float = Field(..., ge=0, le=100)
    moisture: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    ammonia: float = Field(..., ge=0)


class IoTReadingResponse(BaseModel):
    status: str
    reading_id: str
    device_id: str
    message: str