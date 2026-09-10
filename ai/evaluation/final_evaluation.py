from pathlib import Path
import json

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split


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

MODEL_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "feedsight_fqi_model.joblib"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "ai"
    / "evaluation"
    / "final_outputs"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


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


def main():

    print("=" * 70)
    print("FeedSight-AI - Final Model Evaluation")
    print("=" * 70)

    # --------------------------------------------------
    # Load data
    # --------------------------------------------------

    df = pd.read_csv(DATASET_PATH)

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE
    )

    # --------------------------------------------------
    # Load model
    # --------------------------------------------------

    model = joblib.load(MODEL_PATH)

    predictions = model.predict(X_test)

    # --------------------------------------------------
    # Metrics
    # --------------------------------------------------

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

    print(f"\nTest samples : {len(X_test)}")
    print(f"MAE          : {mae:.4f}")
    print(f"RMSE         : {rmse:.4f}")
    print(f"R2           : {r2:.4f}")

    # --------------------------------------------------
    # Prediction report
    # --------------------------------------------------

    prediction_df = pd.DataFrame({
        "actual_fqi": y_test.values,
        "predicted_fqi": predictions
    })

    prediction_df["error"] = (
        prediction_df["actual_fqi"]
        - prediction_df["predicted_fqi"]
    )

    prediction_df["absolute_error"] = (
        prediction_df["error"].abs()
    )

    prediction_df.to_csv(
        OUTPUT_DIR / "predictions.csv",
        index=False
    )

    # --------------------------------------------------
    # Actual vs predicted plot
    # --------------------------------------------------

    plt.figure(figsize=(7, 6))

    plt.scatter(
        y_test,
        predictions,
        alpha=0.6
    )

    minimum = min(
        y_test.min(),
        predictions.min()
    )

    maximum = max(
        y_test.max(),
        predictions.max()
    )

    plt.plot(
        [minimum, maximum],
        [minimum, maximum],
        linestyle="--"
    )

    plt.xlabel("Actual FQI")
    plt.ylabel("Predicted FQI")
    plt.title("Actual vs Predicted FQI")

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "actual_vs_predicted.png",
        dpi=300
    )

    plt.close()

    # --------------------------------------------------
    # Residual distribution
    # --------------------------------------------------

    residuals = y_test.values - predictions

    plt.figure(figsize=(7, 5))

    plt.hist(
        residuals,
        bins=30,
        edgecolor="black"
    )

    plt.xlabel("Prediction Error")
    plt.ylabel("Frequency")
    plt.title("FQI Prediction Error Distribution")

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "residual_distribution.png",
        dpi=300
    )

    plt.close()

    # --------------------------------------------------
    # Feature importance
    # --------------------------------------------------

    regressor = model.named_steps["model"]

    importance = regressor.feature_importances_

    importance_df = pd.DataFrame({
        "feature": FEATURES,
        "importance": importance
    }).sort_values(
        "importance",
        ascending=False
    )

    print("\n" + "=" * 70)
    print("FEATURE IMPORTANCE")
    print("=" * 70)

    print(
        importance_df.to_string(
            index=False
        )
    )

    importance_df.to_csv(
        OUTPUT_DIR / "feature_importance.csv",
        index=False
    )

    # --------------------------------------------------
    # Feature importance graph
    # --------------------------------------------------

    plot_df = importance_df.sort_values(
        "importance",
        ascending=True
    )

    plt.figure(figsize=(8, 6))

    plt.barh(
        plot_df["feature"],
        plot_df["importance"]
    )

    plt.xlabel("Importance")
    plt.ylabel("Feature")
    plt.title("Gradient Boosting Feature Importance")

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "feature_importance.png",
        dpi=300
    )

    plt.close()

    # --------------------------------------------------
    # Save final metrics
    # --------------------------------------------------

    metrics = {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "R2": float(r2)
    }

    with open(
        OUTPUT_DIR / "final_metrics.json",
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metrics,
            file,
            indent=4
        )

    print("\n" + "=" * 70)
    print("FINAL EVALUATION COMPLETED")
    print("=" * 70)

    print("\nOutputs saved to:")
    print(OUTPUT_DIR)


if __name__ == "__main__":
    main()