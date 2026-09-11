# CSIRO integration verification

Verified locally on 2026-09-11 using the existing project and supplied dataset.

| Check | Result |
|---|---|
| Dataset audit and 358 image decodes | PASS; no exact file duplicates |
| Grouped training/validation/test split | 249 / 45 / 63 |
| Real CPU baseline fit | PASS; four ridge fits, 0 neural epochs |
| PyTorch checkpoint size | 3,844,187 bytes |
| ONNX model size | 3,767,490 bytes |
| Python/ONNX numerical check | PASS; max error 0.00000573 g on fixture |
| Browser/Python total prediction | PASS within displayed 0.1 g precision |
| Browser model after offline reload | PASS in Chromium |
| Missing-model manual fallback | PASS |
| Farmer confirmation, correction and saving | PASS |
| Nutrition source and safety isolation | PASS |
| New feed categories do not inherit dry-feed thresholds | PASS |
| Mobile 390 px layout | PASS; no horizontal overflow |
| Python tests | 23 passed |
| Frontend unit tests | 34 passed |
| Browser test cases | All 12 reported passed |
| Production build | PASS |
| Public deployment | Not performed in this update |

All browser cases reported success, but the Windows preview-server teardown
did not return; the runner was interrupted after the cases completed. This is
not recorded as a clean process-exit pass. Unit tests and build exited normally.

The first missing-model test initially intercepted only page requests while the
service worker fetched the model successfully. It was corrected to disable the
service worker only for that failure test; the separate real offline test retains
the service worker and exercises cached inference.

These tests use a lossless copy of the supplied unlabelled test image, not an
independent farmer-phone validation set. The example has no ground truth and
provides no accuracy estimate. Numerical parity, interface behavior and offline
operation do not establish agronomic validity. Regression performance and weak
clover results are recorded in `ai/README.md` and the local metrics JSON.

Scientifically: biomass is ML-predicted; feed category is farmer-confirmed;
nutrition reference values are unavailable; manual/device/simulated readings
retain separate provenance; goals and safety use existing transparent rules.
NIR and toxin analysis still require appropriate measurement/calibration.

Demo status: **experimental pasture workflow works locally**. A validated
general-purpose feed-image/nutrition demo remains blocked by missing category
training labels, trustworthy specific composition profiles, independent field
validation and calibrated uncertainty/rejection. Vercel has not received this
update. Generated model files must be deliberately included as release assets
before a model-enabled deployment; raw data is not a deployment dependency.
