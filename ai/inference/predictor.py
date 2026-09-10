from pathlib import Path
import json

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "feedsight_fqi_model.joblib"
)

CONFIG_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "model_config.json"
)


class FQIPredictor:

    def __init__(self):

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found: {MODEL_PATH}"
            )

        if not CONFIG_PATH.exists():
            raise FileNotFoundError(
                f"Model config not found: {CONFIG_PATH}"
            )

        self.model = joblib.load(MODEL_PATH)

        with open(
            CONFIG_PATH,
            "r",
            encoding="utf-8"
        ) as file:
            self.config = json.load(file)

        self.features = self.config["features"]

    def predict(
        self,
        ph,
        ammonia,
        lactic_acid,
        acetic_acid,
        propionic_acid,
        butyric_acid,
        ethanol,
        mannitol,
        dry_matter,
        starch
    ):

        input_data = pd.DataFrame(
            [{
                "pH": ph,
                "ammonia.s": ammonia,
                "lactic.ac.s": lactic_acid,
                "acetic.ac.s": acetic_acid,
                "propionic.ac.s": propionic_acid,
                "butyric.ac.s": butyric_acid,
                "ethanol.s": ethanol,
                "mannithol.s": mannitol,
                "dm.s": dry_matter,
                "starch.s": starch
            }],
            columns=self.features
        )

        prediction = self.model.predict(
            input_data
        )[0]

        # Dataset FQI is interpreted on a 0–100 scale.
        prediction = max(
            0.0,
            min(100.0, float(prediction))
        )

        return round(
            prediction,
            2
        )


predictor = FQIPredictor()