# Bhutan HFLD Training

An open course on producing **ART-TREES HFLD activity data for Bhutan** with **Google Earth Engine**: satellite composites, machine-learning land-cover maps, stratified sampling, and area estimates with uncertainty.

**Site:** https://wangdiues.github.io/bhutan-hfld-training/

## Credit
Adapted, with permission, from the **Bhutan ART-TREES HFLD Readiness Training** (May 2026) by **Ate Poortinga and Samuel, Conservation International**. The RLCMS approach is from SERVIR-SEA. See the site's About & Credits page for full acknowledgements, and [CHANGELOG.md](CHANGELOG.md) for every correction made to the source material.

## Develop
Requires Node 20+.

```bash
npm install
npm run dev      # http://localhost:4321/bhutan-hfld-training/
npm run build    # production build into dist/
npm test         # calculator tests (once added)
```

Every push to `main` deploys to GitHub Pages through GitHub Actions.

## Repository layout
| Path | Contents |
|---|---|
| `src/content/docs/` | Lessons and pages (MDX) |
| `src/components/` | Site components (credit block, quizzes, labs) |
| `scripts/gee/` | Google Earth Engine scripts, one per exercise |
| `scripts/convert/` | Pipeline that converts the original docx/pptx into lessons |

## License
- Code: [MIT](LICENSE)
- Course content: [CC BY 4.0](LICENSE-CONTENT)

## Contributing
Found an error in a lesson? [Open an issue](https://github.com/wangdiues/bhutan-hfld-training/issues) or see [CONTRIBUTING.md](CONTRIBUTING.md).
