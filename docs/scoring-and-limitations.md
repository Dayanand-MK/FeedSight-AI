# Scientific scope and screening calculation

The Feed Health Score is an **unvalidated prototype screening index**. It is not a feed-quality classifier, toxin test, nutritional adequacy assessment, or veterinary diagnosis. A score of 100 means no configured flags fired; it does not mean safe feed. No confidence percentage is provided.

## Deterministic calculation — screening-2

Start at 100, subtract every triggered penalty, and clamp at zero.

| Entered or simulated condition | Penalty | Subscore domain |
| --- | ---: | --- |
| Maize silage moisture >70% wet basis; dry feed >15% | 20 | Storage |
| Temperature >35°C | 20 | Freshness |
| Humidity >80% | 15 | Storage |
| Maize silage pH <3 or >4.5 | 20 | Freshness |
| Farmer reports possible mould | 50 | Safety concern |
| Farmer reports unusual smell | 20 | Freshness |
| Farmer reports possible foreign material | 50 | Safety concern |

For new guided reports, risk is high if mould/foreign material is reported or the raw score is <50. Any other configured flag produces “needs attention”/moderate indicated risk. With no flags and complete core checks, risk is low indicated risk. Temperature, humidity, moisture, silage pH where applicable, and known mould/smell observations are required to show a numeric score. Missing core checks yield a null score; known hazards still produce risk warnings. No flags with incomplete checks means unknown, never 100. Storage age can remain unknown without blocking a score.

Nutrition and chemical-safety subscores remain unavailable. The overall score is not an average of nutrition and storage. All thresholds are prototype choices, not published universal feed standards. Appropriate ranges vary with feed type, dry matter, ambient conditions and ensiling; expert calibration remains necessary. Existing screening-1 test scores remain unchanged in historical records.

Storage age is retained for history, but no unsupported age-to-spoilage formula is applied. A declining score compares the two latest tests; changing simulation/manual inputs can cause that trend. No exact future spoilage time is predicted. Alerts are the stored test's risk flags and declining-history notice, not a background physical monitoring service.

The original backend endpoint retains its four-input rule subset and legacy Good/Moderate/Poor names for compatibility. These are rule categories, not learned labels. The farmer PWA now has seven screening flags. Do not interchange historical/backend and current score versions.

## Entered nutrition and recommendations

`frontend/src/config/nutritionProfiles.js` deliberately contains null animal requirement minima. Crude protein and NDF fiber can be compared only to a matching ingredient target explicitly supplied by the user with a nutritionist/reference name. Inputs and minimums use percent dry matter. The gap is a percentage-point difference, not a daily animal deficit. No requirement is inferred from animal type alone; no claim is made that a single ingredient forms a balanced ration. Energy and mineral adequacy remain unavailable without a validated requirement/profile. Numerical input bounds are validation limits, not nutritional thresholds.

Priority is safety → storage → nutrition. Serious risk suppresses protein/fiber supplement suggestions and directs isolation, no mixing and confirmation. Storage flags postpone optimization until storage/spoilage is checked. Missing checks request more information. Only otherwise can a below-target protein or NDF result produce cautious, quantity-free guidance. Changing virtual sensor presets cannot remove explicitly entered manual observations.

## Spoken report

The same report snapshot drives written and spoken advice. Speech never autoplays; only matching local device voices are selected. Simulation is announced in the spoken summary. Language changes, stop and component unmount cancel speech. Missing English/Tamil/Hindi voices leave the written report accessible, without remote speech fallback. Browser speech control tests use an explicit API double; physical-device pronunciation is a separate field check.

## What the data supports

`datasilage.xlsx` is preserved byte for byte. Its dictionary describes pH; ammonia as Namm/Ntotal percent; dry matter percent; acids, starch and other components as percent dry matter. The main sheet contains nutrient measurements, a continuous FQI and trial identifiers. NIR instrument names in `ref.fresh` / `ref.silage` are provenance, not raw spectra. No RGB image training set exists.

The browser's optional FQI estimator uses the existing 200-tree Gradient Boosting model, exported to JSON. All ten actual laboratory values are required. Inputs outside individual observed dataset ranges are refused; being inside each range does not establish that a new combination is in distribution. The result stays separate from the Health Score. Export parity is checked against Python predictions from real complete dataset rows.

Legacy model evaluation selected among candidates on the test split and used globally imputed data. Historical results remain for provenance and are not advertised as independent accuracy. The new pipeline saves a separate model and uses training-only median imputation, trial-grouped cross-validation to select candidates, and one untouched trial for final evaluation. There are only five trial groups, and this is not external validation. The FQI definition itself depends on fermentation characteristics, so estimating it from such variables cannot validate chemical safety.

Classification accuracy, confusion matrices and Good/Moderate/Poor learned classes are inapplicable to this regression target. Nutritional target columns exist, but no validated nutrition-prediction task has been established. Available manual lab values are retained; unsupported outputs remain unavailable.

## Images and sensors

Photos are validated for format and size, resized locally, and checked with simple brightness/detail heuristics. These checks are not mould detection or a calibrated blur classifier. Photos cannot measure protein, aflatoxin, minerals, pH or NIR spectra. Mould and smell flags are explicitly farmer reported.

Every sensor bundle carries source (`manual`, `virtual`, `dataset`, `device`), time and units. The current UI enables manual and virtual input. Future device adapters must validate units and calibration before using the shared interface. No future adapter or Wokwi connection is claimed to be implemented in the PWA.

## Storage, synchronization and privacy

Tests, compressed images, scores, advisories and batch relationships are committed in one IndexedDB transaction. Browser storage is device/browser specific and may be cleared or evicted; JSON export provides a manual backup. Cloud sync is optional and uploads image metadata only, not image content.

`feedsight_records` is an additive Supabase table protected by authenticated owner RLS. UUID test IDs make upserts replay safe. Tests are immutable after saving. A pending local test is claimed by the signed-in account before upload. Failed or ambiguous uploads retain that owner so account switching cannot send the same test to another account. Reconnect sync is opt-in, and explicit sync claims unowned local tests for the current account. Downloads are paginated and fill missing immutable records without replacing local records or photos.

Local history remains visible on this browser after signing out; use a separate browser profile on shared devices. This is not per-user encrypted local storage. Production deployments still require account setup, RLS verification against the chosen Supabase project, backups and device security review.
