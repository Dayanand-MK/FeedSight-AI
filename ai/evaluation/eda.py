from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


# --------------------------------------------------
# Paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = (
    PROJECT_ROOT
    / "ai"
    / "datasets"
    / "processed"
    / "silage_ml_dataset.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "ai"
    / "evaluation"
    / "eda_outputs"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


TARGET = "fqi"


def load_dataset():
    return pd.read_csv(DATASET_PATH)


def print_basic_statistics(df):

    print("=" * 70)
    print("FeedSight-AI - Exploratory Data Analysis")
    print("=" * 70)

    print(f"\nDataset shape: {df.shape}")

    print("\nDescriptive Statistics:")
    print(df.describe().T)

    print("\nDuplicate rows:")
    print(df.duplicated().sum())


def analyse_target(df):

    print("\n" + "=" * 70)
    print("FQI TARGET ANALYSIS")
    print("=" * 70)

    target = df[TARGET]

    print(f"\nMean   : {target.mean():.4f}")
    print(f"Median : {target.median():.4f}")
    print(f"Std    : {target.std():.4f}")
    print(f"Min    : {target.min():.4f}")
    print(f"Max    : {target.max():.4f}")
    print(f"Skew   : {target.skew():.4f}")

    plt.figure(figsize=(8, 5))

    plt.hist(
        target,
        bins=30,
        edgecolor="black"
    )

    plt.xlabel("Fermentative Quality Index (FQI)")
    plt.ylabel("Number of Samples")
    plt.title("Distribution of FQI")

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "fqi_distribution.png",
        dpi=300
    )

    plt.close()


def analyse_correlations(df):

    print("\n" + "=" * 70)
    print("FEATURE CORRELATION WITH FQI")
    print("=" * 70)

    correlation_matrix = df.corr(numeric_only=True)

    fqi_correlations = (
        correlation_matrix[TARGET]
        .drop(TARGET)
        .sort_values(key=abs, ascending=False)
    )

    print("\nCorrelation with FQI:")
    print(fqi_correlations)

    fqi_correlations.to_csv(
        OUTPUT_DIR / "fqi_correlations.csv",
        header=["correlation"]
    )

    # Full correlation matrix image
    plt.figure(figsize=(12, 10))

    plt.imshow(
        correlation_matrix,
        aspect="auto"
    )

    plt.colorbar(label="Correlation")

    plt.xticks(
        range(len(correlation_matrix.columns)),
        correlation_matrix.columns,
        rotation=90
    )

    plt.yticks(
        range(len(correlation_matrix.columns)),
        correlation_matrix.columns
    )

    plt.title("FeedSight-AI Feature Correlation Matrix")

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "correlation_matrix.png",
        dpi=300
    )

    plt.close()


def analyse_outliers(df):

    print("\n" + "=" * 70)
    print("OUTLIER ANALYSIS")
    print("=" * 70)

    report = []

    for column in df.columns:

        q1 = df[column].quantile(0.25)
        q3 = df[column].quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        outliers = df[
            (df[column] < lower_bound)
            | (df[column] > upper_bound)
        ]

        report.append(
            {
                "feature": column,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "outlier_count": len(outliers),
                "outlier_percentage": (
                    len(outliers) / len(df)
                ) * 100
            }
        )

    outlier_df = pd.DataFrame(report)

    print(outlier_df.to_string(index=False))

    outlier_df.to_csv(
        OUTPUT_DIR / "outlier_report.csv",
        index=False
    )


def create_feature_plots(df):

    features = [
        column
        for column in df.columns
        if column != TARGET
    ]

    for feature in features:

        plt.figure(figsize=(7, 5))

        plt.scatter(
            df[feature],
            df[TARGET],
            alpha=0.5,
            s=15
        )

        plt.xlabel(feature)
        plt.ylabel("FQI")

        plt.title(
            f"{feature} vs FQI"
        )

        plt.tight_layout()

        safe_name = (
            feature
            .replace(".", "_")
            .replace(" ", "_")
        )

        plt.savefig(
            OUTPUT_DIR
            / f"{safe_name}_vs_fqi.png",
            dpi=200
        )

        plt.close()


def main():

    df = load_dataset()

    print_basic_statistics(df)

    analyse_target(df)

    analyse_correlations(df)

    analyse_outliers(df)

    create_feature_plots(df)

    print("\n" + "=" * 70)
    print("EDA COMPLETED")
    print("=" * 70)

    print("\nEDA outputs saved to:")
    print(OUTPUT_DIR)


if __name__ == "__main__":
    main()