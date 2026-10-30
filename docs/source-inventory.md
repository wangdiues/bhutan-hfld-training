# Source inventory

Maps every file in the original training folder (`Bhutan ART-TREES HFLD Readiness Training/`, read-only, not in this repo) to the website task that uses it. It also lists every GEE script link and every dataset or asset the materials use.

Generated 2026-10-26 (task M0-04). 32 files: 1 agenda, 14 slide decks, 15 exercise documents (4 are duplicates), 2 workbooks.

## File → lesson map

| # | Source file (relative to SRC) | Type | Website task | Notes |
|---|---|---|---|---|
| 1 | `Bhutan ART-TREES HFLD Readiness Training.docx` | Agenda | M4-00, M6-04, M0-06 | Daily objectives → learning outcomes; timings → trainer mode |
| 2 | `Day 1/D1 Introduction to GEE_ Features, Capabilities, and Access.pptx` | Slides | M4-02 | |
| 3 | `Day 1/D1 EXPLORING DATA ARCHIVE IN GEE.pptx` | Slides | M4-03 | Fix the Johor/Manila examples, the Thimphu coordinates and `114,551` |
| 4 | `Day 1/D1 WORKING WITH IMAGE COLLECTIONS.pptx` | Slides | M4-05 | |
| 5 | `Day 1/EXERCISE D1_ JAVASCRIPT BASICS IN GOOGLE EARTH ENGINE.docx` | Exercise | M4-04 | |
| 6 | `Day 1/EXERCISE D1_ Writing Custom Functions and Mapping Across Image Collections.docx` | Exercise | M4-06 | |
| 7 | `Day 1/EXERCISE D1_ Writing Custom Functions and Mapping Across Image Collections(1).docx` | — | — | **Duplicate of #6** (identical text) |
| 8 | `Day 2/D2-Fundamentals_of_RS.pptx` | Slides | M4-08, M4-39 | Title slide duplicates the Intro-to-GEE title; ARSET figures not reusable |
| 9 | `Day 2/D2-Exercise-Calculating spectral indices and working with functions.docx` | Exercise | M4-09 | |
| 10 | `Day 2/D2-Exercise-Calculating spectral indices and working with functions(1).docx` | — | — | **Duplicate of #9** |
| 11 | `Day 2/D2-Creating Mosaics and Composites from Image Collections.pptx` | Slides | M4-10, M4-39 | |
| 12 | `Day 2/D2-Bhutan_MRV_S2_Composite_Manual.docx` | Manual | M4-11 | Steps are numbered with gaps (5→7, 9→12); renumber |
| 13 | `Day 2/D2-Bhutan_MRV_S2_Composite_Manual(1).docx` | — | — | **Duplicate of #12** |
| 14 | `Day 2/D2-Bhutan_MRV_Landsat_Optical_Composite.docx` | Manual | M4-12 | Steps are numbered with a gap (5→7); renumber |
| 15 | `Day 2/D2-Importing and Exporting Datasets with Google Earth Engine (GEE).pptx` | Slides | M4-13 | Fix the "toDrive … imagery" wording on the vector-export slides |
| 16 | `Day 2/D2-Exercise-Exporting Data.docx` | Exercise | M4-13 | |
| 17 | `Day 3/D3 INTRO TO RANDOM FOREST.pptx` | Slides | M4-15, M4-39, M5-06 | Fruit-bowl example → Lab 4 |
| 18 | `Day 3/EXERCISE D3_ Calculating covariates for HFLD.docx` | Exercise | M4-16 | |
| 19 | `Day 3/EXERCISE D3_ Part 2- Forest Probability Layers-…MACHINE LEARNING.docx` | Exercise | M4-17 | |
| 20 | `Day 4/EXERCISE D3_ Part 2- Forest Probability Layers-…MACHINE LEARNING.docx` | — | — | **Duplicate of #19** |
| 21 | `Day 4/D4 RLCMS - GENERAL OVERVIEW AND TERMS TO KNOW.pptx` | Slides | M4-20, M4-39, M4-36 | Glossary terms; fix the typos |
| 22 | `Day 4/EXERCISE D3_ Part 1-Collecting Training Data-…Random Forest Model.docx` | Exercise | M4-21 | Filed under Day 4 with a "D3" label; the site files it under Day 4 |
| 23 | `Day 4/EXERCISE D3_ Final- Assemblage-DECISION TREE RULE.docx` | Exercise | M4-22, M5-07 | Rules → Lab 5 |
| 24 | `Day 4/D4-Use of Google_s Satellite Embedding dataset.pptx` | Slides | M4-23, M4-39, M5-08 | DeepMind figures not reusable; link to the sources instead |
| 25 | `Day 4/EXERCISE D4_ Land Cover Classification and Cosine Simarity Using AFE.docx` | Exercise | M4-24 | "Simarity" → "Similarity" |
| 26 | `Day 5/D5-Designing a Stratified Random Sampling Frame.pptx` | Slides | M4-27 | Refers to "EXERCISE D4 Part 1/2"; these are Day 5 exercises |
| 27 | `Day 5/D5-Accuracy Assessment and Area Adjustment.pptx` | Slides | M4-30 | Uncertainty example: the SE should be 1,495 ha (slide: 1,435); ±2,459 ha and 18.5% are right; check the ">90%" claim against TREES 3.0 |
| 28 | `Day 5/EXERCISE D5_ PART 1-DETERMINING SAMPLE SIZE.docx` | Exercise | M4-28 | |
| 29 | `Day 5/EXERCISE D5_ PART 2-CREATING A STRATIFIED SAMPLING DESIGN IN GOOGLE EARTH ENGINE.docx` | Exercise | M4-29 | |
| 30 | `Day 5/EXERCISE D5_ Group Activity.docx` | Activity | M6-03 | The capstone |
| 31 | `Day 5/Exercise D5-Sample Size Calculator.xlsx` | Workbook | M2-05, M5-01, M5-02 | Sheets: Strata Calculator, strata report |
| 32 | `Day 5/Exercise D5-Confusion Matrix, Accuracy Assessment, Area Adjustment.xlsx` | Workbook | M2-05, M5-01, M5-03 | Example Non-Forest row is all zeros (0/0) |

All 28 non-duplicate files are assigned to a task.

## GEE script links (Code Editor)

These links can break when their owner deletes or edits the script, so each script is copied into `scripts/gee/` (task M2-02). The agenda links have no matching exercise document.

| Script link | Found in | Lesson |
|---|---|---|
| https://code.earthengine.google.com/07e09f6a0fdedb1b38670a947468216a | D1 Intro to GEE (load shapefiles) | M4-02 |
| https://code.earthengine.google.com/21c76e4eb38c13c52de23ef89f52106f | D1 Image Collections (median reducer) | M4-05 |
| https://code.earthengine.google.com/cb215b5eb73dd292017702673523ee7f | D1 Image Collections (reduceRegion) | M4-05 |
| https://code.earthengine.google.com/946119d88943098d0e8c6bc7fb7bcc12 | D2 Spectral indices exercise | M4-09 |
| https://code.earthengine.google.com/2fd4b21119ef4b9c6ff6893f3a7e9c9e | D2 Mosaics & composites (main script) | M4-10 |
| https://code.earthengine.google.com/53d893180be40059cfde3df41385950a | D2 S2 MRV composite manual | M4-11 |
| https://code.earthengine.google.com/d294311d88eee5ab7cb82a26bbf33640 | D2 Landsat MRV composite manual | M4-12 |
| https://code.earthengine.google.com/0769e2dbd6752d9dbf8ed8c2da1743fe | D2 Import/Export (export assignment) | M4-13 |
| https://code.earthengine.google.com/c86323c2a144391b5218fb1d5d9e465f | D3 Covariates | M4-16 |
| https://code.earthengine.google.com/f6ac698d62c5a93294b37c210166c41c | D3 Covariates | M4-16 |
| https://code.earthengine.google.com/20a6b64518a83c65143487aaf9822564 | D3 Forest primitives | M4-17 |
| https://code.earthengine.google.com/91884902c514d78c3e0d5295c3f64269 | Agenda, Day 4 morning | M4-18 / M4-21 (confirm) |
| https://code.earthengine.google.com/2e8eb732cb861c1c6ac2d21af5db851a | Agenda, "Change" | M4-18 |
| https://code.earthengine.google.com/49b9fc4c9f6ad7e7a8c58933f3aba994 | D4 Collecting training data | M4-21 |
| https://code.earthengine.google.com/cca70a27a7d28a5fe8bd1e03b88ec6ba | D4 Collecting training data | M4-21 |
| https://code.earthengine.google.com/f3ac214d04f1543897bba62c26a9a878 | D4 Assemblage | M4-22 |
| https://code.earthengine.google.com/e9cc6d5ad7f1132030791245670f609b | D4 Embeddings deck (forest change 2017–2025) | M4-23 |
| https://code.earthengine.google.com/3e5c458b88e2bae62b81fe5827ce7408 | D4 Embeddings deck (training data) | M4-23 |
| https://code.earthengine.google.com/e28d66abd6404cea19f8f79844b0f9a2 | D4 Embeddings deck (land cover 2025) | M4-23 |
| https://code.earthengine.google.com/6671892edb5dda2f64aa858c07dcec2b | D4 Embeddings deck (land cover 2025) | M4-23 |
| https://code.earthengine.google.com/6f392726575a952a1060b31390acf071 | D4 AFE classification & similarity | M4-24 |
| https://code.earthengine.google.com/7d6d85cb415ba01ec5e4b92a74ff6e04 | D4 AFE classification & similarity | M4-24 |
| https://code.earthengine.google.com/0cbd5b45585eaf7252becc41c417ae6e | Agenda, CEO demonstration | M4-25 |
| https://code.earthengine.google.com/375a74248c8bb15184ccf2c95c1d6db5 | D5 Sample size | M4-28 |
| https://code.earthengine.google.com/0dbd04fc75df2f21ecf44b3ffcec69ec | D5 Stratified sampling | M4-29 |

25 unique script links.

## Earth Engine catalog datasets used

| Dataset ID | Used for |
|---|---|
| `COPERNICUS/S2_SR_HARMONIZED`, `COPERNICUS/S2_HARMONIZED` | Sentinel-2 composites, indices |
| `GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED` | Cloud masking (Cloud Score+) |
| `LANDSAT/LC08/C02/T1_L2`, `LANDSAT/LC09/C02/T1_L2` | Landsat 8/9 composites |
| `LANDSAT/LC08/C02/T1_TOA`, `LANDSAT/LC08/C02/T1_RT_TOA`, `LANDSAT/LT05/C02/T1_TOA` | Day 1 examples |
| `USGS/SRTMGL1_003` | Terrain correction, terrain covariates |
| `JRC/GSW1_4/GlobalSurfaceWater` | Water covariates |
| `GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL` | AlphaEarth embeddings |
| `GOOGLE/DYNAMICWORLD/V1` | Export exercise |
| Google Open Buildings (`GOOGLE/Research/...`) | Export exercise (GeoJSON) |
| `FAO/GAUL/2015/level1`, `FAO/GAUL_SIMPLIFIED_500m/2015/level2`, `projects/sat-io/open-datasets/FAO/GAUL/GAUL_2024_L0` | Boundaries (Bhutan, Dzongkhags) |
| `projects/planet-nicfi/assets/basemaps/asia` | Planet NICFI basemap (export exercise; needs NICFI access) |

## Project assets (not in the public catalog)

Learners can only use these if the owner has shared them publicly. **Before publishing the lessons, check each one can be read by an account with no special access.** If it can't, the lesson needs either a public copy or a "make your own" step.

| Asset | Owner project | Used in |
|---|---|---|
| `…/bhutan-hfld-readiness-training/assets/Bhutan` | bhutan-hfld-readiness-training | Study area (most exercises) |
| `…/assets/sentinel2Composites/bhutan_s2_<year>` | same | Day 3–4 inputs |
| `…/assets/landsatComposite/bhutan_ls89_2025_TashiY` | same | Covariates exercise (a participant's export) |
| `…/assets/landsatComposite/bhutan_ls89_2025_yourname` | same | Template path (learner substitutes their own) |
| `…/assets/trainingData/Bhutan_labels_multiclass` | same | Training labels |
| `…/assets/trainingData/Bhutan_stable_classes` | same | Training labels |
| `…/assets/trainingData/bhutan_hfldTraining_samples_<year>` | same | Training samples |
| `…/assets/trainingData/stratifiedPlots_<…>` | same | Day 5 sampling plots |
| `…/assets/primitives/urbanAP2025` | same | Primitive example |
| `…/assets/GSEdotProd/GSEdotProd_2425` | same | Embedding similarity, 2024–25 |
| `projects/servir-mekong/bhutan_primitives/s2_{CropLand,Forest,Grassland,Otherland,Settlement,Wetland}_2025` | servir-mekong | Assemblage |
| `projects/servir-mekong/bhutan_primitives/s2_2025_janapr_octdec_int16` | servir-mekong | Assemblage base image |
| `projects/servir-mekong/temp/bhutan_ls89_2024_janapr_octdec` | servir-mekong | Assemblage AOI |
| `projects/carbondevelopmentteam/assets/Bhutan/BT002_Bhutan_HFLD/LULC_2024_20250812_epsg4326_10m` | carbondevelopmentteam | Day 5 land-cover map for stratification |
| `projects/your_project/bhutan_training_dataset_2025` | placeholder | Learner substitutes their own |
