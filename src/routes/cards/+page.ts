import type { PageLoad } from './$types';
import { getWikiForgeCards, toCardPage } from '$lib/api';
import type { CardRarity } from '$lib/types';

const rarities = new Set<CardRarity>([
	'Légendaire',
	'Ultra-Rare',
	'Super-Rare',
	'Rare',
	'Peu Commune',
	'Commune'
]);

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q')?.trim() ?? '';
	const selectedRarities = url.searchParams.getAll('rarity').filter((rarity) => rarities.has(rarity as CardRarity)) as CardRarity[];
	const sortBy = url.searchParams.get('sortBy') === 'name' ? 'name' : 'rarity';
	const sortDirection = url.searchParams.get('sortDirection') === 'ASC' ? 'ASC' : 'DESC';
	return {
		cards: getWikiForgeCards({ page: Math.max(0, Number(url.searchParams.get('page') ?? 1) - 1), size: 50, q: query, sortBy, sortDirection, rarities: selectedRarities.map((rarity) => ({ 'Commune': 'C', 'Peu Commune': 'PC', 'Rare': 'R', 'Super-Rare': 'SR', 'Ultra-Rare': 'UR', 'Légendaire': 'L' })[rarity] as 'C' | 'PC' | 'R' | 'SR' | 'UR' | 'L') }, { fetch }).then(toCardPage),
		filters: { query, selectedRarities, sortBy, sortDirection }
	};
};
