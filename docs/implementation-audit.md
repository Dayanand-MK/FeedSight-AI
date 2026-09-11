# Repository audit — 10 September 2026

## Baseline
- WORKING/PRESENT: Python FQI regressor, serialized Gradient Boosting model, evaluation outputs, Excel dataset and dictionary, sensor simulator, SQLite repository, FastAPI prediction and IoT modules.
- PARTIAL: cloud sync (backend only), risk scoring, single frontend API helper, documentation.
- MISSING: React entry point/package, PWA, IndexedDB, image workflow, local inference, batch history, languages, QR, cloud RLS migrations.
- BROKEN: assessment decorators register the wrong function; list endpoint returns a function. Existing `.venv` refers to an unavailable Python installation. Confidence 0.70 is not measured. Preprocessing imputes before splitting; model selection uses test scores.

## Preservation
Existing uncommitted `backend/main.py`, `backend/app/api/iot.py`, and `backend/app/models/iot_reading.py` belong to the user. Preserve them. Preserve raw workbook, original trained model and historical evaluation artifacts. Add corrected training output separately.

## Dataset
Actual location: `ai/datasets/raw/datasilage.xlsx`. Four sheets: dictionary keys, elab.all, elab.temp, elab.buckets. Main sheet: 1,496 rows, 52 columns; FQI present in 1,486 rows, range approximately 11.66–84.57. FQI is a continuous fermentation index, not Good/Moderate/Poor classification labels or a safety certificate. Trial/sample identifiers permit grouped evaluation. Dictionary includes nutrient measurements and NIR instrument references, which are not spectral arrays. No image training set exists.

## Implementation order
1. Repair API and remove invented confidence; build within existing frontend directory.
2. Reproducible cleaning with training-only imputation and grouped model selection/evaluation; preserve legacy assets.
3. Offline rule assessment, image validation, sensor provenance, score/advisory, IndexedDB.
4. PWA, multilingual UI, batch Digital Twin, trend alerts, compact QR.
5. Optional authenticated Supabase sync, RLS, replay-safe records; document limitations.
6. Execute backend, frontend, browser offline and persistence checks; report actual results.
