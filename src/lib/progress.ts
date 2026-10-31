/**
 * Lesson progress (task M6-01): which lesson pages the learner has marked complete, saved in
 * this browser through the safe storage helper. Keys are page paths without the site base,
 * e.g. "day-1/javascript-basics/".
 */
import { loadJSON, saveJSON } from './storage';

export const PROGRESS_KEY = 'hfld-progress';
export const PROGRESS_EVENT = 'hfld-progress-change';

/** Strip the base path and normalise to "a/b/". */
export function pageKey(pathname: string, base: string): string {
	const b = base.replace(/\/?$/, '/');
	let p = pathname.startsWith(b) ? pathname.slice(b.length) : pathname.replace(/^\//, '');
	p = p.replace(/index\.html$/, '');
	return p === '' || p.endsWith('/') ? p : `${p}/`;
}

/** Lesson pages that can be marked complete: Start here, the five days and the capstone. */
export function isLessonKey(key: string): boolean {
	return key === 'start-here/' || key === 'capstone/' || /^day-[1-5]\/[^/]+\/$/.test(key);
}

export function loadDone(): Set<string> {
	const raw = loadJSON<unknown>(PROGRESS_KEY);
	if (!Array.isArray(raw)) return new Set();
	return new Set(raw.filter((x): x is string => typeof x === 'string' && isLessonKey(x)));
}

/** Save and tell the rest of the page (the sidebar) that progress changed. */
export function setDone(key: string, done: boolean): Set<string> {
	const set = loadDone();
	if (done) set.add(key);
	else set.delete(key);
	saveJSON(PROGRESS_KEY, [...set].sort());
	if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
	return set;
}

export function countDone(keys: string[], done: Set<string>): { done: number; total: number } {
	return { done: keys.filter((k) => done.has(k)).length, total: keys.length };
}
