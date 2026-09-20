import type { CardRecord, ImageAttribution } from './card';

export type PackStatus = 'OPEN' | 'UPCOMING' | 'EXHAUSTED' | 'ENDED' | (string & {});
export type PackFamily = 'NORMAL' | 'PREMIUM' | 'PREMIUM_PLUS' | (string & {});

export interface PackPageSummary {
	id: number;
	title: string;
	image?: string;
	maxCopies?: number;
	remainingCopies?: number;
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
	imageUrl?: string;
	renderKey?: string;
	status: PackStatus;
	startsAt?: string;
	endsAt?: string;
	nbCards: number;
	openAll: boolean;
	drawGroups: PackDrawGroup[];
}

export interface PackSummary {
	id: number;
	slotId: number;
	family: PackFamily;
	name: string;
	description: string;
	imageUrl: string;
	imageAttribution?: ImageAttribution;
	nbCards: number;
	/** Crédits ordinaires actuellement disponibles. */
	regularAvailable: number;
	/** Crédits obtenus via les succès, consommés après les crédits ordinaires. */
	bonus: number;
	/** Total ouvrable (`regularAvailable + bonus`). */
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
