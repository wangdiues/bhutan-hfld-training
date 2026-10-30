/**
 * Lab 2 (task M5-03): inputs, CSV parsing and the result rows for the accuracy and area
 * estimator. The statistics are in accuracyArea.ts; this module validates input, parses
 * pasted CSV (a confusion matrix, or one row per sample as exported from Collect Earth
 * Online) and turns results into rows the page and the report CSV share. Pure: no DOM.
 */
import { accuracyArea, type AccuracyResult, type Maybe } from './accuracyArea';

export interface AccuracyLabInput {
	classes: string[];
	mappedAreaHa: number[];
	matrix: number[][];
	z: number;
	varianceRule: 'olofsson' | 'workbook';
	/** Pass if the uncertainty (CI half-width as % of the estimate) is at most this; null = no check. */
	thresholdPercent: number | null;
}

export interface ClassRow {
	name: string;
	mappedAreaHa: number;
	samples: number;
	usersAccuracy: Maybe;
	producersAccuracySample: Maybe;
	producersAccuracyArea: Maybe;
	adjustedAreaHa: number;
	seAreaHa: number;
	ciHalfWidthHa: number;
	ciLowHa: number;
	ciHighHa: number;
	uncertaintyPercent: Maybe;
	pass: boolean | null;
}

export interface AccuracyLabResult {
	raw: AccuracyResult;
	rows: ClassRow[];
	overallSample: Maybe;
	overallArea: Maybe;
	kappa: Maybe;
	/** null when a stratum has no samples: the adjusted areas then do not cover the whole map. */
	adjustedTotalHa: number | null;
	warnings: string[];
}

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: string };

/** The Day 5 workbook exactly, so the lab can be checked against it. */
export function workbookExample(): AccuracyLabInput {
	return {
		classes: ['Forest', 'Non-Forest', 'Deforestation'],
		mappedAreaHa: [2675342.29192151, 2687478.54, 12136.2459005927],
		matrix: [
			[1595, 50, 5],
			[0, 0, 0],
			[20, 10, 120],
		],
		z: 1.6449,
		varianceRule: 'workbook',
		thresholdPercent: null,
	};
}

export function runAccuracyLab(input: AccuracyLabInput): Outcome<AccuracyLabResult> {
	const k = input.classes.length;
	if (k < 2) return { ok: false, error: 'Add at least two classes.' };
	const names = input.classes.map((c, i) => c.trim() || `Class ${i + 1}`);
	if (new Set(names).size !== k) return { ok: false, error: 'Each class needs a different name.' };
	if (input.mappedAreaHa.length !== k || input.matrix.length !== k || input.matrix.some((r) => r.length !== k))
		return { ok: false, error: 'The matrix must have one row and one column per class.' };
	for (let i = 0; i < k; i++) {
		const a = input.mappedAreaHa[i];
		if (!Number.isFinite(a) || a < 0) return { ok: false, error: `${names[i]}: the mapped area must be a number of hectares, 0 or more.` };
		for (let j = 0; j < k; j++) {
			const x = input.matrix[i][j];
			if (!Number.isFinite(x) || x < 0 || !Number.isInteger(x))
				return { ok: false, error: `Map ${names[i]} / reference ${names[j]}: sample counts must be whole numbers, 0 or more.` };
		}
	}
	if (!(input.mappedAreaHa.reduce((s, a) => s + a, 0) > 0))
		return { ok: false, error: 'The total mapped area is 0. Enter the mapped area of each class.' };
	if (input.matrix.flat().every((x) => x === 0)) return { ok: false, error: 'The confusion matrix is empty. Enter the sample counts.' };
	if (!(input.z > 0)) return { ok: false, error: 'Choose a confidence level.' };

	const r = accuracyArea({ mappedAreaHa: input.mappedAreaHa, matrix: input.matrix, z: input.z, varianceRule: input.varianceRule });
	const warnings: string[] = [];
	if (r.emptyStrata.length > 0) {
		warnings.push(
			`${r.emptyStrata.map((i) => names[i]).join(', ')} ${r.emptyStrata.length === 1 ? 'has' : 'have'} no samples, so ${(
				r.emptyStrata.reduce((s, i) => s + r.weights[i], 0) * 100
			).toFixed(1)}% of the mapped area is not represented. The adjusted areas do not add up to the map total and cannot be reported. Sample every stratum.`,
		);
	}
	r.rowTotals.forEach((n, i) => {
		if (n === 1) warnings.push(`${names[i]} has only 1 sample, so its variance cannot be estimated (it adds 0 to the standard errors).`);
	});
	if (input.varianceRule === 'workbook')
		warnings.push('Variance rule: as in the workbook, cells with fewer than 2 samples are left out of the standard errors. Olofsson et al. (2014) keep them; choose that rule for reporting.');

	const rows: ClassRow[] = names.map((name, j) => {
		const unc = r.uncertaintyPercent[j];
		return {
			name,
			mappedAreaHa: input.mappedAreaHa[j],
			samples: r.rowTotals[j],
			usersAccuracy: r.sampleBased.usersAccuracy[j],
			producersAccuracySample: r.sampleBased.producersAccuracy[j],
			producersAccuracyArea: r.areaWeighted.producersAccuracy[j],
			adjustedAreaHa: r.adjustedAreaHa[j],
			seAreaHa: r.seAreaHa[j],
			ciHalfWidthHa: r.ciHalfWidthHa[j],
			ciLowHa: r.adjustedAreaHa[j] - r.ciHalfWidthHa[j],
			ciHighHa: r.adjustedAreaHa[j] + r.ciHalfWidthHa[j],
			uncertaintyPercent: unc,
			pass: input.thresholdPercent === null || unc === null ? null : unc <= input.thresholdPercent,
		};
	});
	return {
		ok: true,
		value: {
			raw: r,
			rows,
			overallSample: r.sampleBased.overallAccuracy,
			overallArea: r.areaWeighted.overallAccuracy,
			kappa: r.sampleBased.kappa,
			adjustedTotalHa: r.emptyStrata.length ? null : r.adjustedAreaHa.reduce((s, a) => s + a, 0),
			warnings,
		},
	};
}

/** Split CSV text into rows of trimmed cells (handles quotes, commas, tabs and semicolons). */
export function parseCsvRows(text: string): string[][] {
	const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
	if (lines.length === 0) return [];
	const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
	return lines.map((line) => {
		const cells: string[] = [];
		let cur = '';
		let quoted = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (quoted) {
				if (ch === '"' && line[i + 1] === '"') {
					cur += '"';
					i++;
				} else if (ch === '"') quoted = false;
				else cur += ch;
			} else if (ch === '"') quoted = true;
			else if (ch === sep) {
				cells.push(cur.trim());
				cur = '';
			} else cur += ch;
		}
		cells.push(cur.trim());
		return cells;
	});
}

export interface ParsedCsv {
	classes: string[];
	matrix: number[][];
	/** Present when the CSV had an area column (matrix format only). */
	mappedAreaHa?: number[];
	format: 'matrix' | 'samples';
}

const MAP_COL = /^(map|map[ _]?class|mapped[ _]?class|stratum|strata|pl_?stratum|pl_?map[ _]?class)$/i;
const REF_COL = /^(ref|reference|reference[ _]?class|ref[ _]?class|interpreted|interpretation|label|land[ _]?cover)$/i;
const AREA_COL = /^(area|area[ _]?ha|mapped[ _]?area|mapped[ _]?area[ _]?ha)$/i;

/**
 * Two formats:
 *  - matrix: header row "map \ reference, A, B, C[, area_ha]", then one row per map class;
 *  - samples: one row per sample with a map column and a reference column (e.g. a CEO export
 *    with columns renamed "map" and "reference"); counts are tallied.
 */
export function parseConfusionCsv(text: string): Outcome<ParsedCsv> {
	const rows = parseCsvRows(text);
	if (rows.length < 2) return { ok: false, error: 'Paste a header row and at least one data row.' };
	const header = rows[0];
	const mapIdx = header.findIndex((h) => MAP_COL.test(h));
	const refIdx = header.findIndex((h) => REF_COL.test(h));

	if (mapIdx !== -1 && refIdx !== -1) {
		const classes: string[] = [];
		const add = (c: string) => {
			if (!classes.includes(c)) classes.push(c);
		};
		const pairs: [string, string][] = [];
		for (const [n, row] of rows.slice(1).entries()) {
			const m = row[mapIdx] ?? '';
			const ref = row[refIdx] ?? '';
			if (!m || !ref) return { ok: false, error: `Row ${n + 2}: the "${header[mapIdx]}" or "${header[refIdx]}" value is missing.` };
			pairs.push([m, ref]);
		}
		pairs.forEach(([m]) => add(m));
		pairs.forEach(([, ref]) => add(ref));
		const matrix = classes.map(() => classes.map(() => 0));
		for (const [m, ref] of pairs) matrix[classes.indexOf(m)][classes.indexOf(ref)]++;
		return { ok: true, value: { classes, matrix, format: 'samples' } };
	}

	const areaCol = header.findIndex((h, i) => i > 0 && AREA_COL.test(h));
	const refNames = header.slice(1).filter((_, i) => i + 1 !== areaCol);
	const body = rows.slice(1);
	if (refNames.length < 2 || body.length !== refNames.length) {
		return {
			ok: false,
			error:
				'Could not read this CSV. Use either a square matrix (header: a corner cell, then one column per reference class, optionally an "area_ha" column; then one row per map class in the same order) or one row per sample with columns named "map" and "reference".',
		};
	}
	const matrix: number[][] = [];
	const areas: number[] = [];
	for (const [i, row] of body.entries()) {
		if (row[0] !== refNames[i])
			return { ok: false, error: `Row ${i + 2} is "${row[0]}", but the matrix needs the map classes in the same order as the columns ("${refNames[i]}" here).` };
		const cells = row.slice(1).filter((_, c) => c + 1 !== areaCol);
		const nums = cells.map((c) => Number(c.replace(/,/g, '')));
		if (nums.length !== refNames.length || nums.some((x) => !Number.isFinite(x) || x < 0 || !Number.isInteger(x)))
			return { ok: false, error: `Row ${i + 2} (${row[0]}): every count must be a whole number, 0 or more.` };
		matrix.push(nums);
		if (areaCol !== -1) {
			const a = Number((row[areaCol] ?? '').replace(/,/g, ''));
			if (!Number.isFinite(a) || a < 0) return { ok: false, error: `Row ${i + 2} (${row[0]}): the area must be a number of hectares.` };
			areas.push(a);
		}
	}
	return { ok: true, value: { classes: refNames, matrix, mappedAreaHa: areaCol === -1 ? undefined : areas, format: 'matrix' } };
}
