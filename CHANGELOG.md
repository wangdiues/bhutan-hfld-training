# Changelog

All notable changes to this course are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Site scaffold: Astro + Starlight, configured for GitHub Pages.
- Repository licences (MIT for code, CC BY 4.0 for content), README, contributing guide and citation file.
- `scripts/gee/`: the code from the 13 exercise documents as `.js` files, each with a credit header and links to the original Code Editor scripts (`scripts/convert/extract_scripts.py`). Curly quotes become straight quotes, tabs become 2-space indents, and sentences typed in the code font become comments.
- On-site slide player for the 11 training decks (`/slides/`), with third-party pictures removed.
- Start here page and the Hello Bhutan script.
- Lab 1 (sample size and allocation) and Lab 2 (accuracy and area) calculators.

## Corrections to source material

Each correction made to the original Bhutan ART-TREES HFLD Readiness Training materials (May 2026) is listed here, with the lesson where it appears.

| Source file | Original | Corrected | Lesson |
|---|---|---|---|
| EXERCISE D1_ Writing Custom Functions… | Step-by-step snippets that redeclare the same variables; `StudyArea` is a geometry the learner draws | One script that runs top to bottom; `StudyArea` defaults to Bhutan's boundary (USDOS LSIB) | `scripts/gee/day-1/custom-functions.js` |
| D2-Exercise-Exporting Data | `??` blanks (country name, zoom, dates, export parameters); `Map.centerObject(AOI,?)` | Worked solution for Bhutan, 2023 | `scripts/gee/day-2/import-and-export.js` |
| EXERCISE D5_ PART 1-DETERMINING SAMPLE SIZE | `ee.Dictionary(.reduceRegion(…` and `geometry: .geometry()` (image name missing) | `LULC.reduceRegion(…)`, `LULC.geometry()` | `scripts/gee/day-5/sample-size.js` |
| Exercise D5-Confusion Matrix, Accuracy Assessment, Area Adjustment.xlsx | Non-Forest stratum has no samples, so adjusted areas cover only half the map | The lab warns and does not report an adjusted total | Lab: Accuracy and area estimator |
| Exercise D5-Confusion Matrix, Accuracy Assessment, Area Adjustment.xlsx | Variance terms set to 0 when a cell has fewer than 2 samples | Default follows Olofsson et al. (2014): only strata with fewer than 2 samples are left out; the workbook rule stays as an option | Lab: Accuracy and area estimator |
| Exercise D5-Confusion Matrix, Accuracy Assessment, Area Adjustment.xlsx | Producer's and overall accuracy from raw sample counts | Area-weighted versions added and recommended (Olofsson et al. 2014); sample-count versions kept for comparison | Lab: Accuracy and area estimator |
