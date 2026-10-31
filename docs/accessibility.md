# Accessibility pass (task M7-01, 2026-10-31)

| Check | How | Result |
|---|---|---|
| axe (WCAG 2.1 AA rules) | `scripts/check-themes.mjs` on all 78 built pages, light and dark themes | 156 of 156 runs: 0 violations, 0 console errors |
| Quizzes and slide decks by keyboard | the same script answers quizzes and moves through decks by keyboard | all pass |
| Keyboard walkthrough | Tab through home, a lesson with an embedded lab, Lab 2, glossary, slides index, certificate | first stop is "Skip to content" on every page; every stop has a visible focus outline |
| Alt text | all `<Image>` and Markdown images in `src/content/docs` | 58 images, all with descriptive alt text (20+ characters); slide images use "Slide n: title. The slide's text follows." with the text below; the logo next to the site title is decorative (`alt=""`) |
| Reduced motion | `src/styles/theme.css` sets animation and transition times to ~0 and `scroll-behavior: auto` under `prefers-reduced-motion: reduce`; the slide animation runs only under `no-preference`; the workflow map scrolls without animation when motion is reduced | supported |
| Labs | each lab tested with keyboard only (sliders, buttons, inputs), labelled inputs, live regions for results, meaning not by colour alone | see the task notes in TASKS.md (M5-02..08, M6-01..04) |

Re-run: `npm run build`, `npx astro preview &`, then
`node scripts/check-themes.mjs $(find dist -name index.html | sed 's|^dist||; s|index.html$||')`
(on Git Bash, prefix with `MSYS_NO_PATHCONV=1`).

## Performance measurements (task M7-02, 2026-10-31)

Measured with Puppeteer against `astro preview` (cache disabled; sizes uncompressed). Lighthouse itself was not run: downloading it needs the user's approval.

| Page | JS | CSS | Fonts | LCP | CLS |
|---|---|---|---|---|---|
| Home | 99 KB | 113 KB | 136 KB | 1.2 s | 0.018 |
| Random Forest lesson (with Lab 4) | 116 KB | 137 KB | 261 KB | 0.3 s | 0.024 |
| Lab 2 accuracy and area | 119 KB | 114 KB | 136 KB | 0.3 s | 0.086 |
| Embeddings lesson (with Lab 6) | 115 KB | 137 KB | 136 KB | 0.2 s | — |
| Glossary | 103 KB | 108 KB | 97 KB | 0.1 s | 0.004 |

All pages are under 200 KB of JavaScript. Images are WebP (slides, screenshots) or SVG. Layout shift was cut from 0.30 to under 0.1 by rendering the sidebar progress panel at build time and reserving the scrollbar gutter.

## Mobile pass (task M7-03, 2026-10-31)

All 78 pages checked at 360 px wide, both as a narrow desktop window and with phone emulation (Puppeteer `isMobile`): no page scrolls sideways or widens the layout viewport. Fixed on the way:

- lab and quiz fieldsets defaulted to `min-content` width, so wide tables pushed the page out (`min-inline-size: 0`);
- screen-reader-only text inside table scrollers was absolutely positioned and escaped the scroller (`position: relative` on `.hfld-lab__scroll` and `.hfld-scripts__scroll`);
- closed glossary tooltips still counted toward page width (now `display: none` until hover or focus);
- long inline code (asset paths) now wraps;
- the site title is a little smaller below 400 px so it isn't cut off.

Screenshots of each page type (home, lesson, lab, slides, reference) were checked by eye.
