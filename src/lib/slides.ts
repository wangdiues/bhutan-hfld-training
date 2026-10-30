/**
 * Slide deck data for the on-site player (task M3-10), written by
 * scripts/convert/render_slides.py (task M2-07): src/data/slides/<deck>.json plus
 * src/assets/slides/<deck>/NN.webp.
 */
import type { ImageMetadata } from 'astro';

export interface SlideData {
	image: string;
	source_slide: number;
	title: string;
	text: string;
	notes: string;
	hidden_pictures: number;
}

export interface DeckData {
	deck: string;
	title: string;
	day: number;
	lesson: string;
	source: string;
	credit: string;
	slides: SlideData[];
}

const decks = import.meta.glob<DeckData>('../data/slides/*.json', { eager: true, import: 'default' });
const images = import.meta.glob<ImageMetadata>('../assets/slides/*/*.webp', { eager: true, import: 'default' });

/** All decks, in course order (day, then the order the decks were taught). */
export const DECK_ORDER = [
	'introduction-to-earth-engine',
	'code-editor-and-data-catalog',
	'image-collections',
	'remote-sensing-fundamentals',
	'mosaics-and-composites',
	'import-and-export',
	'random-forest',
	'rlcms-overview',
	'satellite-embeddings',
	'sampling-design',
	'accuracy-and-area',
];

export function getDeck(slug: string): DeckData {
	const deck = decks[`../data/slides/${slug}.json`];
	if (!deck) throw new Error(`Unknown slide deck "${slug}". Run scripts/convert/render_slides.py.`);
	return deck;
}

export function allDecks(): DeckData[] {
	const known = Object.values(decks);
	const rank = (d: DeckData) => {
		const i = DECK_ORDER.indexOf(d.deck);
		return i === -1 ? DECK_ORDER.length : i;
	};
	return known.sort((a, b) => a.day - b.day || rank(a) - rank(b));
}

export function slideImage(deck: string, file: string): ImageMetadata {
	const img = images[`../assets/slides/${deck}/${file}`];
	if (!img) throw new Error(`Missing slide image ${deck}/${file}`);
	return img;
}
