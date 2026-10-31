# Trainer technical review: checklist (task M7-06)

For **Ate Poortinga and Samuel (Conservation International)**, authors of the May 2026 Bhutan ART-TREES HFLD Readiness Training.

Site: https://wangdiues.github.io/lulc-mapping-training/
Corrections already made to your material: [CHANGELOG.md → Corrections to source material](https://github.com/wangdiues/lulc-mapping-training/blob/main/CHANGELOG.md)

Please answer in any form (email, comments, or GitHub issues). Every answer becomes an issue so nothing is lost. About 2–3 hours in total; the starred items matter most.

## 1. Credit and permission

- [ ] ★ Is the credit wording on lessons and on [About and credits](https://wangdiues.github.io/lulc-mapping-training/about/credits/) correct (names, affiliation, date)? Should "Samuel" carry a family name?
- [ ] ★ The [slide player](https://wangdiues.github.io/lulc-mapping-training/slides/) shows the original slides with all pictures, marked as not covered by CC BY. Is that acceptable to you and to the owners of third-party figures (Google/DeepMind, Simplilearn, stock photos)?
- [ ] Is CC BY 4.0 for the adapted text, and MIT for the code, acceptable?

## 2. Corrections to your material

- [ ] ★ Please confirm or reject each row of "Corrections to source material" in the changelog. In particular:
  - Sentinel-2 composite switched from L1C (`S2_HARMONIZED`) to surface reflectance (`S2_SR_HARMONIZED`).
  - Sample-size exercise: the docx numbers (3,299 / 908; minimum 80 → 828 / 80) differ from the workbook (6,717 / 1,800; minimum ~150 → 1,650 / 150). The site shows both. Which is intended?
  - The uncertainty example: SE 1,495 ha (the slide said 1,435); ±2,459 ha and 18.5% kept.
  - The slide claim "ART-TREES typically requires forest cover maps to have accuracy > 90%" was removed: neither TREES 2.0 nor 3.0 sets a map-accuracy threshold.
- [ ] Code restored where the exercise left it incomplete (for example `init()` in the assemblage script, `proj_area` in the sample-size script): does it match what you ran?

## 3. ART-TREES content (new pages)

- [ ] ★ [ART-TREES HFLD requirements](https://wangdiues.github.io/lulc-mapping-training/day-1/art-trees-hfld-requirements/): the site states that Bhutan's 2020–2024 crediting period follows TREES 2.0, and the next one TREES 3.0 (Section 1.2.2). Is this right for Bhutan's submission? Does Bhutan use the HFLD crediting approach?
- [ ] [TREES 2.0 → 3.0](https://wangdiues.github.io/lulc-mapping-training/explanation/trees-2-to-3/): anything missing that matters for Bhutan?
- [ ] New lessons not in the training: [Change detection](https://wangdiues.github.io/lulc-mapping-training/day-3/change-strata/), [Collect Earth Online](https://wangdiues.github.io/lulc-mapping-training/day-4/collect-earth-online/), [Reporting and documentation](https://wangdiues.github.io/lulc-mapping-training/day-5/reporting/). Technically sound?

## 4. Methods and code

- [ ] ★ Run three scripts from the [script library](https://wangdiues.github.io/lulc-mapping-training/reference/script-library/) (suggested: Sentinel-2 MRV composite, forest primitives, stratified sampling). Do they run and match your results?
- [ ] Assets: which `projects/bhutan-hfld-readiness-training/…` and `projects/servir-mekong/…` assets can stay readable by the public? (See the [asset catalogue](https://wangdiues.github.io/lulc-mapping-training/reference/assets/).)
- [ ] Labs 1 and 2 reproduce your workbooks to 1e-6. The accuracy lab uses Olofsson et al.'s variance rule by default and offers the workbook rule as an option. Agree?

## 5. Teaching

- [ ] The [capstone](https://wangdiues.github.io/lulc-mapping-training/capstone/) brief, checklist and rubric: fair and doable?
- [ ] [Trainer mode](https://wangdiues.github.io/lulc-mapping-training/about/trainer-mode/): are the timetable and facilitation notes accurate?
- [ ] Anything you would remove, or anything wrong that a learner would copy?

Thank you. Feedback is logged as GitHub issues with the label `trainer-review`.
