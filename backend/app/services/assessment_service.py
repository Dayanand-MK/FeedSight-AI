from backend.app.models.feed_sample import FeedSample
from backend.app.models.prediction import PredictionResult

def assess_feed(sample : FeedSample) -> PredictionResult:
    score = 100.0
    alerts = []

    if sample.moisture > (70 if sample.feed_type == "maize_silage" else 15):
        score -= 20
        alerts.append("High moisture detected")

    if sample.temperature > 35:
        score -= 20
        alerts.append("High temperature detected")

    if sample.feed_type == "maize_silage" and (sample.ph > 4.5 or sample.ph < 3):
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
        recommendation = "No configured screening flags. Continue inspection; this is not a safety certificate."

    return PredictionResult(
        quality_class = quality_class,
        quality_score = score,
        spoilage_risk = spoilage_risk,
        confidence = None,
        alerts = alerts,
        recommendation = recommendation,
    )
