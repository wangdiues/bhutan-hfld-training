/**
 * The May 2026 training timetable (source: "Bhutan ART-TREES HFLD Readiness Training.docx"),
 * mapped to the lessons that now teach each session, plus short facilitator notes. Used by
 * trainer mode (task M6-04). No answer keys here: the repository is public.
 */
export interface Session {
	time: string;
	title: string;
	/** Lesson keys (paths without the base), e.g. "day-1/javascript-basics/". */
	lessons: string[];
	led?: string;
}

export interface AgendaDay {
	day: number;
	sessions: Session[];
	notes: string[];
}

export const AGENDA: AgendaDay[] = [
	{
		day: 1,
		sessions: [
			{ time: '09:00–09:30', title: 'Welcome and introductions', lessons: ['start-here/'] },
			{ time: '09:30–10:30', title: 'Bhutan ART-TREES HFLD submission and data requirements', lessons: ['day-1/art-trees-hfld-requirements/'] },
			{ time: '11:00–11:30', title: 'Introduction to Google Earth Engine: features, capabilities and access', lessons: ['day-1/introduction-to-earth-engine/'], led: 'Ate' },
			{ time: '11:30–13:00', title: 'GEE setup, interface and exploring data', lessons: ['day-1/code-editor-and-data-catalog/'], led: 'Ate' },
			{ time: '14:00–14:30', title: 'GEE fundamentals: data access, visualisation and basic JavaScript', lessons: ['day-1/javascript-basics/'], led: 'Ate & Samuel' },
			{ time: '14:30–15:30', title: 'Time series of images, image stacks and filtering image collections', lessons: ['day-1/image-collections/'], led: 'Ate' },
			{ time: '16:00–17:00', title: 'Time series and image collections (continued); custom functions', lessons: ['day-1/image-collections/', 'day-1/custom-functions/'], led: 'Ate & Samuel' },
		],
		notes: [
			'Before the course, check that every participant has a Google account with a Cloud project registered for Earth Engine. Registration can take time, so do it a week ahead.',
			'Share the training assets (see the asset catalogue) with every participant account before Day 2, or prepare a folder of copies.',
			'Test the Code Editor on the venue network; plan for slow connections (the site works offline after one visit).',
		],
	},
	{
		day: 2,
		sessions: [
			{ time: '09:00–09:30', title: 'Recap of Day 1', lessons: ['day-1/recap/'], led: 'Ate' },
			{ time: '09:30–10:00', title: 'Fundamentals of remote sensing', lessons: ['day-2/remote-sensing-fundamentals/'], led: 'Ate' },
			{ time: '10:00–13:00', title: 'Calculating spectral indices and working with functions (with a break 10:30–11:00)', lessons: ['day-2/spectral-indices/'], led: 'Ate & Samuel' },
			{ time: '14:00–14:30', title: 'Creating annual and seasonal composites for HFLD', lessons: ['day-2/mosaics-and-composites/'], led: 'Ate' },
			{ time: '14:30–15:30', title: 'Cloud and shadow masking; exporting composites', lessons: ['day-2/sentinel-2-mrv-composite/'], led: 'Ate & Samuel' },
			{ time: '16:00–16:30', title: 'Creating annual and seasonal Landsat composites', lessons: ['day-2/landsat-mrv-composite/'], led: 'Ate & Samuel' },
			{ time: '16:30–17:00', title: 'Importing and exporting datasets with GEE', lessons: ['day-2/import-and-export/'], led: 'Ate & Samuel' },
		],
		notes: [
			'A national 10 m composite export can take an hour or more. Start exports before a break, or have participants export one Dzongkhag.',
			'Exports fail most often on assetId paths: have participants create their own asset folder first.',
		],
	},
	{
		day: 3,
		sessions: [
			{ time: '09:00–09:30', title: 'Recap of Day 2', lessons: ['day-2/recap/'], led: 'Ate' },
			{ time: '09:30–10:00', title: 'Introduction to machine learning', lessons: ['day-3/random-forest/'], led: 'Ate' },
			{ time: '10:00–10:30', title: 'Calculating covariates for HFLD', lessons: ['day-3/covariates/'], led: 'Ate & Samuel' },
			{ time: '11:00–13:00', title: 'Forest primitives with machine learning: composites, training data, primitive layers', lessons: ['day-3/forest-primitives/', 'day-4/training-data/'], led: 'Ate & Samuel' },
		],
		notes: [
			'The primitives script reads trainer assets; check read access first.',
			'Random Forest over the whole country can hit memory limits interactively: show the "User memory limit exceeded" how-to and use exports.',
			'The change-detection lesson (Day 3) was added after the training; use it as homework or in the Day 4 recap.',
		],
	},
	{
		day: 4,
		sessions: [
			{ time: '09:00–09:30', title: 'Recap of Day 3', lessons: ['day-3/recap/'], led: 'Ate' },
			{ time: '09:30–10:00', title: 'An RLCMS approach to land-cover mapping for HFLD', lessons: ['day-4/rlcms-overview/'], led: 'Ate' },
			{ time: '10:00–10:30', title: 'Building a categorical land-cover map with Sentinel-2 (assemblage)', lessons: ['day-4/assemblage/'], led: 'Ate & Samuel' },
			{ time: '11:00–11:15', title: 'Calculating and exporting primitives (continued)', lessons: ['day-3/forest-primitives/'], led: 'Ate & Samuel' },
			{ time: '11:15–13:00', title: 'Building a land-cover map from primitives (assemblage)', lessons: ['day-4/assemblage/'], led: 'Ate & Samuel' },
			{ time: '14:00–14:30', title: 'Introduction to AlphaEarth embeddings', lessons: ['day-4/satellite-embeddings/'], led: 'Ate' },
			{ time: '14:30–15:30', title: 'Mapping change with AlphaEarth embeddings', lessons: ['day-4/embeddings-classification-similarity/'], led: 'Ate & Samuel' },
			{ time: '16:00–17:00', title: 'Collect Earth Online: demonstration, response design, setting up a project and interpreting samples', lessons: ['day-4/collect-earth-online/'], led: 'Samuel' },
		],
		notes: [
			'Create Collect Earth Online accounts and an institution for the group before the afternoon session.',
			'The agenda listed validation as the Day 4 objective, while the timetable teaches RLCMS and embeddings; the course follows the timetable.',
		],
	},
	{
		day: 5,
		sessions: [
			{ time: '09:00–09:30', title: 'Recap of Day 4', lessons: ['day-4/recap/'], led: 'Samuel' },
			{ time: '09:30–10:00', title: 'Designing stratified random samples', lessons: ['day-5/sampling-design/'], led: 'Samuel' },
			{ time: '10:00–10:30', title: 'Creating a stratified sample: sample size and drawing it in GEE', lessons: ['day-5/sample-size/', 'day-5/stratified-sampling-gee/'], led: 'Ate & Samuel' },
			{ time: '11:00–13:00', title: 'Accuracy assessment and area estimation', lessons: ['day-5/accuracy-and-area/'], led: 'Ate & Samuel' },
			{ time: '14:00–15:30', title: 'Group work: land-cover map stratification and image interpretation', lessons: ['capstone/'], led: 'Ate & Samuel' },
			{ time: '16:00–16:45', title: 'Group presentations', lessons: ['capstone/'], led: 'Groups' },
			{ time: '16:45–17:00', title: 'Closing', lessons: [] },
		],
		notes: [
			'Assign each group a Dzongkhag in the morning, so they can start the map during breaks.',
			'Ninety minutes is short for the full capstone: groups can start from the trainers’ map and focus on sampling, interpretation and accuracy.',
			'The Reporting lesson and the Day 5 recap quiz were added after the training; set them as follow-up work.',
		],
	},
];

/** Sessions that teach a given lesson, with their day. */
export function sessionsFor(key: string): { day: number; session: Session }[] {
	return AGENDA.flatMap((d) => d.sessions.filter((s) => s.lessons.includes(key)).map((session) => ({ day: d.day, session })));
}
