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
| D1 Introduction to GEE: Features, Capabilities, and Access | Sign-up link `earthengine.google.com/signup/` | Cloud project registration (`code.earthengine.google.com/register`), explained in Start here | Introduction to Earth Engine |
| D1 Introduction to GEE: Features, Capabilities, and Access | "What can Earth Engine do?" shown as Google figures, no code | Original Thimphu script demonstrating the five operations (JS and geemap); catalog size figures ("100 petabytes", "millions of images") replaced by the cited "multi-petabyte" (Gorelick et al. 2017); Google, SERVIR and Esri figures not reused | Introduction to Earth Engine |
| D1 EXPLORING DATA ARCHIVE IN GEE | Malaysian examples (`'Johor'`, `['Johor','Kedah','Kelantan','Melaka']`) and "Manila" | Thimphu and other Bhutanese places | Code editor and data catalog |
| D1 EXPLORING DATA ARCHIVE IN GEE | `'coordinates': [83.63, 27.47]`, `'population': 114,551` | `[89.64, 27.47]`, `114551` | Code editor and data catalog |
| D1 EXPLORING DATA ARCHIVE IN GEE | `aoi` drawn on the map; GAUL loaded but not used | `aoi` = 10 km around Thimphu in code; GAUL filtered to Bhutan and displayed | Code editor and data catalog |
| D1 EXPLORING DATA ARCHIVE IN GEE | Sentinel-2 IDs `COPERNICUS/S2`, `COPERNICUS/S2_SR` (deprecated); ID table showing tile T47NQD | `COPERNICUS/S2_HARMONIZED`, `COPERNICUS/S2_SR_HARMONIZED`; ID table for the image used in the code (T45RYL) | Code editor and data catalog |
| EXERCISE D1_ JAVASCRIPT BASICS IN GOOGLE EARTH ENGINE | `cityData` for Thimphu: `'population': 787000, 'land_area': 1748.59` | `'population': 114551` (Thimphu Thromde, 2017 census), `'coordinates': [89.64, 27.47]` | JavaScript basics |
| D1 EXPLORING DATA ARCHIVE IN GEE | Slide 19 redeclares `cloudfreeImg` and `rgbParams` | Course script renames it `s2CloudfreeImg` and reuses slide 16's `rgbParams`, so all slides run as one script (the lesson shows the slide code unchanged) | `scripts/gee/day-1/code-editor-and-data-catalog.js` |
| D1 EXPLORING DATA ARCHIVE IN GEE | Slide 24: book cover and QR codes | Text links to the EEFA book and Open Geo Blog under Further learning | Code editor and data catalog |
| EXERCISE D1_ JAVASCRIPT BASICS IN GOOGLE EARTH ENGINE | No practice task | Fill-in task (a Paro object and point) with `scripts/gee/day-1/javascript-basics-solution.js`, and a from-scratch task | JavaScript basics |
| D1 WORKING WITH IMAGE COLLECTIONS | Region reduction over `santaCruz.geometry()` (undefined; not Bhutan) | Paro valley rectangle; slide snippets joined into one runnable script | Image collections, filtering and reducers |
| D1 WORKING WITH IMAGE COLLECTIONS | "Landsat … 16-day revisit"; "Sentinel-2 … 10-day revisit globally"; Landsat 5 MSS/TM at 30 m | 16 days per Landsat satellite, 8 with Landsat 8 and 9; 10 days per Sentinel-2 satellite, 5 with two; Landsat 5 MSS 60 m, TM 30 m | Image collections, filtering and reducers |
| EXERCISE D1_ Writing Custom Functions… | "Draw a polygon … around Manila or your hometown" | Draw around a Dzongkhag or home town; the course script defaults to Bhutan's boundary | Custom functions and mapping |
| EXERCISE D1_ Writing Custom Functions… | No practice task | From-scratch NDVI exercise with `scripts/gee/day-1/custom-functions-solution.js` | Custom functions and mapping |
| D1 WORKING WITH IMAGE COLLECTIONS | Slide 13 (screenshot): Landsat 8 SR over Utah, `filterDate('2021-05-01','2021-06-01')`; slide 10 `img` undefined; slide 12 palette without a band | Sentinel-2 SR over Paro, Jan–Apr 2025, with a cloud filter; `img` = least cloudy image; palette applied to SRTM elevation | Image collections, filtering and reducers |
| EXERCISE D1_ Writing Custom Functions… | Part 6 step: `return LC8_image.mask(cloudmask);` (contradicts the exercise's own full script) | `return image.mask(cloudmask);` | Custom functions and mapping |
| EXERCISE D1_ Writing Custom Functions… | Layers "Landsat Collection" and "Landsat 8 in study region" shown on load; extra calls `calculate_Sum(790, 1.555)`, `calculate_Sum(133, 765)`; optional `print(L8_StudyArea)`; note that images can be clipped but collections cannot | Those two layers start hidden (`false`), to load faster; the extra calls, the optional print and the clipping note are left out of the course script | Custom functions and mapping |
| D2-Fundamentals_of_RS | Title slide repeats "Introduction to Google Earth Engine"; NASA ARSET and Earth Observatory figures; temporal resolution defined as "the time it takes a satellite to complete one orbit cycle" | Lesson titled "Fundamentals of remote sensing"; original reflectance diagram and tables instead of the figures; temporal resolution defined as revisit time; Sentinel-2 added to the resolution tables | Fundamentals of remote sensing |
| D2-Fundamentals_of_RS | Sun-synchronous satellite "passing the city of Paris every day at noon"; multispectral "3 to 10 bands"; MODIS revisit 2 days; commercial (OrbView) 1–2 days | Same local solar time at each pass (Landsat every 16 days); about 3 to 15 bands (Landsat 11, Sentinel-2 13); MODIS 1–2 days; commercial daily or better | Fundamentals of remote sensing |
| D2-Exercise-Calculating spectral indices… | Two different indices both named NDWI: (Green − NIR)/(Green + NIR) in 1.2 and (NIR − SWIR-1)/(NIR + SWIR-1) in the collection section | The second renamed NDMI (moisture), with a note on both | Spectral indices and functions |
| D2-Exercise-Calculating spectral indices… | EVI and SAVI computed from raw Sentinel-2 values (reflectance × 10,000) with constants that assume 0–1 reflectance | Bands divided by 10,000 before EVI and SAVI | Spectral indices and functions |
| D2-Exercise-Calculating spectral indices… | `var aoi = geometry;` (drawn); every section repeated as "full code"; a final section repeating Day 1's collection code | `aoi` = point at Thimphu; one curated script; the repeated Day 1 section left out | `scripts/gee/day-2/spectral-indices.js` |
