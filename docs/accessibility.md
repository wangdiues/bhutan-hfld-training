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
