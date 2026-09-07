import type { CardRarity, CardSearchSort, CardVariant } from '$lib/types';

/** Paramètres UI partagés par les sélecteurs alimentés par `/pages`. */
export interface CardQuery {
	page?: number;
	pageSize?: number;
	query?: string;
	rarity?: CardRarity;
	rarities?: CardRarity[];
	sortBy?: CardSearchSort;
	sortDirection?: 'ASC' | 'DESC';
	variant?: CardVariant;
	cursor?: string;
}
