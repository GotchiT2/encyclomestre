import type { PageLoad } from './$types';
import { getWikiForgePublicPages, toPublicPage } from '$lib/api';
import { cardRarityCodeByName, cardRarityOptions } from '$lib/domain/cards/rarities';
import type { CardRarity } from '$lib/types';

const rarities = new Set<CardRarity>(cardRarityOptions.map((rarity) => rarity.value));

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q')?.trim() ?? '';
	const selectedRarities = url.searchParams
		.getAll('rarity')
		.filter((rarity) => rarities.has(rarity as CardRarity))
		.slice(0, 1) as CardRarity[];
	const sortBy = url.searchParams.get('sortBy') === 'name' ? 'name' : 'rarity';
	const sortDirection = url.searchParams.get('sortDirection') === 'ASC' ? 'ASC' : 'DESC';
	return {
		cards: getWikiForgePublicPages(
			{
				page: Math.max(0, Number(url.searchParams.get('page') ?? 1) - 1),
				q: query,
				sortBy,
				sortDirection,
				rarity: selectedRarities[0] ? cardRarityCodeByName[selectedRarities[0]] : undefined
			},
			{ fetch }
		).then(toPublicPage),
		filters: { query, selectedRarities, sortBy, sortDirection }
	};
};
