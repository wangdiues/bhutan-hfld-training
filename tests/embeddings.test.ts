import { describe, expect, it } from 'vitest';
import {
	cosine,
	cosine2d,
	DIM,
	dot,
	flagged,
	makeChangePairs,
	makePlaces,
	norm,
	normalize,
	rankBySimilarity,
	withSimilarity,
} from '../src/lib/stats/embeddings';
import { rng } from '../src/lib/stats/trees';

describe('embedding similarity (Lab 6)', () => {
	it('computes dot products, norms and cosine similarity', () => {
		expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
		expect(norm([3, 4])).toBe(5);
		expect(cosine([1, 0], [0, 2])).toBe(0);
		expect(cosine([1, 1], [2, 2])).toBeCloseTo(1, 12);
		expect(cosine([1, 0], [-3, 0])).toBeCloseTo(-1, 12);
		expect(cosine2d(30, 90)).toBeCloseTo(0.5, 12);
	});

	it('returns null for the zero vector instead of NaN', () => {
		expect(normalize([0, 0])).toBeNull();
		expect(cosine([0, 0], [1, 0])).toBeNull();
	});

	it('builds unit vectors with exactly the similarity asked for', () => {
		const r = rng(1);
		const u = normalize(Array.from({ length: DIM }, () => r() - 0.5))!;
		for (const c of [0.955, 0.6, 0, -0.4]) {
			const v = withSimilarity(u, c, r);
			expect(norm(v)).toBeCloseTo(1, 12);
			expect(dot(u, v)).toBeCloseTo(c, 12);
		}
	});

	it('gives every place a unit vector, and same-cover places the highest similarity', () => {
		const places = makePlaces();
		for (const p of places) {
			expect(p.v).toHaveLength(DIM);
			expect(norm(p.v)).toBeCloseTo(1, 12);
		}
		expect(rankBySimilarity(places, 'bumthang')[0].place.id).toBe('haa-forest');
		expect(rankBySimilarity(places, 'punakha')[0].place.id).toBe('paro');
		expect(makePlaces()[0].v).toEqual(places[0].v);
	});

	it('flags forest pixels below 0.955, as in the Day 5 sample-size script', () => {
		const pairs = makeChangePairs();
		const ids = pairs.filter((p) => flagged(p, 0.955)).map((p) => p.id);
		expect(ids).toEqual(['cloudy', 'road', 'hydro', 'clearing', 'landslide']);
		// A lower threshold removes the false alarm but misses the small clearing.
		expect(pairs.filter((p) => flagged(p, 0.9)).map((p) => p.id)).toEqual(['road', 'hydro', 'landslide']);
		// Selective logging (degradation) is flagged only above 0.963.
		expect(pairs.filter((p) => flagged(p, 0.965)).map((p) => p.id)).toContain('logging');
		for (const p of pairs) expect(cosine(p.before, p.after)!).toBeCloseTo(p.similarity, 12);
	});
});
