import { describe, expect, it } from 'vitest';
import { certificatePdf, dayStatus, isPrintableLatin1, isScore, PASS_MARK, REQUIREMENTS, textWidth } from '../src/lib/certificate';

const all = (right: number, total = 10) =>
	Object.fromEntries(REQUIREMENTS.flatMap((r) => r.quizzes).map((q) => [q, { right, total }]));

describe('completion certificate (M6-02)', () => {
	it('passes a day only when every quiz for it reaches the pass mark', () => {
		expect(PASS_MARK).toBe(0.7);
		expect(dayStatus(all(7)).every((d) => d.passed)).toBe(true);
		expect(dayStatus(all(6)).some((d) => d.passed)).toBe(false);
		const scores = all(10);
		delete scores['day-1-recap'];
		const s = dayStatus(scores);
		expect(s[0]).toMatchObject({ day: 1, passed: false, missing: ['day-1-recap'] });
		expect(s.slice(1).every((d) => d.passed)).toBe(true);
	});

	it('validates saved quiz scores', () => {
		expect(isScore({ right: 7, total: 10, at: 1 })).toBe(true);
		expect(isScore({ right: 11, total: 10 })).toBe(false);
		expect(isScore({ right: 1, total: 0 })).toBe(false);
		expect(isScore('x')).toBe(false);
	});

	it('accepts Latin-1 names only', () => {
		expect(isPrintableLatin1('Karma Dorji')).toBe(true);
		expect(isPrintableLatin1('José Müller')).toBe(true);
		expect(isPrintableLatin1('ཀརྨ')).toBe(false);
	});

	it('measures text with Helvetica widths', () => {
		expect(textWidth('A', 1000)).toBe(667);
		expect(textWidth('ii', 10)).toBeCloseTo(4.44, 6);
	});

	it('writes a well-formed one-page PDF with a correct cross-reference table', () => {
		const pdf = certificatePdf({ name: 'Karma (Test) Dorji', date: '31 October 2026', days: REQUIREMENTS, url: 'https://example.org/' });
		const text = String.fromCharCode(...pdf);
		expect(text.startsWith('%PDF-1.4')).toBe(true);
		expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
		expect(text).toContain('(Karma \\(Test\\) Dorji)');
		const startxref = Number(text.match(/startxref\n(\d+)/)![1]);
		expect(text.slice(startxref, startxref + 4)).toBe('xref');
		// Every xref offset points at "n 0 obj".
		const offsets = [...text.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
		offsets.forEach((o, i) => expect(text.slice(o, o + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
		// The stream length matches its content.
		const m = text.match(/<< \/Length (\d+) >>\nstream\n/)!;
		const start = m.index! + m[0].length;
		expect(text.slice(start + Number(m[1]), start + Number(m[1]) + 10)).toBe('\nendstream');
	});
});
