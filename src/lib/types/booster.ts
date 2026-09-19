import type { CardRecord, ImageAttribution } from './card';

export interface PackSummary {
	id: number;
	name: string;
	description: string;
	imageUrl: string;
	imageAttribution?: ImageAttribution;
	nbCards: number;
	available: number;
	max: number;
	nextAvailableAt: string | null;
}

export interface BoosterOpenResult {
	packId: number;
	cards: CardRecord[];
}
