import { describe, expect, it } from 'vitest';
import { countDone, isLessonKey, loadDone, pageKey } from '../src/lib/progress';

describe('lesson progress (M6-01)', () => {
	it('turns page paths into keys without the base', () => {
		expect(pageKey('/bhutan-hfld-training/day-1/javascript-basics/', '/bhutan-hfld-training')).toBe('day-1/javascript-basics/');
		expect(pageKey('/bhutan-hfld-training/start-here/', '/bhutan-hfld-training/')).toBe('start-here/');
		expect(pageKey('/bhutan-hfld-training/day-2/recap', '/bhutan-hfld-training')).toBe('day-2/recap/');
		expect(pageKey('/bhutan-hfld-training/', '/bhutan-hfld-training')).toBe('');
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
