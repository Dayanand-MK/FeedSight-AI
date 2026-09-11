# Image model development

## Dataset decision

Start with **GrainSet maize v2** for isolated maize-kernel visual classification.
The official annotation file contains 19,000 records: NOR 10,000; MY 1,000;
IM 3,000; BN, SD, AP, F&S and HD 1,000 each. FeedSight maps NOR to
`normal_appearance`, MY to `visible_mould`, and the remaining codes to
`other_defect_or_impurity`. A normal appearance is not evidence of safe feed.

Sources and attribution:

- Fan, Lei; Ding, Yiwen; Fan, Dongdong; Wu, Yong; Chu, Hongxia; Pagnucco,
  Maurice; Song, Yang (2023). *An annotated grain kernel image database for
  visual quality inspection*. Scientific Data 10, 778.
  https://doi.org/10.1038/s41597-023-02660-8
- Maize: https://doi.org/10.6084/m9.figshare.22987562.v2
- Official preview: https://doi.org/10.6084/m9.figshare.22989029.v1
- Author repository: https://github.com/hellodfan/GrainSet
- Dataset licence verified through Figshare API: CC BY 4.0,
  https://creativecommons.org/licenses/by/4.0/
- Changes: maize filtering, exclusion of masks, exact duplicate removal,
  three-class regrouping and new metadata-group partitions. Retain this
  attribution when sharing derivatives.

GrainSet is a starting dataset, not a silage/whole-feed field benchmark. The
soybean dataset https://doi.org/10.17632/xnx9bfbh6b.1 is a possible later
ingredient-specific extension. Do not combine different ingredients blindly.
The smartphone white-maize dataset https://doi.org/10.7910/DVN/IWAUTS is another
candidate, but its healthy/unhealthy labels do not isolate mould.

## Reproduce the first experiment

Run these commands from the repository root in PowerShell. Use a separate image
environment if you want to isolate ML dependencies from the tabular runtime.

```powershell
./.venv-runtime/Scripts/python.exe -m pip install -r requirements-image.txt --extra-index-url https://download.pytorch.org/whl/cpu
./.venv-runtime/Scripts/python.exe -m ai.training.download_grainset --kind preview
./.venv-runtime/Scripts/python.exe -m ai.training.prepare_grainset --archive ai/datasets/image-downloads/GrainSet-tiny.zip --annotations ai/datasets/image-downloads/maize.xml --output ai/datasets/image-prepared/maize-rgb-preview
./.venv-runtime/Scripts/python.exe -m ai.training.train_image --manifest ai/datasets/image-prepared/maize-rgb-preview/manifest.json --output ai/evaluation/image-runs/preview
```

The preview archive is 694,659,886 bytes. The full maize archive is 6,042,360,954
bytes, plus extraction space. To use it, download with `--kind full`, prepare
`maize.zip` into a separate directory, and train on that new manifest.
Downloaded data and experimental checkpoints are excluded from Git.

The baseline freezes pretrained MobileNetV3-Small features and trains a weighted
linear classification head. It chooses the epoch on validation loss and reports
the test confusion matrix and per-class precision/recall/F1 once. It is a baseline,
not an end-to-end fine-tuned model. Standard torchvision weight preprocessing is
used; pretrained weights are fetched from PyTorch on the first run.

Split groups combine source location, collection time and sub-species. All rows
in a group stay together. Groups are only proxies: actual batch IDs are not
available. Exact duplicate files are removed; near-duplicate visual auditing is
still required. The official tiny train/test folders are deliberately regrouped;
these results cannot be compared directly to the authors' benchmark.

## Before enabling analysis in the app

### First completed preview run — 2026-09-11

Both publisher MD5 checksums matched; all 570 selected RGB photographs decoded.
Training/validation/test counts were 398/85/87, with 24/2/3 mould examples.
The frozen-feature baseline trained for 50 epochs and selected epoch 50.
Test accuracy: 80/87 (91.95%); macro F1: 0.7374. Mould recall: **1/3**,
with one mould example predicted normal and one predicted another defect.
This is insufficient for enabling mould analysis. The tiny minority-class test
count makes the apparent overall accuracy especially misleading.

Confusion matrix (rows true, columns predicted; normal, mould, other):

```text
45  1  1
 1  1  1
 2  1 34
```

Local outputs: `ai/evaluation/image-runs/preview/metrics.json` and
`image_baseline.pt` in the same folder. This run verifies the experimental
pipeline, not product readiness.

### Remaining stages

1. Train and inspect the full maize dataset; review errors and near-duplicates.
2. Collect independent phone images of maize with expert labels, recording farm,
   feed batch, phone, lighting and date. Include irrelevant photos, blur,
   shadows and difficult normal/defective examples. Keep whole batches held out.
3. Evaluate missed mould cases, false alarms, class imbalance and uncertainty;
   select thresholds on validation data, then lock them before the field test.
4. Implement and validate an unsupported-image rejection mechanism. Maximum
   softmax confidence alone is not evidence that a photo is in scope.
5. Export and compare browser inference against Python on a fixed fixture set;
   test runtime/memory on target phones and offline service-worker loading.
6. Enable only the validated ingredient scope. Preserve manual safety flags and
   label predictions as visible indicators. Never infer toxin concentrations,
   protein, FQI or feed safety from this classifier.

The current production photo function intentionally remains `analysis: unavailable`.
Neither a preview checkpoint nor a high laboratory test score authorizes a
production safety decision. The original FQI model and workbook are unchanged.
