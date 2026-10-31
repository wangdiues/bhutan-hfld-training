# LULC Mapping Training

A free, open course in **land use and land cover (LULC) mapping** with **Google Earth Engine**: satellite composites, machine-learning land-cover maps, stratified sampling, and area estimates with uncertainty. Bhutan is the worked example.

**Site:** https://wangdiues.github.io/lulc-mapping-training/

## Acknowledgements
Built on the materials of a May 2026 training, used with the trainers' permission. See the site's [Acknowledgements and credits](https://wangdiues.github.io/lulc-mapping-training/about/credits/) page, and [CHANGELOG.md](CHANGELOG.md) for every correction made to the source material.

## Develop
Requires Node 20+.

```bash
npm install
npm run dev      # http://localhost:4321/lulc-mapping-training/
npm run build    # production build into dist/
npm test         # unit tests (calculators, labs)
```

Every push to `main` deploys to GitHub Pages through GitHub Actions.

## Repository layout
| Path | Contents |
|---|---|
| `src/content/docs/` | Lessons and pages (MDX) |
| `src/components/` | Site components (quizzes, labs, slide player) |
| `scripts/gee/` | Google Earth Engine scripts, one per exercise |
| `scripts/convert/` | Pipeline that converts the original docx/pptx into lessons |

## License
- Code: [MIT](LICENSE)
- Course content: [CC BY 4.0](LICENSE-CONTENT)

## Contributing
Found an error in a lesson? [Open an issue](https://github.com/wangdiues/lulc-mapping-training/issues) or see [CONTRIBUTING.md](CONTRIBUTING.md).
