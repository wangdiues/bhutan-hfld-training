# Contributing

Thank you for helping improve this course.

## Report an error
Open an issue and include:
- the page URL;
- what is wrong (code that fails, a wrong number, a broken link, an unclear step);
- for code errors, the error message from the Earth Engine Code Editor console.

## Suggest a change
1. Fork the repository and create a branch.
2. Make your change. Lessons are MDX files in `src/content/docs/`. Earth Engine scripts are in `scripts/gee/`.
3. Run `npm run build` (and `npm test` if you changed anything under `src/lib/`).
4. Open a pull request describing what changed and why.

## Content rules
- **Credit:** keep the `<Credit>` block on every adapted lesson.
- **Code:** test any Earth Engine code you change in the Code Editor before submitting.
- **Facts:** cite a source for standards, thresholds and datasets. For ART-TREES, give the version and section.
- **Images:** use only images you made or that are openly licensed, with attribution.
- **Corrections:** list any correction to the original training material in `CHANGELOG.md`.

By contributing, you agree that your code is licensed under MIT and your written content under CC BY 4.0.
