from pydantic import BaseModel, Field


class FQIPredictionRequest(BaseModel):
    ph: float = Field(..., ge=0, le=14)
    ammonia: float = Field(..., ge=0)
    lactic_acid: float = Field(..., ge=0)
    acetic_acid: float = Field(..., ge=0)
    propionic_acid: float = Field(..., ge=0)
    butyric_acid: float = Field(..., ge=0)
    ethanol: float = Field(..., ge=0)
    mannitol: float = Field(..., ge=0)
    dry_matter: float = Field(..., ge=0)
    starch: float = Field(..., ge=0)


class FQIPredictionResponse(BaseModel):
    predicted_fqi: float
    model_name: str
    model_version: str
    model_type: str
    target: str
    note: str