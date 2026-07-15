import type { CardRarity } from '$lib/types';

export const untaggedFilterId = '__untagged__';

export function buildCollectionFilterTarget(filters: {
	query: string;
	sortBy: 'name' | 'rarity';
	selectedRarities: CardRarity[];
	tagFilterIds: string[];
}) {
	const parameters = new URLSearchParams();
	if (filters.query.trim()) parameters.set('q', filters.query.trim());
	if (filters.sortBy !== 'rarity') parameters.set('sortBy', filters.sortBy);
	filters.selectedRarities.forEach((rarity) => parameters.append('rarity', rarity));
	filters.tagFilterIds.forEach((tagId) => {
		if (tagId === untaggedFilterId) parameters.set('untagged', 'true');
		else parameters.append('tag', tagId);
	});

	const queryString = parameters.toString();
	return queryString ? `/collection?${queryString}` : '/collection';
}
