from fastapi import APIRouter, HTTPException

from ai.inference.predictor import predictor
from backend.app.models.fqi_prediction import (
    FQIPredictionRequest,
    FQIPredictionResponse,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["AI Prediction"]
)

@router.get("/model-info")
def model_info():

    return {
        "model_name": predictor.config["model_name"],
        "model_version": predictor.config["model_version"],
        "model_type": predictor.config["model_type"],
        "target": predictor.config["target"],
        "target_description": predictor.config[
            "target_description"
        ],
        "features": predictor.config["features"],
        "evaluation": predictor.config["evaluation"]
    }

@router.post(
    "/predict-fqi",
    response_model=FQIPredictionResponse
)
def predict_fqi(
    request: FQIPredictionRequest
):

    try:

        prediction = predictor.predict(
            ph=request.ph,
            ammonia=request.ammonia,
            lactic_acid=request.lactic_acid,
            acetic_acid=request.acetic_acid,
            propionic_acid=request.propionic_acid,
            butyric_acid=request.butyric_acid,
            ethanol=request.ethanol,
            mannitol=request.mannitol,
            dry_matter=request.dry_matter,
            starch=request.starch
        )

        return FQIPredictionResponse(
        predicted_fqi=prediction,
        model_name=predictor.config["model_name"],
        model_version=predictor.config["model_version"],
        model_type=predictor.config["model_type"],
        target=predictor.config["target_description"],
        note=(
            "FQI is estimated from silage fermentation "
            "and composition measurements."
        )
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}"
        )