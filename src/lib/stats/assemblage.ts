/**
 * RLCMS assemblage rules for Lab 5, the assemblage rule builder (task M5-07). Pure functions that
 * apply ordered threshold rules to primitive probabilities, and write the same rules as the
 * ee.Classifier.decisionTree() text that scripts/gee/day-4/assemblage.js builds.
 */
export interface ClassDef {
	/** Band name of the primitive in the assemblage script. */
	band: string;
	name: string;
	threshold: number;
	palette: string;
}

/** The six primitives, default thresholds and colours of scripts/gee/day-4/assemblage.js. */
export const DEFAULT_CLASSES: ClassDef[] = [
	{ band: 'forest', name: 'Forest', threshold: 0.5, palette: '267300' },
	{ band: 'crop', name: 'Cropland', threshold: 0.55, palette: 'AAFF00' },
	{ band: 'grass', name: 'Grassland', threshold: 0.55, palette: 'D7C29E' },
	{ band: 'other', name: 'Other land', threshold: 0.6, palette: 'FFFFBE' },
	{ band: 'bu', name: 'Settlement', threshold: 0.3, palette: 'E600A9' },
	{ band: 'wet', name: 'Wetland', threshold: 0.25, palette: '004DA8' },
];

export type Probabilities = Record<string, number>;

/** Illustrative pixels (probabilities from 0 to 1), chosen to show where rule order matters. */
export const EXAMPLE_PIXELS: { name: string; p: Probabilities }[] = [
	{ name: 'Dense forest, Trongsa', p: { forest: 0.92, crop: 0.05, grass: 0.08, other: 0.02, bu: 0.01, wet: 0.03 } },
	{ name: 'Agroforestry edge, Tsirang', p: { forest: 0.62, crop: 0.7, grass: 0.2, other: 0.05, bu: 0.04, wet: 0.02 } },
	{ name: 'Alpine meadow, Haa', p: { forest: 0.2, crop: 0.1, grass: 0.58, other: 0.45, bu: 0.01, wet: 0.05 } },
	{ name: 'Village edge, Punakha', p: { forest: 0.1, crop: 0.58, grass: 0.15, other: 0.1, bu: 0.34, wet: 0.08 } },
	{ name: 'River bar, Punatsangchhu', p: { forest: 0.05, crop: 0.08, grass: 0.12, other: 0.48, bu: 0.06, wet: 0.29 } },
	{ name: 'Shaded slope, unsure', p: { forest: 0.44, crop: 0.12, grass: 0.4, other: 0.2, bu: 0.02, wet: 0.04 } },
];

export interface Assignment {
	/** 1-based class value in the output map; 0 when no rule passes. */
	value: number;
	name: string;
	/** Index of the rule that decided, or -1. */
	rule: number;
}

/** Apply the rules in order: the first primitive at or above its threshold wins. */
export function assign(rules: ClassDef[], p: Probabilities): Assignment {
	for (let i = 0; i < rules.length; i++) {
		const v = p[rules[i].band];
		if (typeof v === 'number' && v >= rules[i].threshold) return { value: i + 1, name: rules[i].name, rule: i };
	}
	return { value: 0, name: 'Unclassified', rule: -1 };
}

/** The class with the highest probability, for comparison with the rule-based result. */
export function mostProbable(rules: ClassDef[], p: Probabilities): string {
	let best = rules[0];
	for (const r of rules) if ((p[r.band] ?? -1) > (p[best.band] ?? -1)) best = r;
	return best.name;
}

/** The decision-tree text, built exactly as buildDecisionTree() in assemblage.js. */
export function treeText(rules: ClassDef[]): string {
	const dt = ['1) root 9999 9999 9999'];
	let base = 1;
	for (let i = 0; i < rules.length; i++) {
		const a = base * 2;
		const b = base * 2 + 1;
		const { band, threshold } = rules[i];
		dt.push(`${a}) ${band}>=${threshold} 9999 9999 ${i + 1} *`);
		dt.push(`${b}) ${band}<${threshold} 9999 9999 ${i === rules.length - 1 ? '0 *' : '9999'}`);
		base = b;
	}
	return dt.join('\n');
}

/**
 * Earth Engine code to paste at the end of the assemblage script. It uses the script's primiImg
 * and aoi, and its own variable names so that it doesn't change the script's panel or exports.
 */
export function eeCode(rules: ClassDef[]): string {
	const q = (s: string) => `'${s}'`;
	const lines = treeText(rules)
		.split('\n')
		.map((l) => `  ${q(l)}`)
		.join(',\n');
	return [
		'// Paste at the end of the assemblage script (after Part 11), then click Run.',
		"// Clicking the panel's Run assemblage button later resets the map; run the script again to see this layer.",
		`// Rule order (first rule passed wins): ${rules.map((r) => `${r.name} >= ${r.threshold}`).join(', then ')}.`,
		`var myPrimitives = [${rules.map((r) => q(r.band)).join(', ')}];`,
		`var myTree = [\n${lines}\n].join('\\n');`,
		'var myLandClass = primiImg.select(myPrimitives).classify(ee.Classifier.decisionTree(myTree));',
		`// Class values: ${rules.map((r, i) => `${i + 1} = ${r.name}`).join(', ')}; 0 = no rule passed.`,
		`Map.addLayer(myLandClass.selfMask().clip(aoi), {min: 1, max: ${rules.length}, palette: [${rules.map((r) => q(r.palette)).join(', ')}]}, 'My assemblage');`,
	].join('\n');
}

export function isRules(x: unknown): x is ClassDef[] {
	if (!Array.isArray(x) || x.length !== DEFAULT_CLASSES.length) return false;
	const bands = new Set(DEFAULT_CLASSES.map((c) => c.band));
	return (
		x.every(
			(r) =>
				typeof r === 'object' &&
				r !== null &&
				bands.has((r as ClassDef).band) &&
				typeof (r as ClassDef).threshold === 'number' &&
				(r as ClassDef).threshold >= 0 &&
				(r as ClassDef).threshold <= 1,
		) && new Set(x.map((r) => (r as ClassDef).band)).size === x.length
	);
}
