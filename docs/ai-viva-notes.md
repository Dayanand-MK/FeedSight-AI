# AI viva notes — actual implementation

**How are complements recommended?** Compatible entered nutrients are compared
with user-documented ingredient minima. A deterministic safety-first engine
selects sourced qualitative complement categories for supported gaps and known
animal contexts. These minima do not establish whole-ration requirements. RGB
images are not assumed to measure nutrients.

**Is recommendation another ML model?** No. Local reference/rule logic is used
for explainability and offline operation. The current/potential visualization
shows a possible nutrient role, not calculated post-feeding composition.

**What prevents over-supplementation?** No option is produced for a met minimum,
unknown comparison, incompatible units, or a blocking safety/storage condition.
No exact quantities or mineral recommendations are fabricated.

- **Dataset?** Local CSIRO Image2Biomass release: 358 photos, 357 labelled and
  one unlabelled example, 3 CSVs. Five rows per labelled image encode five targets.
- **Classes?** None for this model. It predicts green, dead, clover, green dry
  matter and total dry biomass in grams. Species metadata is not a feed classifier.
- **Why MobileNetV3-Small?** The project already uses it; frozen features provide
  a compact, fast CPU baseline and a roughly 3.77 MB ONNX export.
- **Transfer learning?** Reuse ImageNet visual features and fit a new regression
  head to the biomass targets. ImageNet itself does not supply biomass labels.
- **Preprocessing?** Two image halves, 224 × 224 each, explicit nearest sampling,
  RGB ImageNet normalization; average the two feature vectors. No augmentation.
- **Split?** 249/45/63 train/validation/test photos with state/date groups kept
  together. The official unlabelled example is excluded from scoring.
- **Training?** Frozen backbone plus standardized ridge; four validation-only
  alpha candidates. Zero gradient-training epochs. Alpha 1000 selected.
- **Overfitting?** Fitting training details that do not generalize. Group splits,
  regularization and a held-out test reduce but do not eliminate it.
- **Metrics?** Per-target MAE, RMSE and R², plus a training-mean baseline. Total
  biomass: MAE 13.51 g, RMSE 17.53 g, R² 0.580. Clover R² -0.022 is weak.
- **Accuracy/F1/confusion matrix?** Not applicable to continuous regression.
  Confusion matrices count true versus predicted categories for classifiers.
  The older GrainSet preview classifier is a separate experiment.
- **Why no camera nutrients?** These labels are mass components, not protein,
  fiber or toxin measurements. No paired nutrient calibration was supplied.
- **Nutrition source?** Farmer-entered measurements and explicit ingredient
  benchmarks. Broad reference profiles currently have unavailable values; no
  invented composition or universal requirements are supplied.
- **NIR?** Uses spectral measurements and a calibrated property model. Here only
  an optional reference field exists; there is no calibrated NIR inference.
- **Human confirmation?** CSIRO cannot identify feed categories. Farmers confirm
  or change one of six broad manual categories, and separately confirm pasture
  image scope. New categories remain unscored because no storage profiles exist.
- **Confidence?** No calibrated regression interval or category confidence is
  available. The UI says experimental; it never displays a made-up percentage.
- **Gap rules?** Compare available user-entered nutrients to explicitly supplied
  ingredient minima. Missing requirements mean unknown. Safety/storage concerns
  suppress optimization and supplementation advice.
- **Offline?** ONNX runs in-browser after runtime/model assets are cached. No
  Supabase or Python server is needed for the browser inference.
- **Limits?** Small Australian pasture dataset, proxy grouping, no independent
  phone/farm validation, weak clover results, no automatic scope rejection,
  no silage/pellet/mixed-feed classification and no safety certification.
