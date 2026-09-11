# FeedSight AI training

There are three separate experiments: original laboratory FQI, experimental
GrainSet kernel classification, and the new **CSIRO pasture biomass regressor**.
CSIRO does not train a general feed-type classifier. See [dataset_audit.md](dataset_audit.md).

## Train the supplied CSIRO folder

Open PowerShell at the project root. The default data path already points to
`ai/datasets/csiro-biomass`; no subfolders need to be moved or renamed.

```powershell
cd 'D:\SIH 2026\FeedSight-AI'
# Dependencies are already installed on this machine. For a fresh setup:
.\.venv-runtime\Scripts\python.exe -m pip install -r requirements-image.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Checks all image paths, labels, hashes, decodes and creates grouped splits:
.\.venv-runtime\Scripts\python.exe -m ai.training.biomass audit

# Trains and evaluates; prints progress and real metrics:
.\.venv-runtime\Scripts\python.exe -m ai.training.biomass train

# Predicts the unlabelled example locally (not an evaluation score):
.\.venv-runtime\Scripts\python.exe -m ai.training.biomass predict --image ai/datasets/csiro-biomass/test/ID1001187975.jpg

# Exports ONNX, checks numerical parity, and copies browser assets:
.\.venv-runtime\Scripts\python.exe -m ai.training.biomass export --image ai/datasets/csiro-biomass/test/ID1001187975.jpg

cd frontend
npm ci
npm run build
npm run preview -- --port 4173
```

If the virtual environment does not exist, create it using Python 3.12 first:
`py -3.12 -m venv .venv-runtime`. Install `requirements-core.txt` too when running
the existing backend/tests. The CPU wheel is used here; the feature extractor
automatically selects CUDA if a compatible GPU-enabled PyTorch is installed.

Outputs are under `ai/results/biomass`: `biomass.pt`, `biomass.onnx`,
`model_metadata.json`, `model_metrics.json`, `test_predictions.csv`, and
`prediction.json`. Existing FQI artifacts are unchanged. Re-running train
replaces this experiment's outputs. Preserve a run by using `--output` with a
different folder, and use that same folder for predict/export.

## Model and actual first results

ImageNet-pretrained MobileNetV3-Small remains frozen. Two horizontal halves of
the original photo are each resampled to 224 × 224 and RGB-normalized using
ImageNet mean/std. Their 576-dimensional feature vectors are averaged. No
random augmentation is used for this fast frozen-feature baseline. Input tensor:
`[1, 3, 224, 448]`. Pixel-centre nearest sampling is explicit and shared with JS.

A standardized ridge regressor predicts green/dead/clover biomass; negatives
are clipped to zero and the two totals are derived by addition. Standardization
uses only training features. Four regularization values (1, 10, 100, 1000) are
compared on validation MSE; alpha 1000 was selected. This is closed-form training,
**0 neural-network epochs**, not a fabricated 5–15 epoch fine-tune. No early
stopping is needed for the finite four-fit search. No post-test tuning was done.

| Held-out target | MAE (g) | RMSE (g) | R² |
|---|---:|---:|---:|
| Dry green | 11.573 | 15.799 | 0.420 |
| Dry dead | 10.050 | 13.408 | 0.278 |
| Dry clover | 11.013 | 17.027 | -0.022 |
| Green dry matter | 10.214 | 13.912 | 0.615 |
| Total dry biomass | 13.510 | 17.528 | 0.580 |

All targets improve on the recorded training-mean predictor's RMSE in this split,
but clover remains weak. These are local grouped test metrics, not Kaggle scores
or field validation. Accuracy, precision, recall, F1 and a confusion matrix are
not applicable to this regression task. ONNX size: **3,767,490 bytes**.

## Farmer integration

The existing photo step retains manual feed selection and adds explicit
confirmation/correction. A collapsed optional pasture section requires the user
to confirm acquisition scope, then runs the experimental ONNX model locally.
It never supplies an AI feed category or a confidence percentage. Results are
stored alongside the report but cannot alter FQI, nutrients, goal rules, safety
flags or feed-health scores. Farmers can select maize silage, dry feed, green
fodder/pasture, concentrate/pellets, mixed ration or other/unknown. Only the first
two have existing prototype storage thresholds. Other categories remain unscored
with storage status unknown; reported hazards still trigger the safety gate.
Fresh green fodder never inherits the dry-feed moisture threshold. The optional
legacy Python assessment API still accepts its original two feed categories;
the PWA uses its local engine for the expanded manual workflow.

Model/runtime failure leaves manual confirmation available. Browser assets use
relative deployment paths. The build copies matching ORT WASM runtime files from
node_modules. Model assets are fetched only on request and cached by the service
worker; offline model use requires a successful online load with the worker
controlling the page. Clearing browser cache removes this capability.

The reference-composition lookup is structurally available for all supported
feed categories. Values remain null because these broad categories have no
sufficiently specific sourced composition records in the project. User-entered
nutrients retain USER_REPORTED provenance. Device readings use SENSOR_MEASURED;
virtual readings use SIMULATED. The current NIR field is a report reference, not
a spectral model. Whole-ration requirements remain unavailable; existing explicit
ingredient targets support limited gap comparisons subject to the safety gate.

## Deployment

Raw CSIRO data, processed files and large experiment outputs are gitignored.
The generated browser model directory is also ignored by default. Before a
deliberate release, retain the ONNX and metadata as deployment artifacts or
explicitly stage them after checking dataset terms. The raw dataset is never
needed by Vercel. Without model files the rest of the app builds and works, and
the optional pasture feature falls back. No deployment is performed by training.

## Remaining validation

Independent farm/phone images, acquisition scale checks, near-duplicate review,
uncertainty calibration, non-pasture rejection and mobile performance remain
necessary. A user scope checkbox is not an automatic out-of-distribution detector.
Do not use this experimental module for feeding quantities, toxin clearance,
nutrient concentrations, or production guarantees.
