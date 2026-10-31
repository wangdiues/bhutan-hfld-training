import { describe, expect, it } from 'vitest';
import {
	bestSplit,
	entropy,
	growForest,
	growTree,
	predict,
	splitStats,
	vote,
	WESTERN_BHUTAN,
	WORKED_EXAMPLE,
} from '../src/lib/stats/trees';

describe('decision trees (Lab 4)', () => {
	it('reproduces the worked example in the Random Forest lesson', () => {
		expect(entropy(WORKED_EXAMPLE)).toBeCloseTo(1.485, 3);
		const ndvi = splitStats(WORKED_EXAMPLE, 'ndvi', '>', 0.5);
		expect([ndvi.yes.length, ndvi.no.length]).toEqual([6, 4]);
		expect(ndvi.yesEntropy).toBeCloseTo(0.65, 3);
		expect(ndvi.noEntropy).toBeCloseTo(1, 6);
		expect(ndvi.gain).toBeCloseTo(0.695, 3);
		const nir = splitStats(WORKED_EXAMPLE, 'nir', '<', 0.1);
		expect([nir.yes.length, nir.no.length]).toEqual([2, 8]);
		expect(nir.noEntropy).toBeCloseTo(0.954, 3);
		expect(nir.gain).toBeCloseTo(0.722, 3);
	});

	it('finds a split at least as good as the lesson’s best', () => {
		const best = bestSplit(WORKED_EXAMPLE)!;
		expect(best.gain).toBeGreaterThanOrEqual(0.722 - 1e-3);
	});

	it('handles empty and pure sets without NaN', () => {
		expect(entropy([])).toBe(0);
		const s = splitStats([], 'ndvi', '>', 0.5);
		expect(s.after).toBe(0);
		expect(Number.isFinite(s.gain)).toBe(true);
		expect(bestSplit([WORKED_EXAMPLE[0]])).toBeNull();
	});

	it('grows a tree that fits its training data', () => {
		const tree = growTree(WORKED_EXAMPLE, 5);
		for (const s of WORKED_EXAMPLE) expect(predict(tree, s)).toBe(s.label);
	});

	it('grows the same forest for the same seed, and its vote counts every tree', () => {
		const a = growForest(WESTERN_BHUTAN, 25, 3, 7);
		const b = growForest(WESTERN_BHUTAN, 25, 3, 7);
		const x = { ndvi: 0.75, nir: 0.3, elevation: 2500 };
		expect(vote(a, x)).toEqual(vote(b, x));
		expect(vote(a, x).reduce((t, v) => t + v.votes, 0)).toBe(25);
		expect(vote(a, x)[0].label).toBe('Forest');
		expect(vote(a, { ndvi: -0.3, nir: 0.02, elevation: 1500 })[0].label).toBe('Water');
	});
});
