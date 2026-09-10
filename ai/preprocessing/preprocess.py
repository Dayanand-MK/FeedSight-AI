from pathlib import Path
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]

RAW_DATASET = (
    PROJECT_ROOT
    / "ai"
    / "datasets"
    / "raw"
    / "datasilage.xlsx"
)

PROCESSED_DATASET = (
    PROJECT_ROOT
    / "ai"
    / "datasets"
    / "processed"
    / "silage_ml_dataset.csv"
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


def preprocess():

    print("=" * 60)
    print("FeedSight-AI - Dataset Preprocessing")
    print("=" * 60)

    df = pd.read_excel(
        RAW_DATASET,
        sheet_name="elab.all"
    )

    print(f"\nOriginal dataset shape: {df.shape}")

    selected_columns = FEATURES + [TARGET]

    df = df[selected_columns].copy()

    print(f"Selected dataset shape: {df.shape}")

    print("\nMissing values before cleaning:")
    print(df.isnull().sum())

    # Remove rows where target is missing
    df = df.dropna(subset=[TARGET])

    # Median imputation for remaining numerical feature values
    for column in FEATURES:
        df[column] = df[column].fillna(df[column].median())

    print("\nMissing values after cleaning:")
    print(df.isnull().sum())

    print(f"\nFinal dataset shape: {df.shape}")

    PROCESSED_DATASET.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        PROCESSED_DATASET,
        index=False
    )

    print("\nProcessed dataset saved to:")
    print(PROCESSED_DATASET)

    print("\nTarget statistics:")
    print(df[TARGET].describe())

    print("\nPreprocessing completed successfully.")


if __name__ == "__main__":
    preprocess()