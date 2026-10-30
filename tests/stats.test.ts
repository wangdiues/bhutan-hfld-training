import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accuracyArea } from '../src/lib/stats/accuracyArea';
import {
	allocateEqual,
	allocateMinimum,
	allocateProportional,
	sampleSize,
	samplingDensity,
} from '../src/lib/stats/sampleSize';
import { parseConfusionCsv, runAccuracyLab, workbookExample } from '../src/lib/stats/accuracyLab';
import { bhutanDefaults, isLabInput, runSampleSizeLab, type LabInput } from '../src/lib/stats/sampleSizeLab';

const fixture = (name: string) =>
	JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf-8'));

/** Relative tolerance 1e-6 (absolute for values near zero). */
function close(actual: number | null, expected: number | null) {
	if (expected === null) return expect(actual).toBeNull();
	expect(actual).not.toBeNull();
	const tol = Math.max(Math.abs(expected) * 1e-6, 1e-12);
	expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(tol);
}
const closeAll = (a: (number | null)[], e: (number | null)[]) => {
	expect(a).toHaveLength(e.length);
	a.forEach((x, i) => close(x, e[i]));
};

describe('Lab 1 — sample size matches the Day 5 workbook', () => {
	const { inputs, expected } = fixture('sample-size.workbook.json');
	const area = (name: string) => inputs.strataReport.find((r: { name: string }) => r.name === name).areaHa;
	const forest = area('Forest');
	const nonForest = ['null', 'Cropland', 'Grassland', 'Wetland', 'Settlement', 'Other Land'].reduce(
		(s, name) => s + area(name),
		0,
	);
	const areas = [
		...inputs.forestSplitPercent.map((pct: number) => (forest * pct) / 100),
		nonForest,
		area('Deforestation'),
	];
	const totalAreaHa = inputs.strataReport.reduce((s: number, r: { areaHa: number }) => s + r.areaHa, 0);
	const strata = expected.strata.map((name: string, i: number) => ({
		name,
		areaHa: areas[i],
		expectedProportion: inputs.expectedProportion[i],
	}));
	const run = (z: number) =>
		sampleSize({ strata, targetIndex: 4, marginOfErrorPercent: inputs.marginOfErrorPercent, z, totalAreaHa });
	const r = run(inputs.z90);

	it('builds strata and weights', () => {
		closeAll(areas, expected.areaHa);
		closeAll(r.weights, expected.weight);
		closeAll(r.stdDevs, expected.stdDev);
		close(r.sumWS, expected.sumWS);
	});
	it('computes the target SE and total sample size', () => {
		close(r.targetSE, expected.targetSE90);
		close(run(inputs.z95).targetSE, expected.targetSE95);
		close(r.n, expected.totalSamples);
	});
	it('allocates equally, proportionally and by minimum', () => {
		closeAll(allocateEqual(r.n, areas), expected.equal);
		closeAll(allocateProportional(r.n, r.weights), expected.proportional);
		for (const m of inputs.minimumPerStratum) {
			const got = allocateMinimum(r.n, areas, m, ['share', 'share', 'share', 'zero', 'minimum']);
			closeAll(got, expected.minimum[String(m)]);
		}
	});
	it('computes sampling density', () => {
		closeAll(samplingDensity(areas, allocateEqual(r.n, areas)), expected.densityEqual);
		closeAll(samplingDensity(areas, allocateProportional(r.n, r.weights)), expected.densityProportional);
	});
});

describe('Lab 2 — accuracy and area match the Day 5 workbook', () => {
	const { inputs, expected } = fixture('accuracy-area.workbook.json');
	const r = accuracyArea({ ...inputs, varianceRule: 'workbook' });

	it('computes sample-based accuracy and kappa', () => {
		closeAll(r.rowTotals, expected.rowTotals);
		closeAll(r.colTotals, expected.colTotals);
		closeAll(r.sampleBased.usersAccuracy, expected.usersAccuracy);
		closeAll(r.sampleBased.producersAccuracy, expected.producersAccuracy);
		close(r.sampleBased.overallAccuracy, expected.overallAccuracy);
		close(r.sampleBased.kappa, expected.kappa);
	});
	it('computes weights, proportions and adjusted areas', () => {
		closeAll(r.weights, expected.stratumWeight);
		close(r.totalAreaHa, expected.totalAreaHa);
		r.cellProportions.forEach((row, i) => closeAll(row, expected.cellProportions[i]));
		closeAll(r.referenceProportion, expected.referenceProportion);
		closeAll(r.adjustedAreaHa, expected.adjustedAreaHa);
	});
	it('computes standard errors and 90% uncertainty', () => {
		closeAll(r.seProportion, expected.seProportion);
		closeAll(r.seAreaHa, expected.seAreaHa);
		closeAll(r.uncertaintyPercent, expected.uncertaintyPercent90);
	});
	it('flags the empty Non-Forest stratum', () => {
		expect(r.emptyStrata).toEqual([1]);
		expect(r.areaWeighted.overallAccuracy).toBeNull();
	});
});

describe('Olofsson variance rule vs the workbook rule', () => {
	it('keeps cells with exactly one sample (the workbook drops them)', () => {
		const input = { mappedAreaHa: [900, 100], matrix: [[98, 1], [3, 47]], z: 1.6449 };
		const olofsson = accuracyArea(input);
		const workbook = accuracyArea({ ...input, varianceRule: 'workbook' });
		expect(olofsson.seProportion[1]).toBeGreaterThan(workbook.seProportion[1]);
		expect(olofsson.adjustedAreaHa).toEqual(workbook.adjustedAreaHa);
	});
	it('reproduces the D5 slide example of adjusting a deforestation estimate', () => {
		// 17,000 ha mapped as deforestation; 18 of 23 samples confirmed → 13,304 ha.
		const r = accuracyArea({ mappedAreaHa: [83000, 17000], matrix: [[100, 0], [5, 18]], z: 1.6449 });
		close(r.cellProportions[1][1] * r.totalAreaHa, 17000 * (18 / 23));
	});
});

describe('Lab 1 page — the preloaded Bhutan inputs reproduce the workbook', () => {
	const { inputs, expected } = fixture('sample-size.workbook.json');
	const run = (patch: Partial<LabInput> = {}) => {
		const out = runSampleSizeLab({ ...bhutanDefaults(), ...patch });
		if (!out.ok) throw new Error(out.error);
		return out.result;
	};
	it('matches every workbook output', () => {
		const r = run();
		close(r.totalAreaHa, expected.totalAreaHa);
		closeAll(r.weights, expected.weight);
		closeAll(r.weightTimesStdDev, expected.weightTimesStdDev);
		close(r.targetSE, expected.targetSE90);
		close(r.n, expected.totalSamples);
		closeAll(r.equal.samples, expected.equal);
		closeAll(r.proportional.samples, expected.proportional);
		closeAll(r.equal.density as number[], expected.densityEqual);
		closeAll(r.proportional.density as number[], expected.densityProportional);
		for (const m of inputs.minimumPerStratum) closeAll(run({ minimum: m }).minimum!.samples, expected.minimum[String(m)]);
		close(run({ z: inputs.z95 }).targetSE, expected.targetSE95);
	});
	it('reports bad inputs instead of NaN or Infinity', () => {
		const zeroAreas = bhutanDefaults();
		zeroAreas.strata.forEach((s) => (s.areaHa = 0));
		expect(runSampleSizeLab(zeroAreas)).toMatchObject({ ok: false });
		expect(runSampleSizeLab({ ...bhutanDefaults(), marginOfErrorPercent: 0 })).toMatchObject({ ok: false });
		const r = run();
		expect(r.minimum!.density[3]).toBeNull();
		const flat = [r.n, ...r.weights, ...r.equal.samples, ...r.proportional.samples, ...r.minimum.samples];
		expect(flat.every(Number.isFinite)).toBe(true);
	});
	it('refuses a minimum allocation that would need negative samples', () => {
		const r = run({ minimum: 2000 });
		expect(r.minimum).toBeNull();
		expect(r.warnings.some((w) => w.includes('cannot be made'))).toBe(true);
		expect([...r.equal.samples, ...r.proportional.samples].every((x) => x >= 0)).toBe(true);
	});
	it('rejects corrupted saved state', () => {
		expect(isLabInput(bhutanDefaults())).toBe(true);
		expect(isLabInput({ strata: [{ areaHa: 1 }] })).toBe(false);
		expect(isLabInput(null)).toBe(false);
	});
});

describe('Lab 2 page — accuracy lab module', () => {
	const { expected } = fixture('accuracy-area.workbook.json');
	it('reproduces the workbook with the workbook example', () => {
		const out = runAccuracyLab(workbookExample());
		if (!out.ok) throw new Error(out.error);
		const v = out.value;
		closeAll(v.rows.map((r) => r.usersAccuracy), expected.usersAccuracy);
		closeAll(v.rows.map((r) => r.producersAccuracySample), expected.producersAccuracy);
		closeAll(v.rows.map((r) => r.adjustedAreaHa), expected.adjustedAreaHa);
		closeAll(v.rows.map((r) => r.seAreaHa), expected.seAreaHa);
		closeAll(v.rows.map((r) => r.uncertaintyPercent), expected.uncertaintyPercent90);
		close(v.overallSample, expected.overallAccuracy);
		close(v.kappa, expected.kappa);
		expect(v.adjustedTotalHa).toBeNull();
		expect(v.warnings[0]).toMatch(/Non-Forest has no samples/);
	});
	it('applies a pass/fail threshold and never returns NaN or Infinity', () => {
		const out = runAccuracyLab({ ...workbookExample(), thresholdPercent: 30 });
		if (!out.ok) throw new Error(out.error);
		expect(out.value.rows.map((r) => r.pass)).toEqual([true, true, false]);
		const nums = out.value.rows.flatMap((r) => [r.adjustedAreaHa, r.seAreaHa, r.ciLowHa, r.ciHighHa]);
		expect(nums.every(Number.isFinite)).toBe(true);
	});
	it('rejects bad input with a message', () => {
		expect(runAccuracyLab({ ...workbookExample(), matrix: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] })).toMatchObject({ ok: false });
		expect(runAccuracyLab({ ...workbookExample(), mappedAreaHa: [0, 0, 0] })).toMatchObject({ ok: false });
		expect(runAccuracyLab({ ...workbookExample(), matrix: [[1.5, 0, 0], [0, 1, 0], [0, 0, 1]] })).toMatchObject({ ok: false });
		expect(runAccuracyLab({ ...workbookExample(), classes: ['A', 'A', 'B'] })).toMatchObject({ ok: false });
	});
	it('parses a matrix CSV with an area column', () => {
		const out = parseConfusionCsv('map \ ref,Forest,Non-Forest,area_ha\nForest,90,10,"1,000"\nNon-Forest,5,95,500\n');
		expect(out).toEqual({ ok: true, value: { classes: ['Forest', 'Non-Forest'], matrix: [[90, 10], [5, 95]], mappedAreaHa: [1000, 500], format: 'matrix' } });
	});
	it('tallies one-row-per-sample CSV (e.g. a Collect Earth Online export)', () => {
		const out = parseConfusionCsv('plotid,map,reference\n1,Forest,Forest\n2,Forest,Non-Forest\n3,Non-Forest,Non-Forest\n4,Forest,Forest\n');
		expect(out).toEqual({ ok: true, value: { classes: ['Forest', 'Non-Forest'], matrix: [[2, 1], [0, 1]], format: 'samples' } });
	});
	it('explains CSV it cannot read', () => {
		const bad = parseConfusionCsv('a,b\n1,2\n');
		expect(bad.ok).toBe(false);
		const order = parseConfusionCsv(',A,B\nB,1,2\nA,3,4\n');
		expect(order).toMatchObject({ ok: false });
		if (!order.ok) expect(order.error).toMatch(/same order/);
	});
	it('handles review edge cases: overflow, reference-only classes, blank CSV cells', () => {
		expect(runAccuracyLab({ ...workbookExample(), mappedAreaHa: [1e308, 1e308, 1] })).toMatchObject({ ok: false });
		const refOnly = runAccuracyLab({
			classes: ['Forest', 'Non-Forest', 'Cloud'],
			mappedAreaHa: [600, 400, 0],
			matrix: [[50, 2, 1], [3, 40, 0], [0, 0, 0]],
			z: 1.6449,
			varianceRule: 'olofsson',
			thresholdPercent: null,
		});
		if (!refOnly.ok) throw new Error(refOnly.error);
		expect(refOnly.value.raw.emptyStrata).toEqual([]);
		expect(refOnly.value.adjustedTotalHa).toBeCloseTo(1000, 9);
		expect(refOnly.value.overallArea).not.toBeNull();
		expect(parseConfusionCsv(',A,B\nA,1,\nB,2,3\n')).toMatchObject({ ok: false });
		expect(parseConfusionCsv(',A,B,area_ha\nA,1,0,\nB,2,3,5\n')).toMatchObject({ ok: false });
	});
});
