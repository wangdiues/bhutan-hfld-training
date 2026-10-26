import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf-8');

// Planned pages: ("M4-00", "start-here", ...) tuples in the scaffold script.
const planned = [...read('scripts/scaffold-pages.py').matchAll(/\("(M\d-\d+)", "([^"]+)"/g)].map(
	([, id, path]) => ({ id, path }),
);

// Every lesson in the learning design: rows like "| M4-11 | Sentinel-2 MRV composite | ...".
const designed = [...read('docs/learning-design.md').matchAll(/^\| (M4-\d+) \|/gm)].map(([, id]) => id);

describe('course structure', () => {
	it('has a planned page for every lesson in the learning design', () => {
		const plannedIds = new Set(planned.map((p) => p.id));
		expect(designed.filter((id) => !plannedIds.has(id))).toEqual([]);
	});

	it('has a page file for every planned page', () => {
		const missing = planned.filter((p) => !existsSync(join(root, 'src/content/docs', `${p.path}.mdx`)));
		expect(missing).toEqual([]);
	});
});
