from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor


# --------------------------------------------------
# Configuration
# --------------------------------------------------

RANDOM_STATE = 42
TEST_SIZE = 0.20

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT
    / "ai"
    / "datasets"
    / "processed"
    / "silage_ml_dataset.csv"
)

MODEL_DIR = (
    PROJECT_ROOT
    / "ai"
    / "models"
)

EVALUATION_DIR = (
    PROJECT_ROOT
    / "ai"
    / "evaluation"
)

MODEL_DIR.mkdir(parents=True, exist_ok=True)
EVALUATION_DIR.mkdir(parents=True, exist_ok=True)


FEATURES = [
    "pH",
    "ammonia.s",
    "lactic.ac.s",
    "acetic.ac.s",
    "propionic.ac.s",
    "butyric.ac.s",
    "ethanol.s",
    "mannithol.s",
    "dm.s",
    "starch.s",
]

TARGET = "fqi"


# --------------------------------------------------
# Load data
# --------------------------------------------------

def load_data():

    df = pd.read_csv(DATASET_PATH)

    X = df[FEATURES].copy()
    y = df[TARGET].copy()

    return X, y


# --------------------------------------------------
# Models
# --------------------------------------------------

def build_models():

    models = {

        "linear_regression": Pipeline([
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "scaler",
                StandardScaler()
            ),
            (
                "model",
                LinearRegression()
            ),
        ]),

        "decision_tree": Pipeline([
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "model",
                DecisionTreeRegressor(
                    random_state=RANDOM_STATE,
                    max_depth=8
                )
            ),
        ]),

        "random_forest": Pipeline([
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=300,
                    random_state=RANDOM_STATE,
                    n_jobs=-1
                )
            ),
        ]),

        "gradient_boosting": Pipeline([
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "model",
                GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.05,
                    max_depth=3,
                    random_state=RANDOM_STATE
                )
            ),
        ]),
    }

    return models


# --------------------------------------------------
# Evaluation
# --------------------------------------------------

def evaluate_model(model, X_test, y_test):

    predictions = model.predict(X_test)

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions
        )
    )

    r2 = r2_score(
        y_test,
        predictions
    )

    return {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "R2": float(r2),
    }


# --------------------------------------------------
# Training
# --------------------------------------------------

def main():

    print("=" * 70)
    print("FeedSight-AI - Model Training")
    print("=" * 70)

    X, y = load_data()

    print(f"\nSamples : {len(X)}")
    print(f"Features: {len(FEATURES)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE
    )

    print(f"\nTraining samples: {len(X_train)}")
    print(f"Testing samples : {len(X_test)}")

    models = build_models()

    results = {}

    best_model = None
    best_model_name = None
    best_rmse = float("inf")

    print("\n" + "=" * 70)
    print("MODEL RESULTS")
    print("=" * 70)

    for name, model in models.items():

        print(f"\nTraining: {name}")

        model.fit(
            X_train,
            y_train
        )

        metrics = evaluate_model(
            model,
            X_test,
            y_test
        )

        results[name] = metrics

        print(
            f"MAE  : {metrics['MAE']:.4f}"
        )

        print(
            f"RMSE : {metrics['RMSE']:.4f}"
        )

        print(
            f"R2   : {metrics['R2']:.4f}"
        )

        if metrics["RMSE"] < best_rmse:

            best_rmse = metrics["RMSE"]
            best_model = model
            best_model_name = name

    # --------------------------------------------------
    # Save best model
    # --------------------------------------------------

    model_path = (
        MODEL_DIR
        / "feedsight_fqi_model.joblib"
    )

    joblib.dump(
        best_model,
        model_path
    )

    # --------------------------------------------------
    # Save evaluation results
    # --------------------------------------------------

    results_path = (
        EVALUATION_DIR
        / "model_results.json"
    )

    with open(
        results_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            results,
            file,
            indent=4
        )

    metadata = {

        "model_name": best_model_name,

        "target": TARGET,

        "features": FEATURES,

        "test_size": TEST_SIZE,

        "random_state": RANDOM_STATE,

        "metrics": results[best_model_name],
    }

    metadata_path = (
        MODEL_DIR
        / "metadata.json"
    )

    with open(
        metadata_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metadata,
            file,
            indent=4
        )

    print("\n" + "=" * 70)

    print(
        f"BEST MODEL: {best_model_name}"
    )

    print(
        f"Best RMSE : {best_rmse:.4f}"
    )

    print("\nSaved model:")
    print(model_path)

    print("\nSaved metadata:")
    print(metadata_path)

    print("\nSaved results:")
    print(results_path)

    print("\nTraining completed successfully.")


if __name__ == "__main__":
    main()