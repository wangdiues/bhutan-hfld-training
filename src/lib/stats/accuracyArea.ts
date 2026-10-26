/**
 * Accuracy assessment and area estimation from a stratified sample (Olofsson et al. 2014).
 * Matrix rows are map classes (strata); columns are reference classes.
 * Reproduces "Exercise D5-Confusion Matrix, Accuracy Assessment, Area Adjustment.xlsx"
 * where it follows Olofsson; see docs/calculator-spec.md for the differences.
 */

export interface AccuracyInput {
	/** Mapped area of each stratum (ha), same order as the matrix rows. */
	mappedAreaHa: number[];
	/** counts[i][j] = samples mapped as class i with reference class j. */
	matrix: number[][];
	/** z for the confidence interval: 1.6449 for 90% (ART-TREES), 1.96 for 95%. */
	z: number;
	/**
	 * Variance rule. 'olofsson' (default) skips only strata with fewer than 2 samples.
	 * 'workbook' reproduces the Day 5 spreadsheet, which also drops cells with nᵢⱼ < 2.
	 */
	varianceRule?: 'olofsson' | 'workbook';
}

/** null marks a value that cannot be computed (division by zero), shown as "—" in the UI. */
export type Maybe = number | null;

export interface AccuracyResult {
	n: number;
	rowTotals: number[];
	colTotals: number[];
	weights: number[];
	totalAreaHa: number;
	/** Strata with no samples: estimates for the whole map are incomplete if this is non-empty. */
	emptyStrata: number[];
	sampleBased: { usersAccuracy: Maybe[]; producersAccuracy: Maybe[]; overallAccuracy: Maybe; kappa: Maybe };
	/** Estimated area proportions p̂ᵢⱼ = Wᵢ nᵢⱼ / nᵢ. */
	cellProportions: number[][];
	areaWeighted: { producersAccuracy: Maybe[]; overallAccuracy: Maybe };
	referenceProportion: number[];
	adjustedAreaHa: number[];
	seProportion: number[];
	seAreaHa: number[];
	/** Half-width of the confidence interval (ha). */
	ciHalfWidthHa: number[];
	/** CI half-width as % of the adjusted area (null if the adjusted area is 0). */
	uncertaintyPercent: Maybe[];
}

const div = (a: number, b: number): Maybe => (b === 0 ? null : a / b);
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

export function accuracyArea(input: AccuracyInput): AccuracyResult {
	const { matrix, mappedAreaHa, z } = input;
	const k = matrix.length;
	if (mappedAreaHa.length !== k || matrix.some((r) => r.length !== k)) {
		throw new Error('The matrix must be square and match the number of mapped areas.');
	}
	if (matrix.flat().some((x) => !(x >= 0) || !Number.isFinite(x))) {
		throw new Error('Sample counts must be non-negative numbers.');
	}
	const totalAreaHa = sum(mappedAreaHa);
	if (!(totalAreaHa > 0)) throw new Error('Total mapped area must be greater than zero.');

	const rowTotals = matrix.map(sum);
	const colTotals = matrix[0].map((_, j) => sum(matrix.map((r) => r[j])));
	const n = sum(rowTotals);
	const weights = mappedAreaHa.map((a) => a / totalAreaHa);
	const diag = matrix.map((r, i) => r[i]);

	// Sample-count statistics (as in the workbook).
	const pe = n === 0 ? null : sum(rowTotals.map((r, i) => (r / n) * (colTotals[i] / n)));
	const oa = div(sum(diag), n);
	const sampleBased = {
		usersAccuracy: diag.map((d, i) => div(d, rowTotals[i])),
		producersAccuracy: diag.map((d, j) => div(d, colTotals[j])),
		overallAccuracy: oa,
		kappa: oa === null || pe === null ? null : div(oa - pe, 1 - pe),
	};

	// Area-weighted estimates (Olofsson et al. 2014).
	const cellProportions = matrix.map((r, i) =>
		r.map((x) => (rowTotals[i] === 0 ? 0 : (weights[i] * x) / rowTotals[i])),
	);
	const referenceProportion = matrix[0].map((_, j) => sum(cellProportions.map((r) => r[j])));
	const pDiag = cellProportions.map((r, i) => r[i]);
	const areaWeighted = {
		producersAccuracy: pDiag.map((p, j) => div(p, referenceProportion[j])),
		overallAccuracy: rowTotals.some((r) => r === 0) ? null : sum(pDiag),
	};
	const adjustedAreaHa = referenceProportion.map((p) => p * totalAreaHa);

	const rule = input.varianceRule ?? 'olofsson';
	const seProportion = matrix[0].map((_, j) =>
		Math.sqrt(
			sum(
				matrix.map((r, i) => {
					const ni = rowTotals[i];
					if (ni < 2 || (rule === 'workbook' && r[j] < 2)) return 0;
					const p = r[j] / ni;
					return (weights[i] ** 2 * p * (1 - p)) / (ni - 1);
				}),
			),
		),
	);
	const seAreaHa = seProportion.map((s) => s * totalAreaHa);
	const ciHalfWidthHa = seAreaHa.map((s) => z * s);

	return {
		n,
		rowTotals,
		colTotals,
		weights,
		totalAreaHa,
		emptyStrata: rowTotals.flatMap((r, i) => (r === 0 ? [i] : [])),
		sampleBased,
		cellProportions,
		areaWeighted,
		referenceProportion,
		adjustedAreaHa,
		seProportion,
		seAreaHa,
		ciHalfWidthHa,
		uncertaintyPercent: adjustedAreaHa.map((a, j) => (a === 0 ? null : (100 * ciHalfWidthHa[j]) / a)),
	};
}
