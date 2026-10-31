/**
 * Decision trees and a small Random Forest for Lab 4, the decision tree playground (task M5-06).
 * Pure functions: entropy, information gain, best split, tree growing and forest voting, with a
 * seeded random number generator so that every learner sees the same forest.
 */
export type Feature = 'ndvi' | 'nir' | 'elevation';
export type Op = '>' | '<';

export interface Sample {
	ndvi: number;
	nir: number;
	elevation: number;
	label: string;
}

export const FEATURES: { id: Feature; name: string; unit: string; step: number }[] = [
	{ id: 'ndvi', name: 'NDVI', unit: '', step: 0.05 },
	{ id: 'nir', name: 'NIR reflectance', unit: '', step: 0.01 },
	{ id: 'elevation', name: 'Elevation', unit: 'm', step: 100 },
];

/** The 10 pixels of the worked example in the Random Forest lesson (5 forest, 3 grassland, 2 water). */
export const WORKED_EXAMPLE: Sample[] = [
	{ ndvi: 0.82, nir: 0.34, elevation: 2400, label: 'Forest' },
	{ ndvi: 0.78, nir: 0.31, elevation: 2900, label: 'Forest' },
	{ ndvi: 0.74, nir: 0.29, elevation: 1800, label: 'Forest' },
	{ ndvi: 0.69, nir: 0.3, elevation: 3100, label: 'Forest' },
	{ ndvi: 0.63, nir: 0.27, elevation: 2200, label: 'Forest' },
	{ ndvi: 0.56, nir: 0.24, elevation: 3600, label: 'Grassland' },
	{ ndvi: 0.42, nir: 0.21, elevation: 3900, label: 'Grassland' },
	{ ndvi: 0.35, nir: 0.19, elevation: 4100, label: 'Grassland' },
	{ ndvi: -0.2, nir: 0.03, elevation: 2300, label: 'Water' },
	{ ndvi: -0.35, nir: 0.02, elevation: 1500, label: 'Water' },
];

/** A larger illustrative set for western Bhutan (typical values, not measurements). */
export const WESTERN_BHUTAN: Sample[] = [
	...WORKED_EXAMPLE,
	{ ndvi: 0.8, nir: 0.33, elevation: 1200, label: 'Forest' },
	{ ndvi: 0.71, nir: 0.28, elevation: 3400, label: 'Forest' },
	{ ndvi: 0.66, nir: 0.26, elevation: 2700, label: 'Forest' },
	{ ndvi: 0.58, nir: 0.25, elevation: 3700, label: 'Forest' },
	{ ndvi: 0.5, nir: 0.22, elevation: 3800, label: 'Grassland' },
	{ ndvi: 0.31, nir: 0.18, elevation: 4300, label: 'Grassland' },
	{ ndvi: 0.27, nir: 0.17, elevation: 4000, label: 'Grassland' },
	{ ndvi: 0.62, nir: 0.27, elevation: 1300, label: 'Cropland' },
	{ ndvi: 0.48, nir: 0.23, elevation: 1400, label: 'Cropland' },
	{ ndvi: 0.38, nir: 0.2, elevation: 1250, label: 'Cropland' },
	{ ndvi: 0.55, nir: 0.25, elevation: 2300, label: 'Cropland' },
	{ ndvi: 0.29, nir: 0.19, elevation: 1600, label: 'Cropland' },
	{ ndvi: -0.15, nir: 0.04, elevation: 1200, label: 'Water' },
	{ ndvi: -0.05, nir: 0.06, elevation: 4200, label: 'Water' },
];

export function counts(samples: Sample[]): Record<string, number> {
	const c: Record<string, number> = {};
	for (const s of samples) c[s.label] = (c[s.label] ?? 0) + 1;
	return c;
}

/** Shannon entropy in bits; 0 for an empty or pure set. */
export function entropy(samples: Sample[]): number {
	const n = samples.length;
	if (n === 0) return 0;
	let e = 0;
	for (const k of Object.values(counts(samples))) {
		const p = k / n;
		e -= p * Math.log2(p);
	}
	return e;
}

export const test = (s: Sample, f: Feature, op: Op, t: number) => (op === '>' ? s[f] > t : s[f] < t);

export interface SplitStats {
	feature: Feature;
	op: Op;
	threshold: number;
	yes: Sample[];
	no: Sample[];
	before: number;
	yesEntropy: number;
	noEntropy: number;
	after: number;
	gain: number;
}

export function splitStats(samples: Sample[], feature: Feature, op: Op, threshold: number): SplitStats {
	const yes = samples.filter((s) => test(s, feature, op, threshold));
	const no = samples.filter((s) => !test(s, feature, op, threshold));
	const n = samples.length;
	const before = entropy(samples);
	const yesEntropy = entropy(yes);
	const noEntropy = entropy(no);
	const after = n === 0 ? 0 : (yes.length / n) * yesEntropy + (no.length / n) * noEntropy;
	return { feature, op, threshold, yes, no, before, yesEntropy, noEntropy, after, gain: before - after };
}

/** Best split over the given features, trying thresholds halfway between sorted values. */
export function bestSplit(samples: Sample[], features: Feature[] = ['ndvi', 'nir', 'elevation']): SplitStats | null {
	let best: SplitStats | null = null;
	for (const f of features) {
		const values = [...new Set(samples.map((s) => s[f]))].sort((a, b) => a - b);
		for (let i = 0; i < values.length - 1; i++) {
			const t = Number(((values[i] + values[i + 1]) / 2).toFixed(4));
			const s = splitStats(samples, f, '>', t);
			if (s.yes.length && s.no.length && (!best || s.gain > best.gain + 1e-12)) best = s;
		}
	}
	return best;
}

export function majority(samples: Sample[]): string {
	const c = counts(samples);
	return Object.keys(c).sort((a, b) => c[b] - c[a] || a.localeCompare(b))[0] ?? '—';
}

export type Node =
	| { kind: 'leaf'; samples: Sample[] }
	| { kind: 'split'; samples: Sample[]; feature: Feature; op: Op; threshold: number; yes: Node; no: Node };

export function predict(node: Node, x: Pick<Sample, Feature>): string {
	if (node.kind === 'leaf') return majority(node.samples);
	return predict(test(x as Sample, node.feature, node.op, node.threshold) ? node.yes : node.no, x);
}

/** mulberry32: a small seeded generator, so the forest is the same on every visit. */
export function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Grow a tree to maxDepth, choosing `perSplit` random features at each node (all when undefined). */
export function growTree(samples: Sample[], maxDepth: number, random?: () => number, perSplit?: number): Node {
	if (maxDepth === 0 || entropy(samples) === 0 || samples.length < 2) return { kind: 'leaf', samples };
	let features: Feature[] = ['ndvi', 'nir', 'elevation'];
	if (random && perSplit && perSplit < features.length) {
		// Fisher-Yates shuffle, then keep the first perSplit features.
		features = [...features];
		for (let i = features.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[features[i], features[j]] = [features[j], features[i]];
		}
		features = features.slice(0, perSplit);
	}
	const s = bestSplit(samples, features);
	if (!s || s.gain <= 0) return { kind: 'leaf', samples };
	return {
		kind: 'split',
		samples,
		feature: s.feature,
		op: s.op,
		threshold: s.threshold,
		yes: growTree(s.yes, maxDepth - 1, random, perSplit),
		no: growTree(s.no, maxDepth - 1, random, perSplit),
	};
}

export interface Forest {
	trees: Node[];
}

/** Random Forest: each tree sees a bootstrap sample (with replacement) and one random feature per split. */
export function growForest(samples: Sample[], nTrees: number, maxDepth: number, seed = 42, perSplit = 1): Forest {
	const random = rng(seed);
	const trees: Node[] = [];
	for (let i = 0; i < nTrees; i++) {
		const bag = samples.map(() => samples[Math.floor(random() * samples.length)]);
		trees.push(growTree(bag, maxDepth, random, perSplit));
	}
	return { trees };
}

export function vote(forest: Forest, x: Pick<Sample, Feature>): { label: string; votes: number }[] {
	const c: Record<string, number> = {};
	for (const t of forest.trees) {
		const l = predict(t, x);
		c[l] = (c[l] ?? 0) + 1;
	}
	return Object.entries(c)
		.map(([label, votes]) => ({ label, votes }))
		.sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label));
}

export function describe(node: Node, depth = 0): string[] {
	const pad = '  '.repeat(depth);
	if (node.kind === 'leaf') return [`${pad}→ ${majority(node.samples)} (${node.samples.length})`];
	const name = FEATURES.find((f) => f.id === node.feature)!.name;
	return [
		`${pad}${name} ${node.op} ${node.threshold}?`,
		`${pad} yes:`,
		...describe(node.yes, depth + 1),
		`${pad} no:`,
		...describe(node.no, depth + 1),
	];
}
