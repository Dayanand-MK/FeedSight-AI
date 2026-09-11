# Nutrient gap and feed balancing

This additive module extends the existing `withGoal` report pipeline. It is
deterministic local decision support, not another ML model or veterinary treatment.
Image inference, sensor values, NIR references, FQI, speech and saved history are
retained. No new database tables or Supabase migration are needed: the existing
report JSON stores `nutrientBalance` with version, rows, source, benchmark,
animal/goal context, blocking reason and ranked option basis.

## What is compared

Protein and NDF may be compared only against an explicitly entered ingredient
minimum with a nonempty reference and matching `% DM` / `% DM (NDF)` units.
These are user-supplied benchmarks, NOT independently validated animal nutrient
requirements. Energy remains unknown for requirement comparison because no
energy target is supported. Minerals, calcium, phosphorus and dry-matter
requirements are unsupported. The current UI uses fixed units; supplied unit
metadata is validated too. As-fed percentages, g/day, or incompatible energy
units cannot silently create a gap. No automatic conversions are attempted.

Statuses are below supplied benchmark, meets supplied minimum, insufficient
information, and comparison unavailable. No unsupported severity cutoffs or
full-ration adequacy claims are introduced. Farmer-reported values retain
FARMER_INPUT provenance in the new balance snapshot; old USER_REPORTED records
are normalized without rewriting stored history.

## Safety and recommendation rules

1. High-risk safety/mould/foreign-material flags block every option.
2. Storage flags and missing required checks block options.
3. Unknown animal context, calves, and incompatible milk-goal contexts require
   separate feeding guidance before adult complement options are shown.
4. Only documented, unit-compatible below-minimum comparisons unlock categories.
   Meeting a minimum or missing values do not generate a purchase recommendation.
5. Rank by supported gap and the goal's qualitative priority. Health prioritizes
   fiber; other current goals show protein first. These are explanatory product
   priorities, not numeric requirement models or cost optimization.

There are three qualitative categories: protein-rich feed, good-quality
roughage, and professionally balanced concentrate. An option only claims a role
in nutrients it supports. No named commercial product, nutrient concentration,
kg/day, inclusion percentage, profit, milk gain or fertility prediction is made.
All quantities and complete-ration formulas remain unavailable.

Sources, retained in the local knowledge base and visible on selected options:

- NDDB, Compound Cattle Feed: https://www.nddb.org/services/animalnutrition/cattlefeed
- NDDB, Total Mixed Ration: https://www.nddb.coop/services/animalnutrition/crop-residue-management/total-mixed-ration-dry
- NDDB, Ration Balancing Programme: https://www.nddb.coop/services/animalnutrition/programmes/ration-balancing-programme

These sources support qualitative category roles and whole-ration review; they
do not validate our user's entered benchmark or a computed ration. No numerical
feeding advice is copied into the app.

## Interaction and persistence

The existing radar chart now uses only explicitly referenced compatible minima.
It has no invented dairy dietary targets, TDN conversion or nonzero missing-value
markers. Its outer ring is a supplied minimum, not a validated ideal ration.

Tap a nutrient status, inspect its units/source/reference, then choose a supported
option. The explanation displays its role, current goal, limitations and source.
The current/potential table deliberately says 'may support' or 'not evaluated',
never an invented 'improved' nutrient value. Alternative categories are
complements for professional review, not verified substitutions.

Goal switching derives a new balance from the same report without repeating
image/sensor acquisition. Saved snapshots stay immutable; history comparisons
do not overwrite them. Option selection is a UI exploration, not a record that
the farmer fed the ingredient. Speech includes the principal gap and conditional
category, or the blocking reason, in English/Tamil/Hindi. Other current regional
languages retain their existing fallback behavior for new untranslated keys.

Rules, strings and the small category knowledge base are bundled in the PWA.
Offline comparisons need no Supabase. Source links need internet to open, but
the descriptions and decisions are local. Safety warnings remain ahead of
nutrition and recommendations in the report.

## Tests and scope qualifications

Unit tests cover documented protein/fiber gaps, multiple gaps and ranking,
adequate benchmarks/no unnecessary supplement, unknown values, unsupported
minerals, incompatible units, safety/storage blocking, unknown/calf context,
goal switching and unchanged snapshots. Browser coverage exercises the real
offline wizard, category selection, potential-support table, mobile layout,
goal switching and saving.

The requested green-fodder example cannot always unlock an actionable option:
the current pasture category has no validated storage profile, so missing checks
still block balancing. Similarly the requested low-mineral example remains
unknown rather than manufacturing a mineral requirement. These are intentional
data limitations. General-purpose ration formulation is not demo-ready; the
documented ingredient-comparison workflow is the supported prototype.
