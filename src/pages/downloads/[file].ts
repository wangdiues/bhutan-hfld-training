/**
 * Downloads hub files (task M6-06), generated at build time so they always match the site:
 * every script in scripts/gee/ as one zip, and CSV templates that Lab 2 accepts.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { workbookExample } from '~/lib/stats/accuracyLab';
import { zip } from '~/lib/zip';

const scripts = import.meta.glob('/scripts/gee/**/*.{js,py}', { query: '?raw', import: 'default', eager: true }) as Record<
	string,
	string
>;

const README = `Bhutan HFLD training: Earth Engine scripts
https://wangdiues.github.io/bhutan-hfld-training/

One folder per day. .js files run in the Earth Engine Code Editor; .py files are geemap
versions (replace <your-project> with your Cloud project ID). Each file starts with a header
naming its source, its original authors and the changes made for this course.

Adapted, with permission, from the Bhutan ART-TREES HFLD Readiness Training (May 2026) by
Ate Poortinga and Samuel, Conservation International. Code licence: MIT.
Many scripts read assets shared with training participants; see
https://wangdiues.github.io/bhutan-hfld-training/reference/assets/ to make your own.
`;

function matrixTemplate(): string {
	const ex = workbookExample();
	const rows = [['map \\ reference', ...ex.classes, 'area_ha']];
	ex.classes.forEach((c, i) => rows.push([c, ...ex.matrix[i].map(String), String(Math.round(ex.mappedAreaHa[i]))]));
	return rows.map((r) => r.join(',')).join('\n') + '\n';
}

const SAMPLES = `plotID,map,reference
1,Forest,Forest
2,Forest,Forest
3,Forest,Non-Forest
4,Deforestation,Deforestation
5,Deforestation,Forest
6,Non-Forest,Non-Forest
`;

const enc = new TextEncoder();
const FILES: Record<string, { type: string; body: () => Uint8Array | string }> = {
	'bhutan-hfld-scripts.zip': {
		type: 'application/zip',
		body: () =>
			zip([
				{ name: 'bhutan-hfld-scripts/README.txt', data: enc.encode(README) },
				...Object.entries(scripts)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([file, code]) => ({ name: `bhutan-hfld-scripts/${file.replace('/scripts/gee/', '')}`, data: enc.encode(code) })),
			]),
	},
	'confusion-matrix-template.csv': { type: 'text/csv; charset=utf-8', body: matrixTemplate },
	'samples-template.csv': { type: 'text/csv; charset=utf-8', body: () => SAMPLES },
};

export const getStaticPaths = (() => Object.keys(FILES).map((file) => ({ params: { file } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
	const f = FILES[params.file as string];
	return new Response(f.body(), { headers: { 'Content-Type': f.type } });
};
