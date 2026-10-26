/**
 * Stratified sample size and allocation for estimating the area of a target class
 * (e.g. deforestation). Reproduces "Exercise D5-Sample Size Calculator.xlsx"; see docs/calculator-spec.md.
 */

export const Z = { ci90: 1.6449, ci95: 1.96 } as const;

export interface Stratum {
	name: string;
	areaHa: number;
	/** Expected proportion of the target class within this stratum, pᵢ (0–1). */
	expectedProportion: number;
}

export interface SampleSizeInput {
	strata: Stratum[];
	/** Index of the stratum that is the target class (its mapped proportion sets the target SE). */
	targetIndex: number;
	/** Target margin of error as % of the target-class proportion. */
	marginOfErrorPercent: number;
	z: number;
	/** Total area used for weights; defaults to the sum of stratum areas. */
	totalAreaHa?: number;
}

export interface SampleSizeResult {
	weights: number[];
	stdDevs: number[];
	sumWS: number;
	targetSE: number;
	/** Unrounded total sample size n = (ΣWᵢSᵢ / SE)². */
	n: number;
}

export function sampleSize(input: SampleSizeInput): SampleSizeResult {
	const total = input.totalAreaHa ?? input.strata.reduce((s, x) => s + x.areaHa, 0);
	if (!(total > 0)) throw new Error('Total area must be greater than zero.');
	const weights = input.strata.map((s) => s.areaHa / total);
	const stdDevs = input.strata.map((s) => Math.sqrt(s.expectedProportion * (1 - s.expectedProportion)));
	const sumWS = weights.reduce((s, w, i) => s + w * stdDevs[i], 0);
	const targetSE = ((input.marginOfErrorPercent / 100) * weights[input.targetIndex]) / input.z;
	if (!(targetSE > 0)) throw new Error('Target standard error must be greater than zero.');
	return { weights, stdDevs, sumWS, targetSE, n: (sumWS / targetSE) ** 2 };
}

/** Excel ROUND (half away from zero) for non-negative values. */
export const roundHalfUp = (x: number) => Math.sign(x) * Math.round(Math.abs(x));

/** Same number of samples in every stratum with area > 0 (unrounded, as in the workbook). */
export function allocateEqual(n: number, areasHa: number[]): number[] {
	const total = roundHalfUp(n);
	const active = areasHa.filter((a) => a > 0).length;
	return areasHa.map((a) => (a > 0 ? total / active : 0));
}

/** Samples proportional to stratum weight (unrounded). */
export function allocateProportional(n: number, weights: number[]): number[] {
	const total = roundHalfUp(n);
	return weights.map((w) => total * w);
}

/**
 * "Minimum of m": each small stratum gets m samples, strata in `zero` get none, and the
 * remainder is shared among the `share` strata in proportion to area, on top of m each.
 * With 3 forest strata this matches the workbook's B13:F17.
 */
export function allocateMinimum(
	n: number,
	areasHa: number[],
	m: number,
	roles: ('share' | 'minimum' | 'zero')[],
): number[] {
	const total = roundHalfUp(n);
	const shareIdx = roles.flatMap((r, i) => (r === 'share' ? [i] : []));
	const minCount = roles.filter((r) => r === 'minimum').length;
	const shareArea = shareIdx.reduce((s, i) => s + areasHa[i], 0);
	const remainder = total - m * minCount - m * shareIdx.length;
	return roles.map((r, i) => {
		if (r === 'zero') return 0;
		if (r === 'minimum') return m;
		return shareArea > 0 ? (remainder * areasHa[i]) / shareArea + m : m;
	});
}

/** Hectares represented by each sample (0 where a stratum has no samples). */
export function samplingDensity(areasHa: number[], samples: number[]): number[] {
	return areasHa.map((a, i) => (samples[i] === 0 ? 0 : a / samples[i]));
}
