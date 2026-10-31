/**
 * Spectral indices for Lab 3, the spectral index explorer (task M5-05). Pure functions on
 * reflectance from 0 to 1; each returns null when its denominator is zero, so the UI can show
 * "—" instead of NaN or Infinity. Formulas match scripts/gee/day-3/covariates.js. IBI is left out:
 * in the index form used there, (NDBI − (SAVI + MNDWI)/2) / (NDBI + (SAVI + MNDWI)/2), the
 * denominator can cross zero, so its values are unbounded and not comparable between surfaces.
 */
export type Band = 'blue' | 'green' | 'red' | 'nir' | 'swir1' | 'swir2';
export type Reflectance = Record<Band, number>;

export const BANDS: { id: Band; name: string; s2: string; landsat: string }[] = [
	{ id: 'blue', name: 'Blue', s2: 'B2', landsat: 'B2' },
	{ id: 'green', name: 'Green', s2: 'B3', landsat: 'B3' },
	{ id: 'red', name: 'Red', s2: 'B4', landsat: 'B4' },
	{ id: 'nir', name: 'Near infrared (NIR)', s2: 'B8', landsat: 'B5' },
	{ id: 'swir1', name: 'Shortwave infrared 1 (SWIR1)', s2: 'B11', landsat: 'B6' },
	{ id: 'swir2', name: 'Shortwave infrared 2 (SWIR2)', s2: 'B12', landsat: 'B7' },
];

// Denominators this close to zero come from rounding, not real surfaces; treat them as zero.
const EPS = 1e-9;
const ratio = (num: number, den: number): number | null => (Math.abs(den) < EPS ? null : num / den);
const nd = (a: number, b: number): number | null => ratio(a - b, a + b);

export function evi(r: Reflectance): number | null {
	return ratio(2.5 * (r.nir - r.red), r.nir + 6 * r.red - 7.5 * r.blue + 1);
}

export function savi(r: Reflectance): number | null {
	return ratio(1.5 * (r.nir - r.red), r.nir + r.red + 0.5);
}

export interface IndexDef {
	id: string;
	name: string;
	formula: string;
	/** Bands used, in formula order, for the Earth Engine code snippet. */
	bands: Band[];
	/** Earth Engine expression with band placeholders, or null when normalizedDifference fits. */
	expression: string | null;
	high: string;
	compute: (r: Reflectance) => number | null;
}

export const INDICES: IndexDef[] = [
	{ id: 'ndvi', name: 'NDVI', formula: '(NIR − Red) / (NIR + Red)', bands: ['nir', 'red'], expression: null, high: 'dense green vegetation', compute: (r) => nd(r.nir, r.red) },
	{ id: 'evi', name: 'EVI', formula: '2.5 × (NIR − Red) / (NIR + 6 Red − 7.5 Blue + 1)', bands: ['nir', 'red', 'blue'], expression: '2.5 * (NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1)', high: 'green vegetation, less saturated over dense forest', compute: evi },
	{ id: 'savi', name: 'SAVI', formula: '1.5 × (NIR − Red) / (NIR + Red + 0.5)', bands: ['nir', 'red'], expression: '1.5 * (NIR - RED) / (NIR + RED + 0.5)', high: 'vegetation, with less soil effect', compute: savi },
	{ id: 'ndmi', name: 'NDMI', formula: '(NIR − SWIR1) / (NIR + SWIR1)', bands: ['nir', 'swir1'], expression: null, high: 'moist canopy', compute: (r) => nd(r.nir, r.swir1) },
	{ id: 'nbr', name: 'NBR', formula: '(NIR − SWIR2) / (NIR + SWIR2)', bands: ['nir', 'swir2'], expression: null, high: 'healthy vegetation (low after fire or clearing)', compute: (r) => nd(r.nir, r.swir2) },
	{ id: 'ndwi', name: 'NDWI', formula: '(Green − NIR) / (Green + NIR)', bands: ['green', 'nir'], expression: null, high: 'open water', compute: (r) => nd(r.green, r.nir) },
	{ id: 'mndwi', name: 'MNDWI', formula: '(Green − SWIR1) / (Green + SWIR1)', bands: ['green', 'swir1'], expression: null, high: 'open water', compute: (r) => nd(r.green, r.swir1) },
	{ id: 'ndbi', name: 'NDBI', formula: '(SWIR1 − NIR) / (SWIR1 + NIR)', bands: ['swir1', 'nir'], expression: null, high: 'built-up and bare land', compute: (r) => nd(r.swir1, r.nir) },
];

/** Typical, rounded reflectance (0–1) for teaching; not measurements. */
export const PRESETS: { id: string; name: string; r: Reflectance }[] = [
	{ id: 'forest', name: 'Dense forest', r: { blue: 0.03, green: 0.06, red: 0.03, nir: 0.35, swir1: 0.16, swir2: 0.07 } },
	{ id: 'vegetation', name: 'Green vegetation (as in the Day 2 diagram)', r: { blue: 0.05, green: 0.1, red: 0.04, nir: 0.45, swir1: 0.24, swir2: 0.12 } },
	{ id: 'grass', name: 'Dry grassland', r: { blue: 0.06, green: 0.09, red: 0.11, nir: 0.25, swir1: 0.3, swir2: 0.2 } },
	{ id: 'soil', name: 'Bare soil', r: { blue: 0.1, green: 0.14, red: 0.19, nir: 0.27, swir1: 0.34, swir2: 0.3 } },
	{ id: 'burned', name: 'Recently burned or cleared', r: { blue: 0.05, green: 0.06, red: 0.07, nir: 0.12, swir1: 0.2, swir2: 0.19 } },
	{ id: 'built', name: 'Built-up', r: { blue: 0.12, green: 0.13, red: 0.14, nir: 0.18, swir1: 0.24, swir2: 0.21 } },
	{ id: 'water', name: 'Clear water', r: { blue: 0.08, green: 0.06, red: 0.03, nir: 0.01, swir1: 0.005, swir2: 0.003 } },
];

/** Values beyond this come only from a near-zero denominator and are shown as "—". */
export const DISPLAY_LIMIT = 10;

export function computeAll(r: Reflectance): { id: string; value: number | null }[] {
	return INDICES.map((d) => {
		const v = d.compute(r);
		return { id: d.id, value: v === null || Math.abs(v) > DISPLAY_LIMIT ? null : v };
	});
}

const PREAMBLE: Record<'s2' | 'landsat', string> = {
	s2: [
		"// image: one Sentinel-2 SR image (COPERNICUS/S2_SR_HARMONIZED), scaled to 0-1 reflectance.",
		"// On the course composites, add the season to each band name, e.g. 'B8_jan_apr'.",
		'image = image.divide(10000);',
	].join('\n'),
	landsat: [
		'// image: one Landsat 8/9 Collection 2 Level-2 image (LANDSAT/LC08/C02/T1_L2), scaled to 0-1.',
		"// On the course composites the bands are B2-B7 (with a season suffix): divide by 10000 instead.",
		"image = image.select('SR_B.').multiply(0.0000275).add(-0.2);",
	].join('\n'),
};

/** Earth Engine JavaScript for one index on a Sentinel-2 or Landsat Level-2 image. */
export function eeSnippet(def: IndexDef, sensor: 's2' | 'landsat'): string {
	const band = (b: Band) => (sensor === 'landsat' ? 'SR_' : '') + BANDS.find((x) => x.id === b)![sensor];
	if (def.expression === null) {
		return `${PREAMBLE[sensor]}\nvar ${def.id} = image.normalizedDifference(['${band(def.bands[0])}', '${band(def.bands[1])}']).rename('${def.name}');`;
	}
	const names: Record<string, Band> = { NIR: 'nir', RED: 'red', BLUE: 'blue' };
	const map = Object.entries(names)
		.filter(([, b]) => def.bands.includes(b))
		.map(([k, b]) => `  ${k}: image.select('${band(b)}')`)
		.join(',\n');
	return `${PREAMBLE[sensor]}\nvar ${def.id} = image.expression(\n  '${def.expression}', {\n${map}\n}).rename('${def.name}');`;
}

export function isReflectance(x: unknown): x is Reflectance {
	if (typeof x !== 'object' || x === null) return false;
	return BANDS.every((b) => {
		const v = (x as Record<string, unknown>)[b.id];
		return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
	});
}
