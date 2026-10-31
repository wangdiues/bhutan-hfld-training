import { describe, expect, it } from 'vitest';
import { computeAll, eeSnippet, INDICES, isReflectance, PRESETS, type Reflectance } from '../src/lib/stats/indices';

const veg = PRESETS.find((p) => p.id === 'vegetation')!.r;
const value = (r: Reflectance, id: string) => computeAll(r).find((x) => x.id === id)!.value;

describe('spectral indices (Lab 3)', () => {
	it('matches hand-computed values for the Day 2 vegetation curve', () => {
		expect(value(veg, 'ndvi')).toBeCloseTo((0.45 - 0.04) / (0.45 + 0.04), 12);
		expect(value(veg, 'evi')).toBeCloseTo((2.5 * 0.41) / (0.45 + 0.24 - 0.375 + 1), 12);
		expect(value(veg, 'savi')).toBeCloseTo((1.5 * 0.41) / 0.99, 12);
		expect(value(veg, 'ndmi')).toBeCloseTo(0.21 / 0.69, 12);
		expect(value(veg, 'nbr')).toBeCloseTo(0.33 / 0.57, 12);
		expect(value(veg, 'ndwi')).toBeCloseTo(-0.35 / 0.55, 12);
	});

	it('keeps every preset value on the slider grid (0.1%) and every index within the display limit', () => {
		for (const p of PRESETS) {
			for (const v of Object.values(p.r)) expect(Math.abs(v * 1000 - Math.round(v * 1000))).toBeLessThan(1e-9);
			for (const { value: x } of computeAll(p.r)) expect(x === null || Math.abs(x) <= 1.5).toBe(true);
		}
	});

	it('shows a near-zero denominator as undefined rather than a huge number', () => {
		// EVI denominator NIR + 6 Red - 7.5 Blue + 1 is 0.001 here
		expect(value({ blue: 0.2, green: 0.1, red: 0.05, nir: 0.201, swir1: 0.1, swir2: 0.1 }, 'evi')).toBeNull();
	});

	it('orders the presets as expected', () => {
		const p = (id: string) => PRESETS.find((x) => x.id === id)!.r;
		expect(value(p('forest'), 'ndvi')!).toBeGreaterThan(0.6);
		expect(value(p('water'), 'ndvi')!).toBeLessThan(0);
		expect(value(p('water'), 'ndwi')!).toBeGreaterThan(0);
		expect(value(p('built'), 'ndbi')!).toBeGreaterThan(0);
		expect(value(p('burned'), 'nbr')!).toBeLessThan(value(p('forest'), 'nbr')!);
	});

	it('returns null, never NaN or Infinity, when a denominator is zero', () => {
		const zero: Reflectance = { blue: 0, green: 0, red: 0, nir: 0, swir1: 0, swir2: 0 };
		for (const { value: v } of computeAll(zero)) {
			expect(v === null || Number.isFinite(v)).toBe(true);
		}
		expect(value(zero, 'ndvi')).toBeNull();
		// EVI denominator NIR + 6 Red - 7.5 Blue + 1 = 0
		expect(value({ ...zero, blue: 0.2, red: 0.05, nir: 0.2 }, 'evi')).toBeNull();
		for (const p of PRESETS) for (const { value: v } of computeAll(p.r)) expect(v === null || Number.isFinite(v)).toBe(true);
	});

	it('writes Earth Engine code with the right band for each sensor', () => {
		const ndvi = INDICES.find((d) => d.id === 'ndvi')!;
		expect(eeSnippet(ndvi, 's2')).toContain("normalizedDifference(['B8', 'B4'])");
		expect(eeSnippet(ndvi, 's2')).toContain('divide(10000)');
		expect(eeSnippet(ndvi, 'landsat')).toContain("normalizedDifference(['SR_B5', 'SR_B4'])");
		expect(eeSnippet(ndvi, 'landsat')).toContain('multiply(0.0000275).add(-0.2)');
		const evi = INDICES.find((d) => d.id === 'evi')!;
		expect(eeSnippet(evi, 'landsat')).toContain("BLUE: image.select('SR_B2')");
		expect(eeSnippet(evi, 's2')).toContain("BLUE: image.select('B2')");
	});

	it('validates saved reflectance', () => {
		expect(isReflectance(veg)).toBe(true);
		expect(isReflectance({ ...veg, nir: 2 })).toBe(false);
		expect(isReflectance({ ...veg, red: 'x' })).toBe(false);
		expect(isReflectance(null)).toBe(false);
	});
});
