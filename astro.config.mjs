// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// GitHub Pages project site: https://<user>.github.io/<repo>/
const GITHUB_USER = 'wangdiues';
const REPO = 'bhutan-hfld-training';

// https://astro.build/config
export default defineConfig({
	site: `https://${GITHUB_USER}.github.io`,
	base: `/${REPO}`,
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
				'./src/styles/theme.css',
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: `https://github.com/${GITHUB_USER}/${REPO}` },
			],
			editLink: {
				baseUrl: `https://github.com/${GITHUB_USER}/${REPO}/edit/main/`,
			},
			lastUpdated: true,
			sidebar: [
				{
					label: 'Guides',
					items: [{ label: 'Example Guide', slug: 'guides/example' }],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
		}),
	],
});
