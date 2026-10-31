/**
 * Vector maths and synthetic 64-dimensional embeddings for Lab 6, the embedding similarity
 * visualiser (task M5-08). The vectors are generated, not real AlphaEarth embeddings: they are
 * built so that their similarities behave like the ones learners meet in the Day 4 and Day 5
 * scripts. Seeded, so every visitor sees the same numbers.
 */
import { rng } from './trees';

export const DIM = 64;

export function dot(a: number[], b: number[]): number {
	let s = 0;
	for (let i = 0; i < a.length; i++) s += a[i] * b[i];
	return s;
}

export function norm(a: number[]): number {
	return Math.sqrt(dot(a, a));
}

/** Unit vector in the same direction; null for the zero vector. */
export function normalize(a: number[]): number[] | null {
	const n = norm(a);
	return n === 0 ? null : a.map((x) => x / n);
}

/** Cosine similarity; null when either vector is zero. */
export function cosine(a: number[], b: number[]): number | null {
	const na = norm(a);
	const nb = norm(b);
	return na === 0 || nb === 0 ? null : dot(a, b) / (na * nb);
}

/** Similarity of two 2-D unit vectors at angles a and b (degrees): cos(a − b). */
export function cosine2d(aDeg: number, bDeg: number): number {
	const r = Math.PI / 180;
	return Math.cos(aDeg * r) * Math.cos(bDeg * r) + Math.sin(aDeg * r) * Math.sin(bDeg * r);
}

function gaussian(random: () => number): number {
	// Box-Muller
	const u = 1 - random();
	const v = random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function randomUnit(random: () => number): number[] {
	return normalize(Array.from({ length: DIM }, () => gaussian(random)))!;
}

const add = (a: number[], b: number[], ka: number, kb: number) => a.map((x, i) => ka * x + kb * b[i]);

/** A unit vector whose cosine similarity with unit vector u is exactly c (−1 ≤ c ≤ 1). */
export function withSimilarity(u: number[], c: number, random: () => number): number[] {
	const r = randomUnit(random);
	// Remove the part of r along u, leaving a unit vector w at right angles to u.
	const w = normalize(add(r, u, 1, -dot(r, u)))!;
	return add(u, w, c, Math.sqrt(Math.max(0, 1 - c * c)));
}

export interface Place {
	id: string;
	name: string;
	cover: string;
	v: number[];
}

export interface ChangePair {
	id: string;
	name: string;
	/** Land cover in the first year; the course flags only pixels that were forest. */
	forestBefore: boolean;
	/** What really happened on the ground (for discussion). */
	truth: string;
	realForestLoss: boolean;
	similarity: number;
	before: number[];
	after: number[];
}

/** Eight places in Bhutan with synthetic embeddings. */
export function makePlaces(seed = 2025): Place[] {
	const random = rng(seed);
	const common = randomUnit(random);
	const proto = (k = 0.6) => normalize(add(common, randomUnit(random), k, Math.sqrt(1 - k * k)))!;
	const conifer = proto();
	const broadleaf = normalize(add(conifer, randomUnit(random), 0.75, 0.66))!;
	const paddy = proto();
	const meadow = normalize(add(paddy, proto(), 0.4, 0.9))!;
	const water = proto(0.3);
	const urban = proto();
	const near = (p: number[], c: number) => withSimilarity(p, c, random);
	return [
		{ id: 'bumthang', name: 'Blue pine forest, Bumthang', cover: 'Forest', v: near(conifer, 0.97) },
		{ id: 'haa-forest', name: 'Fir forest, Haa', cover: 'Forest', v: near(conifer, 0.95) },
		{ id: 'trongsa', name: 'Broadleaf forest, Trongsa', cover: 'Forest', v: near(broadleaf, 0.97) },
		{ id: 'punakha', name: 'Paddy fields, Punakha', cover: 'Cropland', v: near(paddy, 0.97) },
		{ id: 'paro', name: 'Paddy fields, Paro', cover: 'Cropland', v: near(paddy, 0.96) },
		{ id: 'haa-meadow', name: 'Alpine meadow, Haa', cover: 'Grassland', v: near(meadow, 0.97) },
		{ id: 'river', name: 'Punatsangchhu river', cover: 'Water', v: near(water, 0.98) },
		{ id: 'thimphu', name: 'Thimphu town', cover: 'Settlement', v: near(urban, 0.97) },
	];
}

/** Nine pixels seen in 2024 and 2025, with designed similarities (kept off the slider's 0.005 steps). */
export function makeChangePairs(seed = 2425): ChangePair[] {
	const random = rng(seed);
	const spec: Omit<ChangePair, 'before' | 'after'>[] = [
		{ id: 'stable', name: 'Stable forest, Trongsa', forestBefore: true, truth: 'No change', realForestLoss: false, similarity: 0.985 },
		{ id: 'cloudy', name: 'Stable forest, cloudy year, Samtse', forestBefore: true, truth: 'No change; few clear images in 2025', realForestLoss: false, similarity: 0.948 },
		{ id: 'road', name: 'Farm road cut, Zhemgang', forestBefore: true, truth: 'Forest cleared', realForestLoss: true, similarity: 0.71 },
		{ id: 'hydro', name: 'Hydropower site, Punatsangchhu', forestBefore: true, truth: 'Forest cleared', realForestLoss: true, similarity: 0.58 },
		{ id: 'clearing', name: 'Small clearing for a house, Wangdue Phodrang', forestBefore: true, truth: 'Forest cleared (small patch)', realForestLoss: true, similarity: 0.928 },
		{ id: 'logging', name: 'Selective logging, Bumthang', forestBefore: true, truth: 'Degraded, still forest', realForestLoss: false, similarity: 0.963 },
		{ id: 'landslide', name: 'Landslide scar, Chhukha', forestBefore: true, truth: 'Forest lost to a landslide', realForestLoss: true, similarity: 0.66 },
		{ id: 'paddy', name: 'Paddy, fallow in 2025, Paro', forestBefore: false, truth: 'Field left fallow', realForestLoss: false, similarity: 0.9 },
		{ id: 'houses', name: 'New houses on farmland, Thimphu', forestBefore: false, truth: 'Cropland to settlement', realForestLoss: false, similarity: 0.7 },
	];
	return spec.map((s) => {
		const before = randomUnit(random);
		return { ...s, before, after: withSimilarity(before, s.similarity, random) };
	});
}

/** The Day 5 rule: a pixel that was forest and whose similarity is below the threshold is flagged. */
export function flagged(p: ChangePair, threshold: number): boolean {
	const s = cosine(p.before, p.after);
	return p.forestBefore && s !== null && s < threshold;
}

export function rankBySimilarity(places: Place[], refId: string): { place: Place; similarity: number }[] {
	const ref = places.find((p) => p.id === refId);
	if (!ref) return [];
	return places
		.filter((p) => p.id !== refId)
		.map((place) => ({ place, similarity: dot(ref.v, place.v) }))
		.sort((a, b) => b.similarity - a.similarity);
}
