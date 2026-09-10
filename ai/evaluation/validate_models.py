from pathlib import Path
import json

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor


RANDOM_STATE = 42
N_SPLITS = 5

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT
    / "ai"
    / "datasets"
    / "processed"
    / "silage_ml_dataset.csv"
)

OUTPUT_PATH = (
    PROJECT_ROOT
    / "ai"
    / "evaluation"
    / "cross_validation_results.json"
)


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


def build_models():

    return {

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
                    max_depth=8,
                    random_state=RANDOM_STATE
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


def main():

    print("=" * 70)
    print("FeedSight-AI - 5-Fold Cross Validation")
    print("=" * 70)

    df = pd.read_csv(DATASET_PATH)

    X = df[FEATURES]
    y = df[TARGET]

    print(f"\nSamples : {len(df)}")
    print(f"Features: {len(FEATURES)}")
    print(f"Folds   : {N_SPLITS}")

    cv = KFold(
        n_splits=N_SPLITS,
        shuffle=True,
        random_state=RANDOM_STATE
    )

    scoring = {
        "mae": "neg_mean_absolute_error",
        "mse": "neg_mean_squared_error",
        "r2": "r2"
    }

    models = build_models()

    final_results = {}

    print("\n" + "=" * 70)
    print("CROSS-VALIDATION RESULTS")
    print("=" * 70)

    for name, model in models.items():

        print(f"\nValidating: {name}")

        scores = cross_validate(
            model,
            X,
            y,
            cv=cv,
            scoring=scoring,
            n_jobs=-1
        )

        mae_scores = -scores["test_mae"]

        rmse_scores = np.sqrt(
            -scores["test_mse"]
        )

        r2_scores = scores["test_r2"]

        result = {
            "MAE_mean": float(mae_scores.mean()),
            "MAE_std": float(mae_scores.std()),
            "RMSE_mean": float(rmse_scores.mean()),
            "RMSE_std": float(rmse_scores.std()),
            "R2_mean": float(r2_scores.mean()),
            "R2_std": float(r2_scores.std()),
            "R2_folds": [
                float(score)
                for score in r2_scores
            ]
        }

        final_results[name] = result

        print(
            f"MAE  : "
            f"{result['MAE_mean']:.4f} "
            f"+/- {result['MAE_std']:.4f}"
        )

        print(
            f"RMSE : "
            f"{result['RMSE_mean']:.4f} "
            f"+/- {result['RMSE_std']:.4f}"
        )

        print(
            f"R2   : "
            f"{result['R2_mean']:.4f} "
            f"+/- {result['R2_std']:.4f}"
        )

        print("R2 folds:")

        for index, score in enumerate(
            r2_scores,
            start=1
        ):
            print(
                f"  Fold {index}: "
                f"{score:.4f}"
            )

    with open(
        OUTPUT_PATH,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            final_results,
            file,
            indent=4
        )

    print("\n" + "=" * 70)
    print("VALIDATION COMPLETED")
    print("=" * 70)

    print("\nResults saved to:")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()