import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assign, DEFAULT_CLASSES, eeCode, EXAMPLE_PIXELS, isRules, mostProbable, treeText } from '../src/lib/stats/assemblage';

describe('assemblage rules (Lab 5)', () => {
	it('writes the same text as buildDecisionTree() in assemblage.js, run with the default thresholds', () => {
		// Take buildDecisionTree() and the defaults out of the script and run them with stub sliders.
		const js = readFileSync(join(__dirname, '../scripts/gee/day-4/assemblage.js'), 'utf8');
		const fn = js.match(/function buildDecisionTree\(\)\{[\s\S]*?\n\}/)![0];
		const primitives = eval(js.match(/var primitives = (\[[^\]]*\]);/)![1]) as string[];
		const thresholds = eval(js.match(/var defaultThresholds = (\[[\s\S]*?\]);/)![1]) as number[];
		const sliders = Object.fromEntries(primitives.map((p, i) => [p, { getValue: () => thresholds[i] }]));
		const build = new Function('primitives', 'sliders', `${fn}; return buildDecisionTree();`);
		expect(treeText(DEFAULT_CLASSES)).toBe(build(primitives, sliders));
		expect(DEFAULT_CLASSES.map((c) => c.band)).toEqual(primitives);
		expect(DEFAULT_CLASSES.map((c) => c.threshold)).toEqual(thresholds);
	});

	it('writes the expected decision tree text with the default thresholds', () => {
		expect(treeText(DEFAULT_CLASSES)).toBe(
			[
				'1) root 9999 9999 9999',
				'2) forest>=0.5 9999 9999 1 *',
				'3) forest<0.5 9999 9999 9999',
				'6) crop>=0.55 9999 9999 2 *',
				'7) crop<0.55 9999 9999 9999',
				'14) grass>=0.55 9999 9999 3 *',
				'15) grass<0.55 9999 9999 9999',
				'30) other>=0.6 9999 9999 4 *',
				'31) other<0.6 9999 9999 9999',
				'62) bu>=0.3 9999 9999 5 *',
				'63) bu<0.3 9999 9999 9999',
				'126) wet>=0.25 9999 9999 6 *',
				'127) wet<0.25 9999 9999 0 *',
			].join('\n'),
		);
	});

	it('gives the first rule passed, as in the assemblage lesson', () => {
		const edge = EXAMPLE_PIXELS.find((x) => x.name.startsWith('Agroforestry'))!.p;
		expect(assign(DEFAULT_CLASSES, edge)).toEqual({ value: 1, name: 'Forest', rule: 0 });
		expect(mostProbable(DEFAULT_CLASSES, edge)).toBe('Cropland');
		const cropFirst = [DEFAULT_CLASSES[1], DEFAULT_CLASSES[0], ...DEFAULT_CLASSES.slice(2)];
		expect(assign(cropFirst, edge)).toEqual({ value: 1, name: 'Cropland', rule: 0 });
	});

	it('leaves a pixel unclassified (0) when no rule passes, and treats the threshold as inclusive', () => {
		const unsure = EXAMPLE_PIXELS.find((x) => x.name.startsWith('Shaded'))!.p;
		expect(assign(DEFAULT_CLASSES, unsure).value).toBe(0);
		expect(assign(DEFAULT_CLASSES, { forest: 0.5 }).name).toBe('Forest');
	});

	it('numbers classes in the new order in the generated code', () => {
		const code = eeCode([DEFAULT_CLASSES[5], ...DEFAULT_CLASSES.slice(0, 5)]);
		expect(code).toContain("var myPrimitives = ['wet', 'forest', 'crop', 'grass', 'other', 'bu'];");
		expect(code).not.toMatch(/var (primitives|tree|landClass) /);
		expect(code).toContain("'2) wet>=0.25 9999 9999 1 *'");
		expect(code).toContain('1 = Wetland, 2 = Forest');
		expect(code).toContain("palette: ['004DA8', '267300'");
	});

	it('validates saved rules', () => {
		expect(isRules(DEFAULT_CLASSES)).toBe(true);
		expect(isRules(DEFAULT_CLASSES.slice(1))).toBe(false);
		expect(isRules([...DEFAULT_CLASSES.slice(0, 5), DEFAULT_CLASSES[0]])).toBe(false);
		expect(isRules(DEFAULT_CLASSES.map((c) => ({ ...c, threshold: 1.5 })))).toBe(false);
		expect(isRules('x')).toBe(false);
	});
});
