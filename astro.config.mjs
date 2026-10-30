// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// GitHub Pages project site: https://<user>.github.io/<repo>/
const GITHUB_USER = 'wangdiues';
const REPO = 'bhutan-hfld-training';

// https://astro.build/config
export default defineConfig({
	site: `https://${GITHUB_USER}.github.io`,
	base: `/${REPO}`,
	// $…$ and $$…$$ maths in lessons, rendered at build time (no client JavaScript).
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	integrations: [
		starlight({
			title: 'Bhutan HFLD Training',
			description:
				'An open course on producing ART-TREES HFLD activity data for Bhutan with Google Earth Engine.',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
			},
			customCss: [
				'@fontsource-variable/inter',
				'@fontsource-variable/source-serif-4',
				'@fontsource-variable/jetbrains-mono',
				'katex/dist/katex.min.css',
				'./src/styles/theme.css',
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: `https://github.com/${GITHUB_USER}/${REPO}` },
			],
			editLink: {
				baseUrl: `https://github.com/${GITHUB_USER}/${REPO}/edit/main/`,
			},
			lastUpdated: true,
			// /slides/ pages are custom routes (src/pages/slides/), which the validator cannot see.
			plugins: [starlightLinksValidator({ exclude: ['/bhutan-hfld-training/slides/', '/bhutan-hfld-training/slides/**'] })],
			sidebar: [
				{
					label: 'Learn',
					items: [
						{ slug: 'start-here' },
						{ label: 'Day 1 · Earth Engine foundations', collapsed: true, items: [{ autogenerate: { directory: 'day-1' } }] },
						{ label: 'Day 2 · Composites', collapsed: true, items: [{ autogenerate: { directory: 'day-2' } }] },
						{ label: 'Day 3 · Classification', collapsed: true, items: [{ autogenerate: { directory: 'day-3' } }] },
						{ label: 'Day 4 · Land cover & embeddings', collapsed: true, items: [{ autogenerate: { directory: 'day-4' } }] },
						{ label: 'Day 5 · Accuracy & area', collapsed: true, items: [{ autogenerate: { directory: 'day-5' } }] },
						{ slug: 'capstone' },
					],
				},
				{ label: 'Slides', link: '/slides/' },
				{ label: 'Labs', collapsed: true, items: [{ autogenerate: { directory: 'labs' } }] },
				{ label: 'How-to guides', collapsed: true, items: [{ autogenerate: { directory: 'how-to' } }] },
				{ label: 'Explanation', collapsed: true, items: [{ autogenerate: { directory: 'explanation' } }] },
				{ label: 'Reference', collapsed: true, items: [{ autogenerate: { directory: 'reference' } }] },
				{ label: 'About', collapsed: true, items: [{ autogenerate: { directory: 'about' } }] },
			],
		}),
	],
});
