from backend.app.models.feed_sample import FeedSample
from backend.app.models.prediction import PredictionResult

def assess_feed(sample : FeedSample) -> PredictionResult:
    score = 100.0
    alerts = []

    if sample.moisture > 70:
        score -= 20
        alerts.append("High moisture detected")

    if sample.temperature > 35:
        score -= 20
        alerts.append("High temperature detected")

    if sample.ph > 6:
        score -= 20
        alerts.append("Abnormal pH level")

    if sample.humidity > 80:
        score -= 15
        alerts.append("High humidity detected")

    score = max(0.0, min(100.0, score))

    if score >= 80:
        quality_class = "Good"
        spoilage_risk = "Low"

    elif score >= 50:
        quality_class = "Moderate"
        spoilage_risk = "Medium"

    else:
        quality_class = "Poor"
        spoilage_risk = "High"

    if alerts:
        recommendation = (
            "Review storage conditions and inspect the feed before use."
        )

    else:
        recommendation = "Feed conditions are within the expected range."

    return PredictionResult(
        quality_class = quality_class,
        quality_score = score,
        spoilage_risk = spoilage_risk,
        confidence = 0.70,
        alerts = alerts,
        recommendation = recommendation,
    )