/**
 * Completion certificate (task M6-02): which day quizzes the learner has passed, and a one-page
 * PDF written in the browser without a library (standard PDF fonts, Latin-1 text).
 */
export const PASS_MARK = 0.7;

export interface DayRequirement {
	day: number;
	title: string;
	/** Quiz ids (the `id` of <Quiz>) that must all be passed. */
	quizzes: string[];
}

/** Each day's recap quiz. */
export const REQUIREMENTS: DayRequirement[] = [
	{ day: 1, title: 'Earth Engine foundations', quizzes: ['day-1-recap'] },
	{ day: 2, title: 'Composites', quizzes: ['day-2-recap'] },
	{ day: 3, title: 'Classification', quizzes: ['day-3-recap'] },
	{ day: 4, title: 'Land cover and embeddings', quizzes: ['day-4-recap'] },
	{ day: 5, title: 'Accuracy and area', quizzes: ['day-5-recap'] },
];

export interface QuizScore {
	right: number;
	total: number;
}

export function isScore(x: unknown): x is QuizScore {
	if (typeof x !== 'object' || x === null) return false;
	const { right, total } = x as Record<string, unknown>;
	return Number.isInteger(right) && Number.isInteger(total) && (total as number) > 0 && (right as number) >= 0 && (right as number) <= (total as number);
}

export interface DayStatus {
	day: number;
	title: string;
	passed: boolean;
	/** Quizzes still to pass (not taken, or below the pass mark). */
	missing: string[];
}

export function dayStatus(scores: Record<string, QuizScore | undefined>): DayStatus[] {
	return REQUIREMENTS.map((r) => {
		const missing = r.quizzes.filter((q) => {
			const s = scores[q];
			return !s || s.right / s.total < PASS_MARK;
		});
		return { day: r.day, title: r.title, passed: missing.length === 0, missing };
	});
}

/** Characters the standard PDF fonts can show (Latin-1, printable). */
export function isPrintableLatin1(s: string): boolean {
	return [...s].every((c) => {
		const n = c.codePointAt(0)!;
		return (n >= 0x20 && n <= 0x7e) || (n >= 0xa0 && n <= 0xff);
	});
}

// Helvetica advance widths (1/1000 em) for ASCII 32–126, from the standard AFM metrics.
const HELV = [
	278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556,
	556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667,
	778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556,
	222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

/** Approximate text width in points (bold is about 5% wider). */
export function textWidth(s: string, size: number, bold = false): number {
	let w = 0;
	for (const c of s) {
		const n = c.codePointAt(0)!;
		w += n >= 32 && n <= 126 ? HELV[n - 32] : 556;
	}
	return (w / 1000) * size * (bold ? 1.05 : 1);
}

function pdfString(s: string): string {
	let out = '';
	for (const c of s) {
		const n = c.codePointAt(0)!;
		if (c === '(' || c === ')' || c === '\\') out += `\\${c}`;
		else if (n > 0x7e) out += `\\${n.toString(8).padStart(3, '0')}`;
		else out += c;
	}
	return `(${out})`;
}

export interface CertificateInput {
	name: string;
	date: string;
	days: { day: number; title: string }[];
	url: string;
}

/** A one-page A4 landscape PDF. */
export function certificatePdf(input: CertificateInput): Uint8Array {
	const W = 842;
	const H = 595;
	const ops: string[] = [];
	const line = (text: string, y: number, size: number, font: 'F1' | 'F2' | 'F3', grey = 0.15) => {
		const x = (W - textWidth(text, size, font === 'F2')) / 2;
		ops.push(`BT /${font} ${size} Tf ${grey} g ${x.toFixed(1)} ${y} Td ${pdfString(text)} Tj ET`);
	};
	// Double border in the course green.
	ops.push('0.18 0.44 0.31 RG 3 w 28 28 786 539 re S 1 w 38 38 766 519 re S');
	line('Certificate of completion', 470, 34, 'F2', 0.12);
	line('This certifies that', 420, 14, 'F3', 0.35);
	line(input.name, 375, 28, 'F2', 0.08);
	line('completed the self-paced online course', 335, 14, 'F3', 0.35);
	line('Map Bhutan\'s forests for ART-TREES: Bhutan HFLD Training', 305, 16, 'F2', 0.15);
	line('and passed the quizzes for:', 270, 12, 'F1', 0.35);
	input.days.forEach((d, i) => line(`Day ${d.day}: ${d.title}`, 245 - i * 18, 12, 'F1', 0.2));
	line(`Date: ${input.date}`, 120, 12, 'F1', 0.2);
	line(input.url, 100, 10, 'F1', 0.35);
	line(
		'A record of self-paced study, issued by the course website. It is not an accreditation or a formal qualification.',
		70,
		9,
		'F3',
		0.4,
	);
	line(
		'Course adapted, with permission, from the Bhutan ART-TREES HFLD Readiness Training (May 2026). Content CC BY 4.0.',
		56,
		9,
		'F3',
		0.4,
	);
	const content = ops.join('\n');
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>',
		`<< /Length ${latin1Length(content)} >>\nstream\n${content}\nendstream`,
		`<< /Title ${pdfString('Certificate of completion')} /Producer ${pdfString('Bhutan HFLD Training website')} >>`,
	];
	let pdf = '%PDF-1.4\n';
	const offsets: number[] = [];
	objects.forEach((o, i) => {
		offsets.push(latin1Length(pdf));
		pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
	});
	const xref = latin1Length(pdf);
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return Uint8Array.from([...pdf].map((c) => c.codePointAt(0)! & 0xff));
}

function latin1Length(s: string): number {
	return [...s].length;
}
