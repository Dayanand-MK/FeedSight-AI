from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter

from backend.app.models.iot_reading import (
    IoTReadingRequest,
    IoTReadingResponse,
)


router = APIRouter(
    prefix="/api/v1/iot",
    tags=["IoT Monitoring"],
)


latest_reading = None
reading_history = []


@router.post(
    "/readings",
    response_model=IoTReadingResponse,
)
def receive_iot_reading(reading: IoTReadingRequest):

    global latest_reading

    reading_id = str(uuid4())

    stored_reading = {
        "reading_id": reading_id,
        "device_id": reading.device_id,
        "feed_type": reading.feed_type,
        "temperature": reading.temperature,
        "humidity": reading.humidity,
        "moisture": reading.moisture,
        "ph": reading.ph,
        "ammonia": reading.ammonia,
        "received_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }

    latest_reading = stored_reading
    reading_history.append(stored_reading)

    # Keep only recent readings in memory.
    if len(reading_history) > 100:
        reading_history.pop(0)

    return IoTReadingResponse(
        status="received",
        reading_id=reading_id,
        device_id=reading.device_id,
        message="IoT reading received successfully",
    )


@router.get("/latest")
def get_latest_reading():

    if latest_reading is None:
        return {
            "status": "waiting",
            "message": "No IoT readings received yet",
        }

    return latest_reading


@router.get("/history")
def get_reading_history():

    return {
        "count": len(reading_history),
        "readings": reading_history,
    }