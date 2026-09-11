> Current goal-based extension: see [Goal-Based Feed Intelligence](goal-based-intelligence.md). The wizard now has five steps (goal selection is step 4, storage is step 5). The four primary cards are Nutrition, Feed Safety, Your Goal and Storage; actions remain below them. The earlier baseline mapping below is retained for context.

# SIH requirement mapping — farmer journey update

## Audit of the previous implementation

Preserved: trained FQI model and exporter, raw workbook, offline PWA caching, Dexie database, optional Supabase synchronization, batch Digital Twin, QR generation, three languages and backend/IoT work.

Updated gaps: single long form → four-step wizard; placeholder nutrition text → source-labelled nutrient card and explicit benchmark comparison; combined disclaimer → dedicated contaminant status card; generic advisory → ordered safety/storage/nutrition recommendations; history-only storage display → dedicated Storage Monitor; no audio → local device speech controls. No repository restructuring or model retraining was required for this update.

## Visible coverage and honest limits

| SIH requirement | Visible implementation | Demo / limit |
| --- | --- | --- |
| Nutritional quality | Nutrition Quality card: crude protein, moisture, NDF fiber, energy and mineral status | Enter actual lab/feed-label values. Missing values stay unavailable; minerals require testing. |
| Nutrition gap | Expand Nutrition Gap; optional nutritionist-supplied ingredient minimums in Step 3 | Same dry-matter units; target reference required. No universal animal requirement is invented. |
| Feed recommendations | “What can I give with this feed?” | Protein/NDF below a supplied ingredient minimum gives a conditional suggestion. No kilogram doses or complete-ration adequacy claim. |
| Animal context | Optional lactating cow, dry cow, heifer or calf selection | Context-specific professional guidance; profiles have no unsupported numeric requirements. |
| Adulteration / contamination | Dedicated Feed Safety card | Visible mould/foreign material are reported observations; fungal risk is inferred only from reported mould. Urea and sand/silica are not tested. |
| Toxin safety | Aflatoxin/mycotoxin status and laboratory-confirmation advice | No camera concentration measurement or negative chemical clearance. |
| Immediate advisory | “Can I use this feed?” and “What should I do?” | Serious risk → do not use until checked, isolate, do not mix, confirm. Nutrition optimization is blocked. |
| Storage monitoring | Storage Monitor action on home/navigation | Latest saved temperature, humidity, moisture, pH where relevant, age, source, timestamp and advice; record a new check on that batch. |
| Silage monitoring | Silage Condition details and silage-specific pH rules | Existing optional laboratory FQI estimate remains separate. Without the ten inputs, fermentation quality is unavailable. |
| Predictive advisory | Digital Twin and Storage Monitor trend warnings | Compare actual stored readings from the same source; rising humidity/moisture or declining score prompts inspection. No predicted spoilage date. |
| Rapid results | Local synchronous checks and immediate report | No paid/cloud request or artificial wait is added. |
| Low cost / portable | Mobile-friendly installable PWA | Smartphone sufficient for basic screening. Laboratory confirmation still needed for certain hazards. |
| Multilingual | English, Tamil and Hindi, bundled locally | Onboarding language choice, translated wizard, cards, advice and spoken text. Native-speaker field review remains recommended. |
| Text-to-speech | Listen, pause/resume, stop, repeat; written spoken summary | User-triggered Web Speech API with matching `localService` voice only. Missing local voice does not fall back to paid/cloud speech or the wrong language. |
| Offline | Service-worker cache, local report building and IndexedDB | Reload offline, test, read/listen if a local voice exists, save and show history/QR. |
| Cloud monitoring | Existing optional authenticated Supabase sync and dashboard | Structured reports, source history and traceability use the existing JSON payload schema. Live project/RLS setup remains external. |
| Traceability | Batch ID, test time, score/status/source and safety state in QR | Same immutable report powers UI, speech, history, backup/report export and synchronized payload. |
| AI/ML | Existing browser FQI regressor for complete lab inputs; transparent screening rules | No claimed new model, fabricated metrics or learned safety classes. |
| IoT | Virtual Sensor Simulation + source/unit adapter | Presets are labelled; manually reported hazards are preserved when changing a simulation preset. Real sensor hardware remains future work. |
| Computer vision | Photo selection/capture, compression and quality checks | No trained automatic mould/chemical detector exists; this remains explicitly unavailable. |
| NIR | About page explains integration scope | No spectra or hardware exist here. No simulated spectral curves or fake NIR prediction is created. |

## Four-step farmer demo

1. Choose the interface language and press **Test my feed**.
2. Step 1: select maize silage or dry feed; name a new batch or choose an existing one.
3. Step 2: upload a clear photo or continue without one. Photo-quality guidance is shown.
4. Step 3: enter known observations, optionally animal type and actual lab/feed-label nutrient values. Unknown is a first-class choice.
5. Step 4: enter known storage readings, or explicitly choose Virtual Sensor Simulation. Press **Check feed**.
6. Read **Can I use this feed?**, then the four cards. Expand nutrition gaps or recommendations if needed.
7. Press **Listen to report**. With an installed local matching voice, test pause/resume, stop and repeat. Otherwise use the written translated summary.
8. Save, open My Feed Batches/Digital Twin and QR, then Storage Monitor. Record another check on the same batch.
9. Disconnect, reload and repeat. Reconnect and sync if Supabase is configured.

## Nutrition-gap demonstration without fabricated measurements

Use actual lab/label data for real assessments. Automated tests use explicitly synthetic test fixtures, never records presented as real measurements. To demonstrate comparison interactively, enter a **clearly labelled demo** value and a **clearly labelled demo ingredient target reference**, then explain it is only demonstrating the rules. Numeric minima are not built into animal profiles.

The application compares crude protein and NDF percentages on a dry-matter basis. It reports `max(0, target - entered value)` in percentage points. “Meets supplied minimum” means only that comparison; it is not nutritional adequacy. Energy is retained when entered but has no inferred requirement; mineral balance is not established.

## Snapshot compatibility

Reports use `schemaVersion: 2` with `overall`, `nutrition`, `safety`, `storage`, `silage`, `recommendations`, `feedSuggestions`, `confidence`, `limitations`, `timestamp`, and `batchId`. Score/risk aliases remain for existing dashboard code. Old records are projected for display from their saved inputs while retaining historical scores; old records are not overwritten or re-scored in storage. Unknown scores remain `null`, including through sync and QR, and are excluded from average-score statistics.
