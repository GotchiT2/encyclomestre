import type { CardRarity } from '$lib/types';
import { getWikiForgeCollection, getWikiForgeTags, toCollectionPage } from '$lib/api';
import type { PageLoad } from './$types';

const rarityCodes: Record<CardRarity, 'C' | 'PC' | 'R' | 'SR' | 'UR' | 'L' | 'KTD'> = {
	Commune: 'C',
	'Peu Commune': 'PC',
	Rare: 'R',
	'Super-Rare': 'SR',
	'Ultra-Rare': 'UR',
	Légendaire: 'L',
	KTD: 'KTD'
};
const validRarities = new Set(Object.keys(rarityCodes) as CardRarity[]);

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q')?.trim() ?? '';
	const selectedRarities = url.searchParams
		.getAll('rarity')
		.filter((rarity): rarity is CardRarity => validRarities.has(rarity as CardRarity));
	const tagFilterIds = url.searchParams.getAll('tag');
	const untagged = url.searchParams.get('untagged') === 'true';
	if (untagged) tagFilterIds.push('__untagged__');
	const sortBy = url.searchParams.get('sortBy') === 'name' ? 'name' : 'rarity';
	return {
		collection: getWikiForgeCollection(
			{
				q: query,
				size: 100,
				sortBy,
				sortDirection: sortBy === 'name' ? 'ASC' : 'DESC',
				rarities: selectedRarities.map((rarity) => rarityCodes[rarity]),
				tagIds: tagFilterIds.filter((id) => id !== '__untagged__'),
				untagged
			},
			{ fetch }
		).then(toCollectionPage),
		tags: getWikiForgeTags({ fetch }),
		filters: { query, selectedRarities, tagFilterIds, sortBy }
	};
};
