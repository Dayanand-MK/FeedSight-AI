from pathlib import Path
import pandas as pd


# --------------------------------------------------
# Dataset Path
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = PROJECT_ROOT / "ai" / "datasets" / "raw" / "datasilage.xlsx"


def inspect_dataset():

    print("=" * 70)
    print("FeedSight-AI - Dataset Inspection")
    print("=" * 70)

    if not DATASET_PATH.exists():
        print(f"\nERROR: Dataset not found:")
        print(DATASET_PATH)
        return

    print(f"\nDataset: {DATASET_PATH.name}")

    # --------------------------------------------------
    # Read workbook
    # --------------------------------------------------

    excel_file = pd.ExcelFile(DATASET_PATH)

    print("\nAvailable sheets:")
    for sheet in excel_file.sheet_names:
        print(f"  - {sheet}")

    print("\n" + "=" * 70)

    # --------------------------------------------------
    # Inspect every sheet
    # --------------------------------------------------

    for sheet_name in excel_file.sheet_names:

        print(f"\nSHEET: {sheet_name}")
        print("-" * 70)

        df = pd.read_excel(DATASET_PATH, sheet_name=sheet_name)

        print(f"Rows    : {df.shape[0]}")
        print(f"Columns : {df.shape[1]}")

        print("\nColumn names:")

        for index, column in enumerate(df.columns, start=1):
            print(f"{index:>3}. {column}")

        print("\nData types:")
        print(df.dtypes.to_string())

        print("\nMissing values:")

        missing = df.isnull().sum()
        missing = missing[missing > 0].sort_values(ascending=False)

        if len(missing) == 0:
            print("No missing values detected.")
        else:
            print(missing.to_string())

        print("\nFirst 5 rows:")
        print(df.head().to_string())

        print("\n" + "=" * 70)


if __name__ == "__main__":
    inspect_dataset()