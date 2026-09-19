import type { CardRecord, ImageAttribution } from './card';

export type PackStatus = 'OPEN' | 'UPCOMING' | 'CLOSED' | 'EXHAUSTED' | (string & {});
export type PackFamily = 'NORMAL' | 'PREMIUM' | 'PREMIUM_PLUS' | (string & {});

export interface PackPageSummary {
	id: number;
	title: string;
	image?: string;
}

export interface PackVariantAvailability {
	variantId: number;
	dropRate: number;
	maxCopies?: number;
	remainingCopies?: number;
	pages?: PackPageSummary[];
}

export interface PackDrawGroup {
	count: number;
	variants: PackVariantAvailability[];
}

export interface PackDefinition {
	id: number;
	slotId: number;
	position: number;
	family: PackFamily;
	name: string;
	description: string;
	renderKey: string;
	status: PackStatus;
	startsAt?: string;
	endsAt?: string;
	nbCards: number;
	openAll: boolean;
	drawGroups: PackDrawGroup[];
}

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

export interface PackCatalogueItem extends PackDefinition {
	credit: PackSummary | null;
}

export interface BoosterOpenResult {
	packId: number;
	cards: CardRecord[];
}
