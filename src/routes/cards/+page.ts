import type { PageLoad } from './$types';
import { getWikiForgeCards, toCardPage } from '$lib/api';
import { cardRarityCodeByName, cardRarityOptions } from '$lib/domain/cards/rarities';
import { filterCardPageByVariant } from '$lib/domain/cards/variants';
import type { CardRarity, CardVariant } from '$lib/types';

const rarities = new Set<CardRarity>(cardRarityOptions.map((rarity) => rarity.value));

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q')?.trim() ?? '';
	const selectedRarities = url.searchParams
		.getAll('rarity')
		.filter((rarity) => rarities.has(rarity as CardRarity)) as CardRarity[];
	const sortBy = url.searchParams.get('sortBy') === 'name' ? 'name' : 'rarity';
	const sortDirection = url.searchParams.get('sortDirection') === 'ASC' ? 'ASC' : 'DESC';
	const variant = (
		['normal', 'alternative'].includes(url.searchParams.get('variant') ?? '')
			? url.searchParams.get('variant')
			: 'all'
	) as CardVariant;
	return {
		cards: getWikiForgeCards(
			{
				page: Math.max(0, Number(url.searchParams.get('page') ?? 1) - 1),
				size: 50,
				q: query,
				sortBy,
				sortDirection,
				rarities: selectedRarities.map((rarity) => cardRarityCodeByName[rarity])
			},
			{ fetch }
		)
			.then(toCardPage)
			.then((page) => filterCardPageByVariant(page, variant)),
		filters: { query, selectedRarities, sortBy, sortDirection, variant }
	};
};
