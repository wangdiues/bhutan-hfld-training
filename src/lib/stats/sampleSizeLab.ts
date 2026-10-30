/**
 * Lab 1 (task M5-02): everything the sample-size page shows, from its inputs, in one pure
 * function. Built on sampleSize.ts; tested against the Day 5 workbook in tests/stats.test.ts.
 */
import {
	allocateEqual,
	allocateMinimum,
	allocateProportional,
	roundHalfUp,
	sampleSize,
	samplingDensity,
	type Stratum,
} from './sampleSize';

export type MinimumRole = 'share' | 'minimum' | 'zero';

export interface LabStratum extends Stratum {
	/** How the "minimum of m" allocation treats this stratum. */
	role: MinimumRole;
}

export interface LabInput {
	strata: LabStratum[];
	targetIndex: number;
	marginOfErrorPercent: number;
	z: number;
	minimum: number;
}

export interface Allocation {
	samples: number[];
	/** Hectares per sample; null where a stratum gets no samples. */
	density: (number | null)[];
	total: number;
}

export interface LabResult {
	totalAreaHa: number;
	weights: number[];
	stdDevs: number[];
	weightTimesStdDev: number[];
	sumWS: number;
	targetSE: number;
	n: number;
	nRounded: number;
	equal: Allocation;
	proportional: Allocation;
	/** null when the minimums alone need more samples than n (it would give negative counts). */
	minimum: Allocation | null;
	/** Problems the user should fix or know about; the numbers are still shown where valid. */
	warnings: string[];
}

export type LabOutcome = { ok: true; result: LabResult } | { ok: false; error: string };

function allocation(areas: number[], samples: number[]): Allocation {
	return {
		samples,
		density: samplingDensity(areas, samples).map((d, i) => (samples[i] === 0 ? null : d)),
		total: samples.reduce((s, x) => s + x, 0),
	};
}

/** Check the inputs and compute; returns a readable error instead of NaN or Infinity. */
export function runSampleSizeLab(input: LabInput): LabOutcome {
	const { strata, targetIndex, marginOfErrorPercent, z, minimum } = input;
	if (strata.length === 0) return { ok: false, error: 'Add at least one stratum.' };
	for (const s of strata) {
		const label = s.name || 'A stratum';
		if (!Number.isFinite(s.areaHa) || s.areaHa < 0) return { ok: false, error: `${label}: area must be a number of hectares, 0 or more.` };
		if (!Number.isFinite(s.expectedProportion) || s.expectedProportion < 0 || s.expectedProportion > 1)
			return { ok: false, error: `${label}: expected proportion must be between 0 and 1.` };
	}
	const totalAreaHa = strata.reduce((s, x) => s + x.areaHa, 0);
	if (!(totalAreaHa > 0)) return { ok: false, error: 'The total area is 0, so stratum weights cannot be computed. Enter the stratum areas.' };
	if (targetIndex < 0 || targetIndex >= strata.length) return { ok: false, error: 'Choose the target stratum.' };
	if (!(strata[targetIndex].areaHa > 0))
		return { ok: false, error: `The target stratum (${strata[targetIndex].name}) has no area, so its target standard error would be 0. Enter its area.` };
	if (!(marginOfErrorPercent > 0)) return { ok: false, error: 'The margin of error must be greater than 0%.' };
	if (!(z > 0)) return { ok: false, error: 'Choose a confidence level.' };
	if (!Number.isFinite(minimum) || minimum < 0) return { ok: false, error: 'The minimum per stratum must be 0 or more.' };

	const r = sampleSize({ strata, targetIndex, marginOfErrorPercent, z, totalAreaHa });
	const areas = strata.map((s) => s.areaHa);
	const nRounded = roundHalfUp(r.n);
	const warnings: string[] = [];
	if (r.sumWS === 0)
		warnings.push('Every expected proportion is 0 or 1, so the strata have no variance and the formula gives 0 samples. Enter realistic expected proportions.');
	const roles = strata.map((s) => s.role);
	const minUsed = minimum * roles.filter((x) => x !== 'zero').length;
	const minimumFits = minUsed <= nRounded;
	if (!minimumFits)
		warnings.push(
			`The minimum of ${minimum} per stratum needs ${minUsed} samples, more than the ${nRounded} the formula gives, so the "minimum" allocation cannot be made (it would need negative samples). Lower the minimum, or tighten the margin of error to raise n.`,
		);
	if (!roles.includes('share'))
		warnings.push('No stratum is set to "share the rest", so the minimum allocation does not use the full sample size.');
	strata.forEach((s, i) => {
		if (s.areaHa === 0) warnings.push(`${s.name || `Stratum ${i + 1}`} has no area and gets no samples in equal or proportional allocation.`);
	});

	return {
		ok: true,
		result: {
			totalAreaHa,
			weights: r.weights,
			stdDevs: r.stdDevs,
			weightTimesStdDev: r.weights.map((w, i) => w * r.stdDevs[i]),
			sumWS: r.sumWS,
			targetSE: r.targetSE,
			n: r.n,
			nRounded,
			equal: allocation(areas, allocateEqual(r.n, areas)),
			proportional: allocation(areas, allocateProportional(r.n, r.weights)),
			minimum: minimumFits ? allocation(areas, allocateMinimum(r.n, areas, minimum, roles)) : null,
			warnings,
		},
	};
}

/** Bhutan's strata as in the Day 5 workbook ("Exercise D5-Sample Size Calculator.xlsx"). */
export const BHUTAN_STRATA_REPORT = [
	{ code: 0, name: 'null', areaHa: 866.854 },
	{ code: 1, name: 'Cropland', areaHa: 103503.83 },
	{ code: 10, name: 'Deforestation', areaHa: 12136.25 },
	{ code: 2, name: 'Forest', areaHa: 2675342.29 },
	{ code: 3, name: 'Grassland', areaHa: 637136.24 },
	{ code: 4, name: 'Wetland', areaHa: 37036.39 },
	{ code: 5, name: 'Settlement', areaHa: 61392.09 },
	{ code: 6, name: 'Other Land', areaHa: 348884.7 },
] as const;

/** The workbook's five strata: Forest split 70/20/10, Non Forest = all other non-change classes. */
export function bhutanDefaults(): LabInput {
	const area = (name: string) => BHUTAN_STRATA_REPORT.find((r) => r.name === name)!.areaHa;
	const forest = area('Forest');
	const nonForest = ['null', 'Cropland', 'Grassland', 'Wetland', 'Settlement', 'Other Land'].reduce((s, n) => s + area(n), 0);
	return {
		strata: [
			{ name: 'Forest 1', areaHa: (forest * 70) / 100, expectedProportion: 0.0005, role: 'share' },
			{ name: 'Forest 2', areaHa: (forest * 20) / 100, expectedProportion: 0.001, role: 'share' },
			{ name: 'Forest 3', areaHa: (forest * 10) / 100, expectedProportion: 0.003, role: 'share' },
			{ name: 'Non Forest', areaHa: nonForest, expectedProportion: 0, role: 'zero' },
			{ name: 'Deforestation', areaHa: area('Deforestation'), expectedProportion: 0.8, role: 'minimum' },
		],
		targetIndex: 4,
		marginOfErrorPercent: 25,
		z: 1.6449,
		minimum: 130,
	};
}

/** True if a saved value has the shape of LabInput (saved state may be old or corrupted). */
export function isLabInput(x: unknown): x is LabInput {
	if (!x || typeof x !== 'object') return false;
	const v = x as Record<string, unknown>;
	const roles = ['share', 'minimum', 'zero'];
	return (
		Array.isArray(v.strata) &&
		v.strata.length > 0 &&
		v.strata.every(
			(s) =>
				s && typeof s === 'object' && typeof s.name === 'string' && typeof s.areaHa === 'number' &&
				typeof s.expectedProportion === 'number' && roles.includes(s.role),
		) &&
		typeof v.targetIndex === 'number' &&
		typeof v.marginOfErrorPercent === 'number' &&
		typeof v.z === 'number' &&
		typeof v.minimum === 'number'
	);
}
