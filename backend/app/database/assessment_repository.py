import json

from backend.app.database.connection import get_connection
from backend.app.models.feed_sample import FeedSample
from backend.app.models.prediction import PredictionResult


def save_assessment(
    sample_id: str,
    sample: FeedSample,
    prediction: PredictionResult,
):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO assessments (
            sample_id,
            feed_type,
            moisture,
            temperature,
            ph,
            humidity,
            ammonia,
            quality_class,
            quality_score,
            spoilage_risk,
            confidence,
            alerts,
            recommendation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            sample_id,
            sample.feed_type,
            sample.moisture,
            sample.temperature,
            sample.ph,
            sample.humidity,
            sample.ammonia,
            prediction.quality_class,
            prediction.quality_score,
            prediction.spoilage_risk,
            prediction.confidence,
            json.dumps(prediction.alerts),
            prediction.recommendation,
        ),
    )

    connection.commit()
    connection.close()


def get_all_assessments():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM assessments
        ORDER BY created_at DESC
        """
    )

    rows = cursor.fetchall()
    connection.close()

    return [dict(row) for row in rows]


def get_unsynced_assessments():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM assessments
        WHERE synced = 0
        ORDER BY created_at ASC
        """
    )

    rows = cursor.fetchall()
    connection.close()

    return [dict(row) for row in rows]


def mark_assessment_synced(sample_id: str):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE assessments
        SET synced = 1
        WHERE sample_id = ?
        """,
        (sample_id,),
    )

    connection.commit()
    connection.close()