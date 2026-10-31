// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import offline from './integrations/offline.mjs';

// GitHub Pages project site: https://<user>.github.io/<repo>/
const GITHUB_USER = 'wangdiues';
const REPO = 'lulc-mapping-training';

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
			title: 'LULC Mapping Training',
			description:
				'A free course in land use and land cover (LULC) mapping with Google Earth Engine, using Bhutan as the worked example.',
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
			// Offline use (task M6-05): web app manifest and the service worker written by integrations/offline.mjs.
			head: [
				// Sharing (task M7-05): one share image for every page; Starlight adds og:title and og:description.
				{ tag: 'meta', attrs: { property: 'og:image', content: `https://${GITHUB_USER}.github.io/${REPO}/og-image.png` } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
				{ tag: 'meta', attrs: { property: 'og:image:alt', content: 'LULC Mapping Training: a free course in land-cover mapping with Google Earth Engine' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: `https://${GITHUB_USER}.github.io/${REPO}/og-image.png` } },
				// Trainer mode (task M6-04): set before the page draws, so trainer notes don't flash.
				{
					tag: 'script',
					content: `try { if (JSON.parse(localStorage.getItem('hfld-trainer')) === true) document.documentElement.dataset.trainer = ''; } catch (e) {}`,
				},
				{ tag: 'link', attrs: { rel: 'manifest', href: `/${REPO}/manifest.webmanifest` } },
				{
					tag: 'script',
					content: `if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/${REPO}/sw.js', { scope: '/${REPO}/' }).catch(() => {}));`,
				},
			],
			// Lesson progress (task M6-01): a "mark complete" toggle and per-day progress in the sidebar.
			components: {
				Footer: './src/components/overrides/Footer.astro',
				Sidebar: './src/components/overrides/Sidebar.astro',
			},
			// /slides/ pages are custom routes (src/pages/slides/), which the validator cannot see.
			plugins: [starlightLinksValidator({ exclude: ['/lulc-mapping-training/slides/', '/lulc-mapping-training/slides/**'] })],
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
						{ slug: 'certificate' },
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
		offline({ base: `/${REPO}` }),
	],
});
