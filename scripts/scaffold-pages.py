"""Create placeholder pages for every planned lesson, lab and reference page.

Each placeholder shows the lesson's objectives and timing from docs/learning-design.md, so the
site is useful before the full lesson is written. Existing files are never overwritten.
Usage: python scripts/scaffold-pages.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "src", "content", "docs")
DESIGN = os.path.join(ROOT, "docs", "learning-design.md")

# (task id, path under src/content/docs without extension, title, sidebar order, diataxis type)
PAGES = [
    ("M4-00", "start-here", "Start here", 0, "tutorial"),
    ("M4-02", "day-1/introduction-to-earth-engine", "Introduction to Earth Engine", 2, "tutorial"),
    ("M4-03", "day-1/code-editor-and-data-catalog", "The Code Editor and data catalog", 3, "tutorial"),
    ("M4-04", "day-1/javascript-basics", "JavaScript basics", 4, "tutorial"),
    ("M4-05", "day-1/image-collections", "Image collections, filters and reducers", 5, "tutorial"),
    ("M4-06", "day-1/custom-functions", "Custom functions and map()", 6, "tutorial"),
    ("M4-07", "day-1/recap", "Day 1 recap quiz", 7, "tutorial"),
    ("M4-08", "day-2/remote-sensing-fundamentals", "Remote sensing fundamentals", 1, "tutorial"),
    ("M4-09", "day-2/spectral-indices", "Spectral indices", 2, "tutorial"),
    ("M4-10", "day-2/mosaics-and-composites", "Mosaics and composites", 3, "tutorial"),
    ("M4-11", "day-2/sentinel-2-mrv-composite", "Sentinel-2 MRV composite", 4, "tutorial"),
    ("M4-12", "day-2/landsat-mrv-composite", "Landsat MRV composite", 5, "tutorial"),
    ("M4-13", "day-2/import-and-export", "Importing and exporting data", 6, "tutorial"),
    ("M4-14", "day-2/recap", "Day 2 recap quiz", 7, "tutorial"),
    ("M4-15", "day-3/random-forest", "Random Forest", 1, "tutorial"),
    ("M4-16", "day-3/covariates", "Calculating covariates", 2, "tutorial"),
    ("M4-17", "day-3/forest-primitives", "Forest primitives with machine learning", 3, "tutorial"),
    ("M4-18", "day-3/change-strata", "Change detection and loss strata", 4, "tutorial"),
    ("M4-19", "day-3/recap", "Day 3 recap quiz", 5, "tutorial"),
    ("M4-20", "day-4/rlcms-overview", "RLCMS overview and terms", 1, "tutorial"),
    ("M4-21", "day-4/training-data", "Collecting training data", 2, "tutorial"),
    ("M4-22", "day-4/assemblage", "Assemblage with decision rules", 3, "tutorial"),
    ("M4-23", "day-4/satellite-embeddings", "Satellite embeddings", 4, "tutorial"),
    ("M4-24", "day-4/embeddings-classification-similarity", "Classification and similarity with embeddings", 5, "tutorial"),
    ("M4-25", "day-4/collect-earth-online", "Collect Earth Online", 6, "tutorial"),
    ("M4-26", "day-4/recap", "Day 4 recap quiz", 7, "tutorial"),
    ("M4-27", "day-5/sampling-design", "Designing a stratified sample", 1, "tutorial"),
    ("M4-28", "day-5/sample-size", "Determining sample size", 2, "tutorial"),
    ("M4-29", "day-5/stratified-sampling-gee", "Stratified sampling in Earth Engine", 3, "tutorial"),
    ("M4-30", "day-5/accuracy-and-area", "Accuracy assessment and area estimation", 4, "tutorial"),
    ("M4-31", "day-5/reporting", "Reporting and documentation", 5, "tutorial"),
    ("M4-32", "day-5/recap", "Day 5 recap quiz", 6, "tutorial"),
    ("M4-33", "how-to/debug-earth-engine", "Debug Earth Engine errors", 1, "how-to"),
    ("M4-40", "how-to/index", "How-to guides", 0, "how-to"),
    ("M4-39", "explanation/index", "Explanation", 0, "explanation"),
    ("M4-34", "reference/script-library", "Script library", 1, "reference"),
    ("M4-35", "reference/assets", "Asset catalogue", 2, "reference"),
    ("M4-36", "reference/glossary", "Glossary", 3, "reference"),
    ("M4-37", "reference/cheat-sheet", "Bands, indices and further reading", 4, "reference"),
    ("M5-02", "labs/sample-size-calculator", "Lab: Sample size calculator", 1, "lab"),
    ("M5-03", "labs/accuracy-area-estimator", "Lab: Accuracy and area estimator", 2, "lab"),
    ("M5-05", "labs/spectral-index-explorer", "Lab: Spectral index explorer", 3, "lab"),
    ("M5-06", "labs/decision-tree-playground", "Lab: Decision tree playground", 4, "lab"),
    ("M5-07", "labs/assemblage-builder", "Lab: Assemblage rule builder", 5, "lab"),
    ("M5-08", "labs/embedding-similarity", "Lab: Embedding similarity", 6, "lab"),
    ("M6-03", "capstone", "Capstone project", 0, "tutorial"),
    ("M7-04", "about/credits", "About and credits", 1, "reference"),
]

LAB_BLURBS = {
    "M5-02": "Compute the total sample size and compare equal, proportional and minimum-per-stratum allocation, preloaded with Bhutan's strata.",
    "M5-03": "Enter or paste a confusion matrix to get user's, producer's and overall accuracy, area-adjusted estimates, standard errors and 90% confidence intervals.",
    "M5-05": "Move reflectance sliders and watch NDVI, NDWI, EVI and SAVI respond.",
    "M5-06": "Build a decision tree split by split, then see a forest of trees vote.",
    "M5-07": "Set class priorities and probability thresholds, and generate the Earth Engine code for your rules.",
    "M5-08": "See how cosine similarity between embedding vectors identifies similar places and change over time.",
}


def objectives():
    rows = {}
    for line in open(DESIGN, encoding="utf-8"):
        m = re.match(r"\| (M4-\d+) \| ([^|]+)\| ([^|]+)\| ([^|]+)\| ([^|]+)\|", line)
        if m:
            tid, _, obj, _, time = (s.strip() for s in m.groups())
            items = [s.strip().rstrip(";") for s in re.split(r"\(\d\)\s*", obj) if s.strip()]
            rows[tid] = (items, time)
    return rows


def body(tid, kind, objs):
    status = ":::note[Coming soon]\nThis page is being written. Follow progress on [GitHub](https://github.com/wangdiues/lulc-mapping-training).\n:::\n"
    if tid in objs and objs[tid][0] and kind == "tutorial":
        items, time = objs[tid]
        teach, _, practice = time.partition("+")
        lines = [status, "## In this lesson you will", ""]
        lines += [f"- {i[0].upper() + i[1:]}" for i in items]
        if teach.strip().isdigit():
            lines += ["", f"**Time:** about {teach.strip()} min teaching + {practice.strip()} min practice."]
        return "\n".join(lines) + "\n"
    if tid in LAB_BLURBS:
        return f"{status}\n{LAB_BLURBS[tid]}\n"
    return status


def main():
    objs = objectives()
    created = 0
    for tid, path, title, order, kind in PAGES:
        file = os.path.join(DOCS, *path.split("/")) + ".mdx"
        if os.path.exists(file):
            continue
        os.makedirs(os.path.dirname(file), exist_ok=True)
        fm = f"---\ntitle: {json.dumps(title, ensure_ascii=False)}\nsidebar:\n  order: {order}\n---\n\n"
        with open(file, "w", encoding="utf-8", newline="\n") as f:
            f.write(fm + body(tid, kind, objs))
        created += 1
    print(f"Created {created} page(s); {len(PAGES) - created} already existed.")


if __name__ == "__main__":
    main()
