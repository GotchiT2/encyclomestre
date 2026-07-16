import type { CardRarity } from '$lib/types';
import { getWikiForgeCollection, getWikiForgeTags, toCollectionPage } from '$lib/api';
import { cardRarityCodeByName, cardRarityOptions } from '$lib/domain/cards/rarities';
import type { CardVariant } from '$lib/types';
import type { PageLoad } from './$types';

const validRarities = new Set(cardRarityOptions.map((rarity) => rarity.value));

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q')?.trim() ?? '';
	const selectedRarities = url.searchParams
		.getAll('rarity')
		.filter((rarity): rarity is CardRarity => validRarities.has(rarity as CardRarity));
	const tagFilterIds = url.searchParams.getAll('tag');
	const untagged = url.searchParams.get('untagged') === 'true';
	if (untagged) tagFilterIds.push('__untagged__');
	const sortBy = url.searchParams.get('sortBy') === 'name' ? 'name' : 'rarity';
	const variant = (
		['normal', 'alternative'].includes(url.searchParams.get('variant') ?? '')
			? url.searchParams.get('variant')
			: 'all'
	) as CardVariant;
	return {
		collection: getWikiForgeCollection(
			{
				q: query,
				size: 100,
				sortBy,
				sortDirection: sortBy === 'name' ? 'ASC' : 'DESC',
				rarities: selectedRarities.map((rarity) => cardRarityCodeByName[rarity]),
				tagIds: tagFilterIds.filter((id) => id !== '__untagged__'),
				untagged,
				variant
			},
			{ fetch }
		).then(toCollectionPage),
		tags: getWikiForgeTags({ fetch }),
		filters: { query, selectedRarities, tagFilterIds, sortBy, variant }
	};
};
