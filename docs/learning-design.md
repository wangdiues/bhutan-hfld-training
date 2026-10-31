# Learning design

Backward design (Wiggins & McTighe; the Carpentries lesson-development approach): **learners → outcomes → assessments → content**. Every lesson's objectives and quiz come from this file and are written before the lesson itself. Objectives use observable verbs (*load*, *compute*, *explain*, *choose*), never "understand".

Task M0-06 · 2026-10-26 · Sources: the training agenda's daily objectives; WEBSITE_PLAN §1b.

---

> Rebrand (2026-10-31): the course became LULC Mapping Training; the ART-TREES/HFLD lessons M4-01 and M4-38 were removed.

## 1. Learners

| Persona | Background | Goal | What this means for design |
|---|---|---|---|
| **Pema, GIS officer (DoFPS/FRMD)** | Uses QGIS/ArcGIS daily; little or no coding; knows Bhutan's forests well | Produce and defend the activity data for Bhutan's HFLD submission | Needs runnable, Bhutan-specific code; explanations of *why*; the ART-TREES links made explicit. Main audience. |
| **Karma, forestry graduate (CNR)** | Remote-sensing theory from university; new to Earth Engine and JavaScript | Build job-ready MRV skills | Needs scaffolded practice (complete → fill in → from scratch), quizzes, a certificate |
| **Dr. Lhamo, trainer or reviewer** | Expert in remote sensing or REDD+; runs workshops | Teach the course or check its methods | Needs trainer mode, timings, explanation pages, citations, a downloadable deck |
| **International practitioner** | Earth Engine user in another HFLD country (e.g. Guyana, Suriname, Gabon) | Adapt the workflow to their own country | Needs the method separated from Bhutan-specific values; reference pages |

**Prerequisites for everyone:** a Google account with Earth Engine access (registered to a Cloud project); a laptop with Chrome or Firefox; basic GIS ideas (raster, vector, projection). No programming experience is assumed.

**Access constraints:** connections are unreliable outside Thimphu, so the site works offline (M6-05), pages stay light, and slide content is published as web pages (text, tables and reviewed WebP images), not PDFs.

## 2. Course outcome

By the end of the course, a learner can **produce a land-cover map for Bhutan from Earth Engine, and an area-adjusted estimate with a 90% confidence interval from a stratified reference sample, that meets the transparency and uncertainty requirements of ART-TREES (TREES 3.0)**.

Assessed by: **the capstone** (M6-03). Each group makes a 6-class 2025 map for one Dzongkhag, draws a stratified sample (10 per class), interprets it in Collect Earth Online, and reports accuracy and adjusted areas with confidence intervals.

## 3. Daily outcomes (from the agenda)

| Day | Learners can… | Checked by |
|---|---|---|
| 1 | define an area of interest; filter Landsat/Sentinel collections by place, time and cloud cover; visualise them with suitable band combinations; inspect metadata; write and map simple functions; export a simple dataset | Day 1 quiz; Challenge: a cloud-filtered median composite of Paro Dzongkhag |
| 2 | mask clouds and shadows; compute indices; build seasonal Jan–Apr and Oct–Dec composites with terrain correction; export analysis-ready Int16 assets | Day 2 quiz; Challenge: an exported 12-band composite for one Dzongkhag |
| 3 | compute covariates; collect training data; train Random Forest; produce primitives (probability layers) for each class; describe change strata | Day 3 quiz; Challenge: a forest primitive and its out-of-bag accuracy |
| 4 | assemble primitives into a land-cover map with decision rules; use satellite embeddings for classification and similarity; design a response design and interpret samples in CEO | Day 4 quiz; Challenge: an assemblage map with a justified rule order |
| 5 | calculate sample size and allocate it across strata; draw a stratified sample in GEE; build a confusion matrix; compute user's/producer's/overall accuracy, adjusted areas, SE and 90% CI; report against TREES 3.0 | Day 5 quiz; Lab 2 output; the capstone |

## 4. Lesson objectives and assessments

**Columns:** *Obj* = objectives (2–4 per lesson). *Assess* = how each is checked: **Q** = quiz item, **C** = challenge (complete / fill-in / scratch), **L** = lab, **K** = capstone criterion. Times are teaching + exercise minutes.

### Start here
| ID | Lesson | Obj | Assess | Time |
|---|---|---|---|---|
| M4-00 | Start here | (1) set up an EE account and Cloud project; (2) open the Code Editor and run a script; (3) explain the course workflow from composite to area estimate | Q: put the 9 workflow stages in order; C(complete): run "Hello Bhutan" | 10+10 |

### Day 1 — GEE foundations
| ID | Lesson | Obj | Assess | Time |
|---|---|---|---|---|
| M4-02 | Introduction to GEE | (1) name the four parts of Earth Engine (catalog, compute, IDE, sharing); (2) choose when EE is the right tool and when it isn't | Q×4; C(complete): change the date window of the five-operations script | 20+5 |
| M4-03 | Code Editor & data archive | (1) find a dataset in the catalog and import it; (2) use the Inspector, Console and Tasks tabs; (3) draw a geometry | C(complete): import S2 and centre on Thimphu; Q×2 | 15+15 |
| M4-04 | JavaScript basics | (1) declare variables, lists and objects; (2) write and call a function; (3) print to the Console | C(fill-in): an object and point for Paro with coordinates read from the Inspector; C(scratch): a list function; Q×4 | 15+20 |
| M4-05 | Image collections, filtering & reducers | (1) filter a collection by bounds, date and metadata; (2) visualise with min/max/palette; (3) reduce a collection to an image and an image to a region statistic | C(fill-in): the 2025 dry-season median for Paro; Q×3 (e.g. N→1 reducers) | 20+25 |
| M4-06 | Custom functions & mapping | (1) write a function that takes and returns an `ee.Image`; (2) `map()` it over a collection; (3) tell client-side from server-side errors | C(scratch): map an NDVI function over 2025 S2; Q×2 | 15+25 |
| M4-07 | Day 1 recap & quiz | spaced retrieval of M4-01..06 | Q×8 mixed | 0+15 |

### Day 2 — Pre-processing & composites
| ID | Lesson | Obj | Assess | Time |
|---|---|---|---|---|
| M4-08 | Fundamentals of remote sensing | (1) explain reflectance curves of vegetation, water and soil; (2) compare spatial, spectral, temporal and radiometric resolution; (3) choose a sensor for a task | Q×4; L: Lab 3 (reflectance sliders) | 30+0 |
| M4-09 | Spectral indices & functions | (1) compute NDVI and NDWI with `normalizedDifference`; (2) compute EVI/SAVI with `expression`; (3) produce min/median/max index composites | C(fill-in): EVI function; L: Lab 3; Q×3 | 20+30 |
| M4-10 | Mosaics & composites (concepts) | (1) tell a mosaic from a composite; (2) explain atmospheric, BRDF and topographic correction; (3) explain why median compositing is used | Q×4 | 20+0 |
| M4-11 | Sentinel-2 MRV composite | (1) justify the Jan–Apr / Oct–Dec windows for Bhutan; (2) apply Cloud Score+ and TDOM shadow masking; (3) apply terrain correction; (4) export a 12-band Int16 composite | C(complete): run the full script for 2025; C(fill-in): change the year and the cloud threshold; Q×4 | 30+45 |
| M4-12 | Landsat MRV composite | (1) harmonise Landsat 8/9 surface reflectance; (2) apply QA-based masking and scaling; (3) export a seasonal composite | C(fill-in): a 2024 composite; Q×3 | 20+30 |
| M4-13 | Importing & exporting data | (1) upload a shapefile and a CSV as assets; (2) export images and tables to Drive and to assets; (3) export a video | C(complete): export Dynamic World 2023 for an AOI; Q×3 | 20+25 |
| M4-14 | Day 2 recap & quiz | retrieval of M4-08..13, plus 2 Day 1 items | Q×8 | 0+15 |

### Day 3 — Classification
| ID | Lesson | Obj | Assess | Time |
|---|---|---|---|---|
| M4-15 | Random Forest theory | (1) explain decision trees, entropy and information gain; (2) explain bagging and random feature selection; (3) name RF's strengths and weaknesses for remote sensing | L: Lab 4 (build a tree); Q×4 | 30+10 |
| M4-16 | Calculating covariates | (1) compute spectral, water, terrain and seasonal covariates; (2) explain what each one adds to separating classes | C(fill-in): add slope and NDBI; Q×3 | 20+30 |
| M4-17 | Forest primitives with ML | (1) sample covariates at training points; (2) train RF in probability mode; (3) read out-of-bag accuracy and variable importance; (4) export a primitive with the naming convention | C(complete): a forest primitive; C(scratch): a grassland primitive; Q×3 | 30+45 |
| M4-18 | Change detection & loss strata *(new)* | (1) build stable forest / loss / non-forest strata from two dates; (2) explain why rare change classes need their own stratum | C(fill-in): 2021–2023 loss strata from Hansen GFC (runs without assets; Part B shows 2020–2025 from own primitives); Q×4 | 20+25 |
| M4-19 | Day 3 recap & quiz | retrieval of M4-15..18, plus 2 earlier items | Q×8 | 0+15 |

### Day 4 — RLCMS, assemblage & embeddings
| ID | Lesson | Obj | Assess | Time |
|---|---|---|---|---|
| M4-20 | RLCMS overview & terms | (1) describe the four RLCMS stages; (2) define covariate, primitive and assemblage | Q×4 (glossary-linked) | 20+0 |
| M4-21 | Collecting training data & supervised RF | (1) collect training points with the geometry tools for 6 classes; (2) merge them with existing samples; (3) compare a single-model classification with the primitive approach | C(complete): collect 20 points per class; Q×3 | 20+30 |
| M4-22 | Assemblage (decision tree) | (1) set class priorities and thresholds; (2) apply rules to primitives to make a categorical map; (3) explain how the rule order changes the result | L: Lab 5; C(fill-in): reorder Settlement/Cropland; Q×3 | 20+30 |
| M4-23 | Satellite embeddings (concepts) | (1) explain what a 64-dimensional annual embedding encodes; (2) explain cosine similarity; (3) list good practices (match labels to years, quality over quantity) | L: Lab 6; Q×4 | 25+10 |
| M4-24 | Land cover & cosine similarity with AFE | (1) classify with embedding bands; (2) compute similarity to reference samples; (3) map change as low similarity between years | C(complete): similarity map of Thimphu built-up; C(fill-in): change map 2024→2025; Q×3 | 20+30 |
| M4-25 | Collect Earth Online *(new)* | (1) create a CEO project from GEE sample plots; (2) write a response design with decision rules for mixed plots; (3) interpret plots and export results | C(complete): set up a 10-plot project; K: the capstone response design; Q×3 | 20+40 |
| M4-26 | Day 4 recap & quiz | retrieval of M4-20..25, plus 2 earlier items | Q×8 | 0+15 |

### Day 5 — Sampling, accuracy & area
| ID | Lesson | Obj | Assess | Time |
|---|---|---|---|---|
| M4-27 | Stratified sampling frame | (1) compare simple random, systematic, stratified and cluster designs; (2) explain why the strata are the map classes; (3) explain why maps can't be used as they are for areas | Q×4 | 25+0 |
| M4-28 | Determining sample size | (1) compute n = (ΣWᵢSᵢ / SE)²; (2) compare equal, proportional and minimum-N allocation; (3) choose an allocation and justify it | L: Lab 1 (embedded); C(complete): ±20% margin of error and an allocation with a minimum per stratum; Q×4 | 15+25 |
| M4-29 | Stratified sampling in GEE | (1) draw samples with `stratifiedSample`; (2) index them and build plots; (3) export for CEO | C(complete): 10 per class for one Dzongkhag; Q×2 | 15+25 |
| M4-30 | Accuracy & area adjustment | (1) build a confusion matrix; (2) compute user's, producer's and overall accuracy; (3) compute area-adjusted estimates, SE and the 90% CI; (4) state the percentage uncertainty | L: Lab 2; C(fill-in): recompute the worked example (17,000 ha → 13,304 ± 2,459 ha; SE 1,495 ha); Q×4; K: capstone table | 25+35 |
| M4-31 | Reporting & documentation *(new)* | (1) assemble an activity-data table for TREES 3.0; (2) document assumptions, versions and code so others can reproduce the work | K: capstone documentation checklist; Q×2 | 20+20 |
| M4-32 | Day 5 recap & quiz | retrieval of M4-27..31, plus 3 earlier items | Q×10 | 0+20 |

### Explanation, how-to & reference
These pages are for consulting rather than studying, so they have no quiz. Explanation pages carry 1–2 "check your understanding" items where useful.

| ID | Page | Purpose (Diátaxis type) |
|---|---|---|
| M4-33 | Debugging GEE | How-to / reference: error types and fixes |
| M4-34 | Script library | Reference |
| M4-35 | Asset catalogue | Reference |
| M4-36 | Glossary | Reference |
| M4-37 | Cheat sheet & further reading | Reference |
| M4-39 | Explanation pages (RS physics, compositing, RF, RLCMS, embeddings, Olofsson estimator) | Explanation |
| M4-40 | How-to guides | How-to |

## 5. Assessment design rules
- **Quiz items:** test application, not recall of wording, e.g. "Which reducer gives one image from 40?" or "Your user's accuracy for loss is 0.6. What happens to the adjusted loss area?" Each has 3–4 options, plausible wrong answers that reflect common misconceptions, and an explanation shown after answering.
- **Recap quizzes** (M4-07/14/19/26/32) mix the current day with 2–3 items from earlier days, so recall is spread out over the course.
- **Challenges** step down the help across a day: early lessons are *complete the code*, middle ones *fill in the blanks*, and the last lesson of each day is *from scratch*. Solutions stay hidden until requested.
- **Pass mark** for the certificate (M6-02): at least 70% on every daily recap quiz; quizzes can be retaken.
- **Worked numbers** in quizzes and challenges must be recomputed by the content-reviewer subagent.
