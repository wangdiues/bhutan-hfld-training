"""Check WCAG contrast of the theme's text/background pairs.

Reads src/styles/theme.css, resolves the dark (:root) and light (:root[data-theme='light'])
token blocks, and fails (exit 1) if any required pair is below its threshold.
Usage: python scripts/check-contrast.py
"""
import os
import re
import sys

CSS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "styles", "theme.css")

# (foreground token, background token, minimum ratio, what it is) — mirrors how Starlight uses them.
PAIRS = {
    "dark": [
        ("--sl-color-white", "--sl-color-black", 4.5, "headings on page"),
        ("--sl-color-gray-2", "--sl-color-black", 4.5, "body text on page"),
        ("--sl-color-gray-2", "--sl-color-gray-6", 4.5, "body text on sidebar/nav"),
        ("--sl-color-gray-3", "--sl-color-black", 4.5, "muted text (captions, last updated)"),
        ("--sl-color-accent-high", "--sl-color-black", 4.5, "links / accent text"),
        ("--sl-color-accent-high", "--sl-color-gray-6", 4.5, "active sidebar link"),
        ("--sl-color-accent-low", "--sl-color-accent-high", 4.5, "text on accent button"),
        ("--hfld-saffron-text", "--hfld-saffron-bg", 4.5, "saffron callout text"),
        ("--hfld-saffron", "--sl-color-black", 3.0, "saffron rule / non-text graphic"),
        ("--sl-color-gray-1", "--sl-color-accent-low", 4.5, "chosen quiz option (clay, pressed)"),
        ("--sl-color-gray-1", "--sl-color-gray-6", 4.5, "text on clay panel (quiz, overview)"),
    ],
    "light": [
        ("--sl-color-white", "--sl-color-black", 4.5, "headings on page"),
        ("--sl-color-gray-2", "--sl-color-black", 4.5, "body text on page"),
        ("--sl-color-gray-2", "--sl-color-gray-6", 4.5, "body text on sidebar/nav"),
        ("--sl-color-gray-3", "--sl-color-black", 4.5, "muted text (captions, last updated)"),
        ("--sl-color-accent", "--sl-color-black", 4.5, "links / accent text"),
        ("--sl-color-accent", "--sl-color-gray-6", 4.5, "active sidebar link"),
        ("--sl-color-black", "--sl-color-accent", 4.5, "text on accent button"),
        ("--sl-color-accent-high", "--sl-color-accent-low", 4.5, "text on accent-low (badges, highlights)"),
        ("--hfld-saffron-text", "--hfld-saffron-bg", 4.5, "saffron callout text"),
        ("--hfld-saffron", "--sl-color-black", 3.0, "saffron rule / non-text graphic"),
        ("--sl-color-gray-1", "--sl-color-accent-low", 4.5, "chosen quiz option (clay, pressed)"),
        ("--sl-color-gray-1", "--sl-color-gray-6", 4.5, "text on clay panel (quiz, overview)"),
    ],
}


def parse_blocks(css):
    blocks = {}
    for selector, body in re.findall(r"(:root(?:\[data-theme='light'\])?)\s*\{([^}]*)\}", css):
        mode = "light" if "light" in selector else "dark"
        blocks.setdefault(mode, {}).update(dict(re.findall(r"(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})", body)))
    return blocks


def luminance(hex_color):
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def ratio(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def main():
    blocks = parse_blocks(open(CSS, encoding="utf-8").read())
    failed = 0
    for mode, pairs in PAIRS.items():
        print(f"== {mode} mode")
        for fg, bg, minimum, label in pairs:
            r = ratio(blocks[mode][fg], blocks[mode][bg])
            ok = r >= minimum
            failed += not ok
            print(f"  {'PASS' if ok else 'FAIL'} {r:5.2f} (≥{minimum}) {label}: {fg} on {bg}")
    print("All pairs pass." if not failed else f"{failed} pair(s) fail.")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
