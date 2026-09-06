from fastapi import APIRouter, HTTPException
from uuid import uuid4
from simulation.scenarios.scenarios import SCENARIOS
from simulation.sensors.virtual_sensor import generate_sensor_reading
from backend.app.database.assessment_repository import save_assessment
from backend.app.models.feed_sample import FeedSample
from backend.app.services.assessment_service import assess_feed


router = APIRouter(
    prefix="/api/v1/simulation",
    tags=["Virtual Sensor Simulation"],
)


@router.get("/scenarios")
def list_scenarios():
    return SCENARIOS


@router.get("/reading/{scenario}")
def simulate_reading(
    scenario: str,
    feed_type: str = "maize_silage",
):
    if scenario not in SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail="Simulation scenario not found",
        )

    profile = SCENARIOS[scenario]["sensor_profile"]

    return generate_sensor_reading(
        scenario=profile,
        feed_type=feed_type,
    )


@router.post("/run/{scenario}")
def run_simulation(scenario : str, feed_type : str = "maize_silage",):
    if scenario not in SCENARIOS:
        raise HTTPException(status_code = 404, detail = "Simulation scenario not found",)

    profile = SCENARIOS[scenario]["sensor_profile"]

    reading = generate_sensor_reading(scenario = profile, feed_type = feed_type,)

    sample = FeedSample(sample_id = str(uuid4()), **reading,)

    prediction = assess_feed(sample)

    save_assessment(
        sample_id = sample.sample_id,
        sample = sample,
        prediction = prediction
    )

    return {
        "scenario" : SCENARIOS[scenario]["name"],
        "sample" : sample,
        "prediction" : prediction,
    }