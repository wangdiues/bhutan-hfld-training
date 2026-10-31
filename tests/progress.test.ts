import { describe, expect, it } from 'vitest';
import { countDone, isLessonKey, loadDone, pageKey } from '../src/lib/progress';

describe('lesson progress (M6-01)', () => {
	it('turns page paths into keys without the base', () => {
		expect(pageKey('/lulc-mapping-training/day-1/javascript-basics/', '/lulc-mapping-training')).toBe('day-1/javascript-basics/');
		expect(pageKey('/lulc-mapping-training/start-here/', '/lulc-mapping-training/')).toBe('start-here/');
		expect(pageKey('/lulc-mapping-training/day-2/recap', '/lulc-mapping-training')).toBe('day-2/recap/');
		expect(pageKey('/lulc-mapping-training/', '/lulc-mapping-training')).toBe('');
	});

	it('counts only lesson pages', () => {
		expect(isLessonKey('day-3/random-forest/')).toBe(true);
		expect(isLessonKey('capstone/')).toBe(true);
		expect(isLessonKey('labs/sample-size-calculator/')).toBe(false);
		expect(isLessonKey('day-6/x/')).toBe(false);
		expect(isLessonKey('')).toBe(false);
	});

	it('counts completed lessons and works without browser storage', () => {
		expect(countDone(['a/', 'b/', 'c/'], new Set(['b/', 'x/']))).toEqual({ done: 1, total: 3 });
		expect(loadDone().size).toBe(0);
	});
});
