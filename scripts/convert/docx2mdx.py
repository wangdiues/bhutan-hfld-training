"""Convert a training exercise .docx into a draft lesson MDX file (task M2-01).

Usage:
    python scripts/convert/docx2mdx.py <exercise.docx> <lesson-slug> [--install-images]

    <lesson-slug> is the page path under src/content/docs, e.g. day-1/javascript-basics.

Writes scripts/convert/out/<lesson-slug>.mdx (gitignored) for manual editing, and the
document's images to scripts/convert/out/<lesson-slug>/. With --install-images the images
are also copied to src/assets/<lesson-slug>/, where the MDX's image links point.

How it works:
1. Pre-pass on word/document.xml: every paragraph set entirely in a monospace font
   (the source documents use Roboto Mono / Nova Mono for code) is replaced by a numbered
   placeholder, and its exact text (spaces, tabs, line breaks) is kept aside.
2. pandoc converts the patched document to GitHub-flavoured Markdown (no raw HTML).
3. Post-pass: runs of placeholders become ```js blocks; the stray "javascript" /
   "Copy code" labels are dropped; "Why this step matters", "Training implication" and
   "Key Functions" paragraphs become <Callout>s; bold-only lines become headings;
   characters MDX would treat as JSX ({ } < >) are escaped in prose.
The source .docx is only read, never modified.
"""
import argparse
import itertools
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from xml.sax.saxutils import escape as xml_escape

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "scripts", "convert", "out")

MONO_FONTS = {"Roboto Mono", "Nova Mono", "Consolas", "Courier New", "Courier", "Source Code Pro"}
PLACEHOLDER = "HFLDCODE{}X"
PLACEHOLDER_RE = re.compile(r"^HFLDCODE(\d+)X\s*$")
CODE_LABELS = {"javascript", "copy code", "js"}

# Paragraph prefix -> Callout type. Matched case-insensitively at the start of a paragraph.
CALLOUTS = [
    (re.compile(r"^\**why this step matters\**[.:]?\**\s*", re.I), "why"),
    (re.compile(r"^\**training implication\**[.:]?\**\s*", re.I), "implication"),
]
TOC_ENTRY = re.compile(r"(?:>\s*)?\[[^\]]*\]\(#[^)]*\)")
DEFINITION = re.compile(r"^\s*([^\s/'\"][^→`]{0,60}?)\s*→\s*(\S.*)$")
ARROW_ITEM = re.compile(r"^\s*→\s*(\S.*)$")
TOC_HEADING = re.compile(r"#*\s*\**(table of )?contents?\**", re.I)
INTERNAL_LINK = re.compile(r"\[([^\]]*)\]\(#[^)]*\)")
KEY_FUNCTIONS = re.compile(r"^\**key functions\**:?\**\s*$", re.I)

PARA_RE = re.compile(r"<w:p[ >].*?</w:p>|<w:p/>", re.S)


def paragraph_text(p):
    """Exact text of a w:p, keeping tabs and line breaks."""
    out = []
    for m in re.finditer(r"<w:t(?:\s[^>]*)?>([^<]*)</w:t>|<w:tab/>|<w:br/>|<w:br [^>]*/>", p):
        tok = m.group(0)
        if tok.startswith("<w:tab"):
            out.append("\t")
        elif tok.startswith("<w:br"):
            out.append("\n")
        else:
            out.append(m.group(1))
    text = "".join(out)
    for a, b in (("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'), ("&apos;", "'"), ("&amp;", "&")):
        text = text.replace(a, b)
    return text


def is_code_paragraph(p):
    """True if most of the paragraph's visible text is in a monospace font.

    Some code lines mix fonts (e.g. a "//" typed in the body font), so the test is
    "at least 60% of non-space characters are monospace", not "every run".
    """
    mono = total = 0
    for r in re.findall(r"<w:r[ >].*?</w:r>", p, re.S):
        chars = len("".join(re.findall(r"<w:t(?:\s[^>]*)?>([^<]*)</w:t>", r)).replace(" ", ""))
        total += chars
        if set(re.findall(r'w:ascii="([^"]+)"', r)) & MONO_FONTS:
            mono += chars
    return total > 0 and mono / total >= 0.6


def patch_docx(src, dst):
    """Copy src to dst with code paragraphs replaced by placeholders. Returns the code texts."""
    codes = []
    with zipfile.ZipFile(src) as zin:
        xml = zin.read("word/document.xml").decode("utf8")

        def repl(m):
            p = m.group(0)
            if not is_code_paragraph(p):
                return p
            codes.append(paragraph_text(p))
            marker = xml_escape(PLACEHOLDER.format(len(codes) - 1))
            return f"<w:p><w:r><w:t>{marker}</w:t></w:r></w:p>"

        xml = PARA_RE.sub(repl, xml)
        with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = xml.encode("utf8") if item.filename == "word/document.xml" else zin.read(item)
                zout.writestr(item, data)
    return codes


def normalise_code(text):
    """Code typed in Word: curly quotes and non-breaking spaces break JavaScript."""
    for a, b in (("‘", "'"), ("’", "'"), ("“", '"'), ("”", '"'), (" ", " ")):
        text = text.replace(a, b)
    # Tabs: Expressive Code draws them as faint arrows; the GEE style guide uses 2-space indents.
    return text.expandtabs(2).rstrip()


def escape_prose(line):
    """Escape characters MDX parses as JSX/expressions, outside inline code spans."""
    parts = re.split(r"(`[^`]*`)", line)
    for i in range(0, len(parts), 2):
        s = parts[i]
        s = re.sub(r"(?<!\\)([{}])", r"\\\1", s)
        s = re.sub(r"<(?![a-zA-Z/!])|<(?=[^>]*$)", "&lt;", s)
        parts[i] = s
    return "".join(parts)


PRIVATE_USE = re.compile("[-]")  # icon glyphs pasted from web pages (e.g. a copy button)


def postprocess(md, codes, slug):
    codes = [PRIVATE_USE.sub("", c) for c in codes]
    lines = PRIVATE_USE.sub("", md).split("\n")
    blocks, buf = [], []
    for line in lines:  # split into blank-line separated blocks
        if line.strip() == "":
            if buf:
                blocks.append("\n".join(buf))
                buf = []
        else:
            buf.append(line)
    if buf:
        blocks.append("\n".join(buf))

    out, title, description, used_callout = [], None, None, False
    i = 0
    while i < len(blocks):
        b = blocks[i]
        m = PLACEHOLDER_RE.match(b)
        if m:
            code = []
            while i < len(blocks) and PLACEHOLDER_RE.match(blocks[i]):
                code.append(normalise_code(codes[int(PLACEHOLDER_RE.match(blocks[i]).group(1))]))
                i += 1
            # Drop "javascript" / "Copy code" labels left just before the code.
            while out and out[-1].strip().strip("*").lower() in CODE_LABELS:
                out.pop()
            # "name → explanation" lines are function glossaries typed in the code font:
            # split the run into code blocks and definition lists.
            code = "\n".join(code).split("\n")  # a Word paragraph may hold several lines
            is_def = lambda l: bool(DEFINITION.match(l) or ARROW_ITEM.match(l))
            for is_def, group in itertools.groupby(code, key=is_def):
                group = list(group)
                if is_def:
                    items = []
                    for l in group:
                        m = DEFINITION.match(l)
                        if m:
                            items.append(f"- `{m.group(1).strip()}`: {escape_prose(m.group(2).strip())}")
                        else:
                            items.append(f"- {escape_prose(ARROW_ITEM.match(l).group(1).strip())}")
                    out.append("\n".join(items))
                else:
                    body = "\n".join(group).strip("\n")
                    if body.strip():
                        out.append(f"```js\n{body}\n```")
            continue
        if all(TOC_ENTRY.fullmatch(l.strip()) or l.strip() in (">", "") for l in b.split("\n")):
            i += 1  # Word table of contents: the site builds its own
            continue
        if TOC_HEADING.fullmatch(b.strip()) and i + 1 < len(blocks) and TOC_ENTRY.match(blocks[i + 1].strip()):
            i += 1  # the "Contents" heading above it
            continue
        if re.fullmatch(r"#+\s*(\*\*)?\s*(\*\*)?", b.strip()):
            i += 1  # empty heading left by an empty Word heading paragraph
            continue
        h1 = re.fullmatch(r"#\s+(.+)", b.strip())
        if h1:
            if title is None and not out:
                title = h1.group(1).strip("* ")
                i += 1
                continue
            b = "#" + b.strip()  # the page title is the only h1
        b = INTERNAL_LINK.sub(r"\1", b)  # Word bookmarks don't match the site's heading ids
        if b.strip().strip("*").lower() in CODE_LABELS:
            out.append(b)  # kept for now; removed if code follows
            i += 1
            continue

        bold = re.fullmatch(r"\*\*([^*]+?)\*\*", b.strip())
        if bold and "\n" not in b and len(bold.group(1)) <= 90 and not bold.group(1).rstrip().endswith("."):
            text = bold.group(1).strip().rstrip(":")
            if title is None and not out:
                title = text
            elif description is None and not out:
                description = text
            else:
                out.append(f"## {escape_prose(text)}")
            i += 1
            continue

        if KEY_FUNCTIONS.match(b.strip()):
            # Wrap the following table (if any) in a callout.
            table = blocks[i + 1] if i + 1 < len(blocks) and blocks[i + 1].lstrip().startswith("|") else None
            used_callout = True
            inner = table if table else ""
            out.append(f'<Callout type="theory" title="Key functions">\n\n{inner}\n\n</Callout>')
            i += 2 if table else 1
            continue

        for pattern, kind in CALLOUTS:
            if pattern.match(b):
                used_callout = True
                rest = escape_prose(pattern.sub("", b, count=1))
                out.append(f'<Callout type="{kind}">\n\n{rest}\n\n</Callout>')
                break
        else:
            if b.lstrip().startswith("|"):
                out.append(b)  # tables: pandoc already escapes what GFM needs
            else:
                out.append("\n".join(escape_prose(l) for l in b.split("\n")))
        i += 1

    # Leftover labels with no code after them are noise too.
    out = [b for b in out if b.strip().strip("*").lower() not in CODE_LABELS]

    # pandoc writes loose lists (a blank line between items); make them tight.
    item = re.compile(r"^\s*(?:[-*+]|\d+\.)\s")
    merged = []
    for b in out:
        if merged and item.match(b) and item.match(merged[-1]) and "\n\n" not in b:
            merged[-1] += "\n" + b
        else:
            merged.append(b)
    out = merged

    body = "\n\n".join(out)
    # Images: point at src/assets/<slug>/ relative to src/content/docs/<slug>.mdx.
    depth = slug.count("/") + 2  # up from docs/<dir>/ to src/
    rel = "../" * depth + f"assets/{slug}/"
    def image(m):
        alt, name = m.group(1), m.group(2)
        if "logo" in alt.lower():
            removed.append(name)
            return f"{{/* Removed logo image {name}: third-party marks are not reused. */}}"
        if not alt or "/" in alt or "\\" in alt or re.search(r"\.(png|jpe?g|gif)$", alt, re.I):
            alt = "TODO: describe this image"
        return f"![{alt}]({rel}{name})"

    removed = []
    body = re.sub(r"!\[([^\]]*)\]\((?:[^)]*/)?media/([^)\s]+)\)", image, body)
    body = re.sub(r"\{(width|height)=[^}]*\}", "", body)

    title = title or slug.rsplit("/", 1)[-1].replace("-", " ").capitalize()
    front = f"---\ntitle: {quote_yaml(nice_title(title))}\ndescription: {quote_yaml(description) if description else 'TODO'}\n---\n"
    imports = "import Callout from '~/components/Callout.astro';\n\n" if used_callout else ""
    return front + "\n" + imports + body.strip() + "\n", removed


SMALL_WORDS = {"a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with", "using", "from"}
KNOWN = {"javascript": "JavaScript", "gee": "GEE", "hfld": "HFLD", "mrv": "MRV", "afe": "AFE", "art-trees": "ART-TREES",
         "ndvi": "NDVI", "aoi": "AOI", "s2": "S2", "ml": "ML", "rlcms": "RLCMS"}


def nice_title(t):
    """Title case for ALL-CAPS source headings, keeping acronyms and product names."""
    if not t.isupper():
        return t
    words = t.lower().split()
    out = []
    for i, w in enumerate(words):
        if w in KNOWN:
            out.append(KNOWN[w])
        elif i > 0 and w in SMALL_WORDS:
            out.append(w)
        else:
            out.append(re.sub(r"^(\W*)(\w)", lambda m: m.group(1) + m.group(2).upper(), w))
    return " ".join(out)


def quote_yaml(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("docx")
    ap.add_argument("slug", help="page path under src/content/docs, e.g. day-1/javascript-basics")
    ap.add_argument("--install-images", action="store_true", help="also copy images to src/assets/<slug>/")
    args = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9-]+(/[a-z0-9-]+)*", args.slug):
        sys.exit("slug must look like day-1/javascript-basics")
    if shutil.which("pandoc") is None:
        sys.exit("pandoc is not installed (https://pandoc.org/installing.html)")

    out_mdx = os.path.join(OUT, args.slug + ".mdx")
    media_dir = os.path.join(OUT, args.slug)
    os.makedirs(os.path.dirname(out_mdx), exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        patched = os.path.join(tmp, "patched.docx")
        codes = patch_docx(args.docx, patched)
        extract = os.path.join(tmp, "x")
        md = subprocess.run(
            ["pandoc", patched, "-f", "docx", "-t", "gfm-raw_html", "--wrap=none", f"--extract-media={extract}"],
            check=True, capture_output=True, text=True, encoding="utf8",
        ).stdout
        if os.path.isdir(os.path.join(extract, "media")):
            shutil.rmtree(media_dir, ignore_errors=True)
            shutil.copytree(os.path.join(extract, "media"), media_dir)

    mdx, removed = postprocess(md.replace("\r\n", "\n"), codes, args.slug)
    for name in removed:  # never install removed logos
        path = os.path.join(media_dir, name)
        if os.path.exists(path):
            os.remove(path)
    with open(out_mdx, "w", encoding="utf8", newline="\n") as f:
        f.write(mdx)

    n_img = len(os.listdir(media_dir)) if os.path.isdir(media_dir) else 0
    if args.install_images and n_img:
        dest = os.path.join(ROOT, "src", "assets", *args.slug.split("/"))
        shutil.rmtree(dest, ignore_errors=True)
        shutil.copytree(media_dir, dest)
    print(f"{out_mdx}\n  {len(codes)} code lines, {mdx.count('```js')} code blocks, "
          f"{mdx.count('<Callout')} callouts, {n_img} images ({len(removed)} logos removed)")


if __name__ == "__main__":
    main()
