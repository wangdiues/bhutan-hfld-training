"""Extract the GEE code listings from the exercise documents (task M2-02).

Usage:
    python scripts/convert/extract_scripts.py <SRC folder> [--check]

For each exercise document in EXERCISES, every code paragraph (detected the same way
as docx2mdx.py: mostly monospace text) is written, in document order, to
scripts/gee/<day>/<lesson>.js. Headings above the code become section comments, and a
header comment gives the source, the original Code Editor links, the credit and the
licence. "name → description" glossary lines typed in the code font are skipped.

--check parses every file written as a classic script (the way GEE runs it).
Existing files are hand-curated and kept unless --force is given.
The source .docx files are only read, never modified.
"""
import argparse
import os
import re
import subprocess
import sys
import zipfile

sys.path.insert(0, os.path.dirname(__file__))
from docx2mdx import (  # noqa: E402
    ARROW_ITEM,
    DEFINITION,
    PARA_RE,
    PRIVATE_USE,
    ROOT,
    is_code_paragraph,
    normalise_code,
    paragraph_text,
)

GEE_OUT = os.path.join(ROOT, "scripts", "gee")

# Source document (relative to SRC) -> (lesson slug, title, original Code Editor links).
EXERCISES = {
    "Day 1/EXERCISE D1_ JAVASCRIPT BASICS IN GOOGLE EARTH ENGINE.docx":
        ("day-1/javascript-basics", "JavaScript basics in Google Earth Engine", []),
    "Day 1/EXERCISE D1_ Writing Custom Functions and Mapping Across Image Collections.docx":
        ("day-1/custom-functions", "Writing custom functions and mapping across image collections", []),
    "Day 2/D2-Exercise-Calculating spectral indices and working with functions.docx":
        ("day-2/spectral-indices", "Calculating spectral indices and working with functions",
         ["946119d88943098d0e8c6bc7fb7bcc12"]),
    "Day 2/D2-Bhutan_MRV_S2_Composite_Manual.docx":
        ("day-2/sentinel-2-mrv-composite", "Bhutan MRV Sentinel-2 composite", ["53d893180be40059cfde3df41385950a"]),
    "Day 2/D2-Bhutan_MRV_Landsat_Optical_Composite.docx":
        ("day-2/landsat-mrv-composite", "Bhutan MRV Landsat optical composite", ["d294311d88eee5ab7cb82a26bbf33640"]),
    "Day 2/D2-Exercise-Exporting Data.docx":
        ("day-2/import-and-export", "Exporting data", ["0769e2dbd6752d9dbf8ed8c2da1743fe"]),
    "Day 3/EXERCISE D3_ Calculating covariates for HFLD.docx":
        ("day-3/covariates", "Calculating covariates for HFLD",
         ["c86323c2a144391b5218fb1d5d9e465f", "f6ac698d62c5a93294b37c210166c41c"]),
    "Day 3/EXERCISE D3_ Part 2- Forest Probability Layers-CALCULATING FOREST PRIMITIVES FOR HFLD USING MACHINE LEARNING.docx":
        ("day-3/forest-primitives", "Forest probability layers: calculating forest primitives with machine learning",
         ["20a6b64518a83c65143487aaf9822564"]),
    "Day 4/EXERCISE D3_ Part 1-Collecting Training Data-Supervised Classification Method - Random Forest Model.docx":
        ("day-4/training-data", "Collecting training data and supervised Random Forest classification",
         ["49b9fc4c9f6ad7e7a8c58933f3aba994", "cca70a27a7d28a5fe8bd1e03b88ec6ba"]),
    "Day 4/EXERCISE D3_ Final- Assemblage-DECISION TREE RULE.docx":
        ("day-4/assemblage", "Assemblage: decision-tree rules", ["f3ac214d04f1543897bba62c26a9a878"]),
    "Day 4/EXERCISE D4_ Land Cover Classification and Cosine Simarity Using AFE.docx":
        ("day-4/embeddings-classification-similarity", "Land cover classification and cosine similarity using AlphaEarth Foundations embeddings",
         ["6f392726575a952a1060b31390acf071", "7d6d85cb415ba01ec5e4b92a74ff6e04"]),
    "Day 5/EXERCISE D5_ PART 1-DETERMINING SAMPLE SIZE.docx":
        ("day-5/sample-size", "Determining sample size", ["375a74248c8bb15184ccf2c95c1d6db5"]),
    "Day 5/EXERCISE D5_ PART 2-CREATING A STRATIFIED SAMPLING DESIGN IN GOOGLE EARTH ENGINE.docx":
        ("day-5/stratified-sampling-gee", "Creating a stratified sampling design in Google Earth Engine",
         ["0dbd04fc75df2f21ecf44b3ffcec69ec"]),
    "Day 5/EXERCISE D5_ Group Activity.docx":
        ("day-5/group-activity", "Group activity", []),
}

GENERIC_HEADINGS = {"purpose", "instructions", "structure", "code", "script", "example", "output", "note"}
JS_CHARS = re.compile(r"[;{}()\[\]=]|\.\w+\(|^\s*(var|let|const|function|return|if|else|for|print|Map|Export)")


def is_prose(line):
    """A sentence typed in the code font (descriptions, explanations): becomes a comment."""
    s = line.strip()
    if not s or s.startswith(("//", "/*", "*", "'", "\"", "`")):
        return False
    if re.match(r"^(Description|Purpose|Note|Explanation|Output|Result)s?\s*:\s*[A-Z]", s):
        return True
    words = s.split()
    if len(words) >= 3 and not JS_CHARS.search(s) and not s.endswith((",", ":", "+", "&&", "||")):
        return True
    # "Supervised Classification (this step)": words and a parenthesised aside, no code.
    return len(words) >= 2 and re.fullmatch(r"[A-Z][\w' -]+(\([\w' -]+\))?", s) is not None and "." not in s


HEADING_STYLE = re.compile(r'<w:pStyle w:val="(Heading\d|Title)"')
BOLD_ONLY = re.compile(r"<w:b/>|<w:b w:val=\"(?:1|true)\"/>")


def heading_text(p):
    """Text of a heading paragraph (Word heading style, or a short all-bold line), else None."""
    text = paragraph_text(p).strip()
    if not text or len(text) > 90:
        return None
    if HEADING_STYLE.search(p):
        return text
    runs = [r for r in re.findall(r"<w:r[ >].*?</w:r>", p, re.S) if re.search(r"<w:t[ >]", r)]
    if runs and all(BOLD_ONLY.search(r) for r in runs) and not text.endswith("."):
        return text
    return None


def extract(docx):
    """Return [(heading, [code lines])] in document order."""
    with zipfile.ZipFile(docx) as z:
        xml = z.read("word/document.xml").decode("utf8")
    sections, heading = [], None
    for m in PARA_RE.finditer(xml):
        p = m.group(0)
        if is_code_paragraph(p):
            lines = PRIVATE_USE.sub("", normalise_code(paragraph_text(p))).split("\n")
            lines = [l for l in lines if not (DEFINITION.match(l) or ARROW_ITEM.match(l))]
            if not any(l.strip() for l in lines):
                continue
            if lines and lines[0].strip().lower() in ("javascript", "copy code", "js"):
                lines = lines[1:]
            lines = ["// " + l.strip() if is_prose(l) else l for l in lines]
            if not sections or sections[-1][0] is not heading:
                sections.append((heading, []))
            sections[-1][1].extend(lines)
        else:
            h = heading_text(p)
            if h and h.strip(" :").lower() not in GENERIC_HEADINGS:
                heading = h
    return sections


def header(src_rel, title, links):
    out = [
        "/**",
        f" * {title}",
        " *",
        " * Bhutan ART-TREES HFLD Readiness Training, May 2026.",
        f" * Source: {os.path.basename(src_rel)}",
        " * Original authors: Ate Poortinga & Samuel (Conservation International).",
        " * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/",
        " * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.",
    ]
    if links:
        out.append(" *")
        out.append(" * Original Code Editor script(s):")
        out += [f" *   https://code.earthengine.google.com/{h}" for h in links]
    out.append(" */")
    return out


# GEE runs code as a classic (sloppy-mode) script, so check it as one.
CHECK_JS = "new (require('vm').Script)(require('fs').readFileSync(process.argv[1], 'utf8'))"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", help="the original training folder (read-only)")
    ap.add_argument("--check", action="store_true", help="check each file parses as a classic script")
    ap.add_argument("--force", action="store_true", help="overwrite existing (hand-edited) files")
    args = ap.parse_args()

    failed = 0
    for rel, (slug, title, links) in EXERCISES.items():
        path = os.path.join(args.src, *rel.split("/"))
        sections = extract(path)
        n_lines = sum(len(c) for _, c in sections)
        if not n_lines:
            print(f"-  {slug}: no code")
            continue
        body = header(rel, title, links)
        for h, code in sections:
            body.append("")
            if h:
                body.append(f"// ---- {h} ----")
            body.extend(code)
        dest = os.path.join(GEE_OUT, *slug.split("/")) + ".js"
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if os.path.exists(dest) and not args.force:
            print(f"-  {slug}: exists, kept (use --force to regenerate)")
            continue
        text = re.sub(r"\n{3,}", "\n\n", "\n".join(l.rstrip() for l in body)).strip() + "\n"
        with open(dest, "w", encoding="utf8", newline="\n") as f:
            f.write(text)
        status = ""
        if args.check:
            r = subprocess.run(["node", "-e", CHECK_JS, dest], capture_output=True, text=True)
            status = "  syntax OK" if r.returncode == 0 else "  SYNTAX ERROR\n" + r.stderr.strip()
            failed += r.returncode != 0
        print(f"ok {os.path.relpath(dest, ROOT)}: {len(sections)} sections, {n_lines} lines{status}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
