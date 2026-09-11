# FeedSight AI

**Know Your Feed. Choose Your Goal. Act with Confidence.**

An offline-first SIH 2026 feed decision-support prototype combining feed quality screening, safety, animal context, farmer goals and batch history.

Farmers often have disconnected measurements and little batch history. FeedSight combines entered observations, optional photos, clearly labelled virtual sensors and laboratory FQI estimates in one local workflow. It does **not** certify feed safety or measure toxins from a camera.

The farmer update adds a five-step **Test my feed → Check feed** journey, four explicit SIH result cards, optional animal/nutrient context, nutritionist-supplied ingredient comparisons, safety-first feed suggestions, local-language **Listen to report** controls, and a dedicated **Storage Monitor**. See [the complete SIH requirement-to-feature mapping](docs/sih-requirements.md), also represented in the application's About / technical details screen.

| SIH requirement | FeedSight implementation and scope |
| --- | --- |
| Nutritional assessment | Nutrition card with entered protein/NDF/energy and source-labelled moisture; unavailable values stay unavailable. |
| Nutrition gaps / feed recommendations | Optional referenced ingredient minima, gap comparison and cautious quantity-free suggestions; no automatic animal requirement. |
| Adulteration / contamination | Dedicated safety card: reported mould/foreign material, inferred fungal risk, toxin confirmation advice; urea/sand/silica remain not tested. |
| Instant farmer advisory | Safety → storage → nutrition priority; “Can I use this feed?” and actionable recommendations. |
| Storage and silage monitoring | Dedicated Storage Monitor, pH where relevant, manual/virtual readings, timestamped history and silage condition. |
| Rapid results | Local checks with immediate result; no artificial delay or cloud inference dependency. |
| Low cost / portability | Smartphone-compatible installable PWA; optional sensors; lab confirmation only for unsupported hazards. |
| Multilingual accessibility | Bundled English/Tamil/Hindi text plus device-native speech controls when a local matching voice exists. |
| Offline operation | Precached PWA, local FQI runtime, local report/rules and IndexedDB. |
| Cloud monitoring | Optional authenticated Supabase synchronization and dashboard; requires project setup. |
| Traceability | Digital Twin, immutable shared report, JSON export and QR with batch/test/score/status/safety/source. |
| AI/ML | Preserved laboratory FQI regressor and transparent risk rules; no new or fabricated accuracy claim. |
| IoT | Virtual Sensor Simulation and normalization adapter; real hardware remains future integration. |
| NIR | Explicit unavailable/integration scope; no physical readings or invented spectra. |
| Computer vision | Local photo input, compression and quality checks; no trained automatic mould/chemical detector is claimed. |
| Predictive advisory | Comparable-source humidity/moisture and score trends prompt re-checks; no invented spoilage date. |

## Run the farmer app

Requires Node.js 22.12+ (tested with 24.14.1). From the repository root:

```powershell
cd frontend
npm ci
npm run dev
```

Open the localhost URL printed by Vite. For installable/offline testing, use the production build:

```powershell
npm run build
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173`, wait for the initial assets/service worker to load, then reload once before disconnecting. PWA installation requires HTTPS or localhost. Development mode is not the offline acceptance environment. No backend, Supabase account, Wokwi or paid AI service is needed for core use.

## Features

- Responsive React interface with local English, Tamil and Hindi translations.
- Manual measurements and an explicitly labelled Virtual Sensor Simulation with reproducible presets.
- Optional image upload/capture, local compression, lighting/detail checks, honest unavailable visual diagnosis.
- Deterministic screening score, per-factor penalties, conservative advisory and risk flags.
- Optional offline laboratory FQI inference using the repository's existing model; ten measured values required.
- IndexedDB batch/test history, digital twin, score trend, declining-score warning and offline QR passport.
- Local profile, JSON backup export, pending/synced/failed status and optional authenticated Supabase synchronization.
- Five-step wizard with “I don't know”; missing checks never produce an invented health score.
- Source-labelled nutrition and ingredient-target gaps; dedicated mould/adulterant/toxin statuses.
- Safety-first feed improvement suggestions, optional animal context and a dedicated Storage Monitor.
- Device-native speech in the selected language with listen, pause/resume, stop and repeat. A matching installed local voice is required; no paid/cloud TTS or unexpected autoplay.
- Installable PWA that precaches app code, translations, icons and the local FQI model.

## Architecture and folders

```text
frontend/       React + Vite PWA; local rules/model runtime; Dexie; QR; translations
ai/datasets/    original workbook, legacy processed data, reproducible validated data
ai/models/      preserved trained model plus optional reproduced validated model
ai/preprocessing/  legacy preprocessing and prepare_validated.py
ai/training/    original training and trial-grouped train_validated.py
ai/inference/   Python predictor and browser model exporter
ai/evaluation/  historical outputs, dataset audit, grouped metrics, parity fixtures
backend/       preserved optional FastAPI, SQLite, simulation and IoT APIs
simulation/    preserved sensor profiles and Python simulator
database/migrations/  additive Supabase RLS schema
tests/         Python integration/data tests
docs/          repository audit, scientific scope, integration documentation
```

```text
Photo + farmer observations + normalized sensor readings
  -> offline rule assessment + optional laboratory FQI estimate
  -> explained screening score + advisory
  -> IndexedDB tests linked to batches
  -> Digital Twin / alerts / QR / backup
  -> optional authenticated Supabase sync when connected
```

The existing module structure and team IoT work are preserved. No new top-level application replaces the repository.

## Dataset and reproducible ML

The actual raw dataset is `ai/datasets/raw/datasilage.xlsx`: four sheets; the main `elab.all` sheet has 1,496 records and 52 columns. The validated preparation retains 1,484 labelled, distinct rows after dropping missing targets and duplicate feature/target rows. Raw and legacy processed datasets are not overwritten. Units and variable meanings come from the workbook dictionary.

The original `.venv` may contain machine-specific paths. Create your own environment with Python 3.12:

```powershell
py -3.12 -m venv .venv-runtime
.venv-runtime\Scripts\python.exe -m pip install -r requirements-core.txt
.venv-runtime\Scripts\python.exe -m ai.training.train_validated
.venv-runtime\Scripts\python.exe -m ai.inference.export_browser
```

`train_validated` runs preprocessing, selects Ridge/Random Forest/Gradient Boosting by grouped training CV, evaluates an untouched trial, and writes separate `validated_metrics.json`, split membership and `fqi_validated.joblib`. The reproduced joblib is ignored by Git. `prepare_validated` can also be run separately with `python -m ai.preprocessing.prepare_validated`. Imputation happens only inside fitted training pipelines.

The executed grouped experiment selected Gradient Boosting: holdout MAE **3.0864**, RMSE **4.5046**, R² **0.8306**. These are FQI regression metrics from one held-out trial, not safety accuracy or external validation. See the generated evaluation JSON for all candidates and fold results.

The browser exporter preserves API compatibility by exporting the **original** model, not silently replacing it with the separate grouped experiment. Its old model-selection/evaluation limitations are documented. The generated browser artifact is included for offline startup. Run export after intentionally updating the source model, then rebuild and run parity tests.

The original `requirements.txt` and older evaluation scripts are preserved for legacy plotting workflows. `requirements-core.txt` is the smaller Python 3.12 environment verified for the current pipeline/API tests.

## Optional backend

```powershell
.venv-runtime\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

API docs are at `http://127.0.0.1:8000/docs`. Core routes include `/api/v1/assess`, `/api/v1/assessments`, `/api/v1/predict-fqi`, `/api/v1/model-info`, `/api/v1/simulation/*`, and the existing `/api/v1/iot/*` routes. Backend SQLite and its legacy Supabase assessment sync are separate from the PWA's IndexedDB synchronization. The backend's historical scoring subset is retained for compatibility; the PWA is the main farmer workflow.

## Optional Supabase sync

1. Apply `database/migrations/001_offline_records.sql` in your own Supabase project's SQL editor. It adds `feedsight_records` and owner RLS without replacing existing backend tables.
2. Copy `frontend/.env.example` to `frontend/.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's public URL and public anon/publishable key. Never use a service-role key in the frontend.
3. Rebuild. In Settings, sign in with an existing email/password account. No email is sent by this app's sign-in flow.
4. Use “Sync my records now”, or explicitly enable reconnect synchronization. Unclaimed tests on this device will belong to that account. Images stay local; only their metadata syncs.

Live Supabase deployment/credentials are not provided by this repository. Local retry/ownership behavior is tested with a simulated service; live database policies and multi-device sync must be verified after configuration. Backend sync uses optional `SUPABASE_ENABLED`, `SUPABASE_URL` and `SUPABASE_KEY`; the old misspelled flag is supported for compatibility. `.env` files are ignored; examples contain no secrets.

If using the separate legacy backend cloud table, also apply `002_optional_legacy_assessment_columns.sql` to permit source provenance and unavailable confidence. It leaves existing rows and tables in place.

## Demo and offline testing

1. Open the production preview, choose English, Tamil or Hindi, and tap **Test my feed**.
2. Step 1: choose feed and name/select a batch. Step 2: upload a clear photo or skip.
3. Step 3: enter known observations, optional animal type and actual nutrient values. Leave unknowns blank. Ingredient target comparisons require an explicit reference, not an invented animal requirement.
4. Step 4: enter storage readings or choose a labelled virtual preset. Tap **Check feed**.
5. Read the four result cards, expand advice/gaps, and use **Listen to report** if a local matching voice is installed.
6. Save; create another check on the same batch using a high-risk preset. Safety warnings block nutrition optimization.
7. Open My feed batches, Digital Twin and QR. Open Storage Monitor to see readings and trends.
8. Turn off network access, reload, create another test and save it. Unknown data stays unavailable.
9. Reconnect; records remain local. Sync only if Supabase is configured.

For physical mobile devices, serve through a trusted HTTPS origin or appropriate localhost tooling; plain HTTP LAN addresses do not provide a secure PWA/camera context.

## Tests

```powershell
.venv-runtime\Scripts\python.exe -m pytest -q
cd frontend
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Python tests exercise API routing, validation, migration preservation, simulation, disabled cloud sync and data splits. Node tests cover scoring, source labels, language completeness, IndexedDB transactions, sync replay/ownership and Python/browser model parity. Playwright tests exercise production service-worker offline reload, images, repeated batch saves, Digital Twin, QR and mobile layout. See `docs/verification.md` for executed outcomes and limitations.

## Limits and future work

Read [Scoring and scientific limitations](docs/scoring-and-limitations.md) before presenting results. Screening thresholds need feed-domain calibration. There is no trained RGB diagnosis, toxin measurement, calibrated confidence, spectral/NIR input or exact spoilage-time forecast. Nutrient columns exist, but a validated nutritional prediction model is not provided. No map or Wokwi integration is needed for this prototype. Tamil/Hindi translations should receive native-speaking farmer review before field deployment.

Future hardware can implement the existing normalized sensor envelope with source, timestamp and units. Real sensor calibration, image labels, external validation, nutrition models, spectral data and production account administration are separate future work.

## Team

SIH 2026 FeedSight AI team. Add confirmed member names and roles here; none have been invented.


## Goal-Based Feed Intelligence

The wizard now uses five simple screens: feed type → optional photo → observations, nutrient values and animal context → main goal → storage and optional laboratory/NIR reference. General Feed Quality is the default; four additional goals are Milk Production Support, Animal Health Support, Reproductive Nutrition Support and Profitability / Feed Efficiency Support.

A deterministic local engine applies **safety → storage/spoilage → nutrition → farmer goal → economics**. Serious safety concerns stop optimization for every goal. Supplied ingredient minima can identify comparison gaps; they are never treated as complete-ration requirements. Missing animal context produces general guidance. Numeric goal scores, universal nutritional requirements, yield increases, fertility predictions and savings are not invented. Suitability remains **Insufficient evidence** until supported; existing concerns show **Needs attention** or **Safety concern — optimization stopped**.

The report shows Nutrition, Feed Safety, Your Goal and Storage cards, followed by actions. Change Goal compares the same assessment without running image/FQI inference again. Before saving, the chosen goal becomes part of the snapshot. After saving, switching is explicitly comparison-only; historical reports and QR keep the recorded goal. Spoken summaries and exports use the currently displayed view, with comparison exports marked as such.

Goal, context, rule version, suitability, explanations and advice are stored in the existing Dexie test snapshot and Supabase JSON payload. No new table or destructive migration is required. Existing records without a goal remain labelled Goal not recorded. Goal history lists actual recorded decisions; it is not a forecast. Storage follow-up checks retain the latest animal context and goal, without carrying forward old measurements.

See [goal engine rules, audit and capability boundaries](docs/goal-based-intelligence.md). CV detection and calibrated NIR estimation remain future integrations; NIR input currently stores only an external report reference.


## Deploy on Vercel

Import this repository with **Root Directory: frontend** and **Framework: Vite**. Add the public Supabase URL/key as Vercel environment variables, then deploy. See [the deployment guide](docs/vercel-deployment.md) for routing, offline caching and account setup.
