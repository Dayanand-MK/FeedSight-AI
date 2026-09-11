# Dataset audit — CSIRO biomass

Local root: `ai/datasets/csiro-biomass`. Audit generated from files, not inferred
from the folder name. Run `python -m ai.training.biomass audit` to reproduce.

| Item | Observed |
|---|---:|
| Files | 361 |
| Total bytes | 1,113,130,674 |
| JPEG images | 358 |
| CSV files | 3 |
| JSON/XML/TXT annotation files | 0 |
| Labelled photos in train | 357 |
| Long-format training rows | 1,785 |
| Unlabelled photos in test | 1 |
| Image dimensions | 2,000 × 1,000 |
| State/date groups | 30 |
| Metadata species strings | 15 |
| Exact file duplicates / unreadable photos | 0 / 0 |

```text
csiro-biomass/
  train.csv              five targets per image
  test.csv               target requests, no ground truth
  sample_submission.csv  submission template, NOT labels
  train/                 357 images
  test/                  1 image
```

The broader `ai/datasets` inventory also contains the original silage workbook,
processed tabular CSVs, GrainSet preview archive/annotations and 570 prepared
maize PNGs. Those data are not mixed into CSIRO training.

## Supported task

Multi-output regression in grams: `Dry_Green_g`, `Dry_Dead_g`, `Dry_Clover_g`,
`GDM_g`, `Dry_Total_g`. Each labelled photo has all five targets. Target range
checks reject negative, missing and nonfinite values. Metadata contains sampling
date, state, species, NDVI and height. The baseline uses **images only**; metadata
is used to group the split, not as unavailable inference features.

This is not a classifier for silage, straw, pellets or mixed rations. Species
metadata is not silently converted into those categories. It contains no
protein, NDF, mineral, energy or toxin targets and no NIR spectra. Dry biomass in
grams is not dry-matter concentration or moisture percentage.

The official local test example is unlabelled and cannot produce evaluation
metrics. We split the 357 labelled images into **249 train / 45 validation / 63
held-out test** using state/date groups and seeds 42/43. All five measurements
for one image remain in one row and split. No farm IDs exist locally; group
protection does not prove independence between farms or eliminate visual
near-duplicates. Near-duplicate and independent phone-photo audits remain open.

## Provenance and scope

Qiyu Liao et al., *Estimating Pasture Biomass from Top-View Images: A Dataset for
Precision Agriculture*, https://arxiv.org/abs/2510.22916, describes 70 × 30 cm
pasture quadrats. Its full source collection is larger than this local Kaggle
release; do not claim its full image count was used here.

Official release: https://www.kaggle.com/competitions/csiro-biomass/data
Competition terms: https://www.kaggle.com/competitions/csiro-biomass/rules
No licence file was provided in the local folder; the rules page did not expose
readable terms to the research tool. Do not assign GrainSet's CC BY licence to
CSIRO. Raw data remains local and excluded from Git.

Prepared output: `ai/processed/csiro-biomass/dataset_index.csv` and `audit.json`.
Raw files are never rewritten. The index records source path, SHA256, five
targets, metadata group and split.
