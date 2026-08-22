import type { CardRarity, CardSearchSort, CardVariant, SaleState } from '$lib/types';

export const untaggedFilterId = '__untagged__';

export function buildCollectionFilterTarget(filters: {
	query: string;
	sortBy: CardSearchSort;
	selectedRarities: CardRarity[];
	tagFilterIds: string[];
	variant: CardVariant;
	saleState: SaleState;
	page?: number;
	cursor?: string;
}) {
	const parameters = new URLSearchParams();
	if (filters.query.trim()) parameters.set('q', filters.query.trim());
	if (filters.sortBy !== 'rarity') parameters.set('sortBy', filters.sortBy);
	filters.selectedRarities.forEach((rarity) => parameters.append('rarity', rarity));
	filters.tagFilterIds.forEach((tagId) => {
		if (tagId === untaggedFilterId) parameters.set('untagged', 'true');
		else parameters.append('tag', tagId);
	});
	if (filters.variant !== 'all') parameters.set('variant', filters.variant);
	if (filters.saleState !== 'ALL') parameters.set('saleState', filters.saleState);
	if ((filters.page ?? 1) > 1) parameters.set('page', String(filters.page));
	if (filters.cursor) parameters.set('cursor', filters.cursor);

	const queryString = parameters.toString();
	return queryString ? `/collection?${queryString}` : '/collection';
}
