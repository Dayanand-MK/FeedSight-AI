# Executed verification — 10 September 2026

## Supabase configuration follow-up

- The saved frontend URL/public publishable key reached the live Auth settings endpoint (HTTP 200). Email authentication is enabled and email confirmation is required.
- The live `feedsight_records` endpoint returned HTTP 401 / PostgreSQL 42501 for an unauthenticated request: the table exists and anonymous access is denied. This does not verify authenticated policies or writes.
- Rebuilt the production app with the saved environment and restarted the local preview on port 4173. Verified Settings visibly shows “Cloud configured” and the sign-in form, replacing the old cached, unconfigured build.
- Fixed automatic synchronization after new online saves. Added a signed-in read-connection check, disabled duplicate/offline sync controls, and translated actionable credential/schema/permission/network errors.
- 24 Node tests pass. The existing 8 browser tests pass; an additional browser test passes for invalid credentials, sign-in, connection checking and automatic upload after an online save. All cloud requests in this browser test are explicitly mocked; it creates no live account or cloud record.
- Live authenticated upload/download, cross-account isolation and reconnect synchronization remain pending a user sign-in. No service-role key, account password, or auth token was read or included in source files.

## Farmer-journey update

The update adds the four-step wizard, four requirement cards, shared schema-version-2 reports, nutritionist-supplied ingredient benchmarks, local-device speech, and Storage Monitor. Earlier acceptance results below describe the original baseline; current update results are:

- **22 Node tests passed**: previous parity/storage/sync tests plus incomplete inputs, nutrient provenance, referenced target gaps, safety/storage override, legacy report preservation, QR agreement, same-source trends, local voice selection, preservation of manual hazards during simulation, and null-score sync round trips.
- **17 Python tests passed**: existing backend/ML tests remain green; no model/data changes were required.
- **8 Chromium browser tests passed**: guided journey and four cards, English/Tamil/Hindi, offline reload and saves, storage history/QR, unknown-input reports, nutrition suggestions and safety suppression, offline FQI, unsupported images, storage denial, mobile layout, speech controls and missing-local-voice fallback.
- The production build succeeds and precaches the updated UI, report/rule code, languages and model. Desktop and 390px mobile report screenshots were inspected; no horizontal overflow in the tested mobile flow.
- **Speech-control browser tests use an explicit Web Speech API double.** They verify no autoplay, text/language selection, pause/resume, stop/repeat and missing-local-voice behavior. They do not certify audible pronunciation or installed voices on every farmer's phone.
- **Live Supabase remains unconfigured/unverified.** Existing controlled-service sync tests cover retry/ownership and preservation of the new structured report, including null score. No cloud migration/publication was performed.

For demo instructions and requirement-by-requirement scope, see `docs/sih-requirements.md`.

## Original baseline checks

- `npm run build`: Vite production build and Workbox service worker; 15 precached entries, approximately 755 KiB, including local model and language bundle.
- `npm test`: 11 Node tests. Deterministic risk scenarios, individual moisture/humidity/pH effects, mould risk override, invalid/missing inputs, image-unavailable labels, source normalization, three-language completeness, IndexedDB atomic persistence and batch compatibility, simulated sync failure/retry/account ownership, and local FQI parity.
- `python -m pytest -q`: 17 tests. Existing FQI regression check, assessment route/list, input validation, simulation/source persistence, disabled cloud, legacy SQLite migration preserving rows, missing-model graceful failure, raw hash and trial split verification.
- `npm run test:e2e`: 4 Chromium production-browser tests. Full online/offline farmer workflow, save/reload/reconnect persistence, multiple tests per batch, photo processing, Digital Twin decline notice, QR image generation, cached FQI inference on an offline route, unsupported-file rejection, storage-denied save error, three language views, local profile persistence and 390px mobile layout.
- Real browser/Python parity: 212 complete samples from the actual workbook, absolute difference <1e-8.
- The raw Excel workbook and original trained joblib match Git HEAD SHA256 byte for byte. The legacy processed CSV is unchanged in Git (checkout line endings differ from repository blob encoding).
- Trial-grouped experiment executed: 1,169 training rows, 315 test rows, no shared trial identifiers; all three candidate models compared on training-only grouped folds. Selected Gradient Boosting holdout MAE 3.0864, RMSE 4.5046, R² 0.8306.
- Desktop and mobile screenshots inspected. Full demo captured in `frontend/test-results/`; these transient screenshots are ignored by Git.
- Main end-to-end demo recorded zero browser `pageerror` events.

## Not claimed / requires external setup

- Live Supabase authentication, database RLS execution and real multi-device synchronization were **not** tested against a configured project. Sync tests use a controlled service double. Supabase migrations are supplied, not remotely applied.
- Physical Android/iOS camera capture, OS-level PWA installation, device storage eviction and hardware sensors have not been field tested. Chromium verifies service-worker caching and browser file selection.
- No image disease/mould prediction, chemical measurement, spectral simulation, nutritional model, calibrated safety class or exact spoilage time is claimed. Their absence is explicit in the UI.
- Tamil/Hindi translations are bundled and browser-tested; native-speaking farmer review is still recommended.
- The original Windows virtual environment is broken on this machine; testing used a separate ignored `.venv-runtime` based on Python 3.12.
- Python emits two dependency deprecation warnings (Starlette/httpx and AnyIO). They did not fail tests. No false claim of warning-free dependencies is made.

## Integrity and scope

Existing team changes to `backend/main.py`, `backend/app/api/iot.py` and `backend/app/models/iot_reading.py` were preserved. No commit, push, merge, destructive Git operation or cloud publication was performed. Raw workbook, legacy training model, historical metrics and existing module locations remain intact.


## Live signed-in verification — 11 September 2026

- Used the user's signed-in FeedSight session and enabled sync preference. Created one clearly labelled batch, `DEMO cloud verification 2026-09-11`, with unknown observations and measurements, no photo, and no invented nutrient values.
- Saving triggered a real cloud synchronization. The app displayed Synchronization completed; after reload, history showed exactly one saved test with Synced status and an unavailable score. The batch ID is `fdf61058-08da-401e-b033-7e195f4d578f`.
- A repeat sync remained busy for an extended period. Added a 15-second abort timeout to Supabase HTTP requests and translated aborted requests into a retryable connection error. Reload recovered the session and synchronization completed again.
- 26 frontend unit tests pass, including request timeout/cancellation tests. Production build succeeds. All nine browser test cases reported pass, including the mocked online-save cloud integration case.
- This verifies the current account's app-reported upload acknowledgement and persistence. It does not independently verify a second-device restore, a second account's isolation, or a physical offline/reconnect scenario. No passwords or session tokens were extracted. The labelled demo is retained for review.


## Goal-based intelligence update — 11 September 2026

- Reused the existing workflow and report/sync architecture. Added five-step wizard, five goal choices, optional animal context, deterministic goal-support-1 profiles, safety/storage overrides, goal explanations and view-only saved-report comparison.
- New reports persist goal/context/decision snapshots with existing schemaVersion 2 JSON; historical records are not rewritten. QR includes the saved goal; mock sync upload/download preserves goal and animal context exactly, including unavailable scores.
- 31 frontend unit tests passed: all goals, safety suppression in English/Tamil/Hindi speech, storage priority, referenced gaps, animal input validation, immutable saved comparisons, QR/history and sync round trips.
- Full 10-case Chromium browser suite passed. A focused goal-flow rerun at 390px passed after final formatting/build, including offline switching, selected-goal speech, multilingual UI, save/reload and original-goal history. Mobile goal-picker and goal-history screenshots inspected. No horizontal overflow in the tested mobile goal picker.
- Production build passed; 15 precached entries, approximately 846 KiB. New goal rules and translations work offline.
- Goal status remains insufficient evidence without validated animal requirements. Numeric goal score, economic savings and complete-ration adequacy are not fabricated. CV and calibrated NIR remain unavailable; optional NIR input records a reference only. Toxin status requires confirmation, with no chemical result.
- No live cloud goal records were created in these automated checks; previous live account verification is recorded separately above. Native speech pronunciation and expert review remain external acceptance steps.
