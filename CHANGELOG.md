# Changelog

All notable changes to this course are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Site scaffold: Astro + Starlight, configured for GitHub Pages.
- Repository licences (MIT for code, CC BY 4.0 for content), README, contributing guide and citation file.
- `scripts/gee/`: the code from the 13 exercise documents as `.js` files, each with a credit header and links to the original Code Editor scripts (`scripts/convert/extract_scripts.py`). Curly quotes become straight quotes, tabs become 2-space indents, and sentences typed in the code font become comments.

## Corrections to source material

Each correction made to the original Bhutan ART-TREES HFLD Readiness Training materials (May 2026) is listed here, with the lesson where it appears.

| Source file | Original | Corrected | Lesson |
|---|---|---|---|
| EXERCISE D1_ Writing Custom Functions… | Step-by-step snippets that redeclare the same variables; `StudyArea` is a geometry the learner draws | One script that runs top to bottom; `StudyArea` defaults to Bhutan's boundary (USDOS LSIB) | `scripts/gee/day-1/custom-functions.js` |
| D2-Exercise-Exporting Data | `??` blanks (country name, zoom, dates, export parameters); `Map.centerObject(AOI,?)` | Worked solution for Bhutan, 2023 | `scripts/gee/day-2/import-and-export.js` |
| EXERCISE D5_ PART 1-DETERMINING SAMPLE SIZE | `ee.Dictionary(.reduceRegion(…` and `geometry: .geometry()` (image name missing) | `LULC.reduceRegion(…)`, `LULC.geometry()` | `scripts/gee/day-5/sample-size.js` |
