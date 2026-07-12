import type { PageLoad } from './$types';
import { getCards } from '$lib/api';
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
	const candidateRarity = url.searchParams.get('rarity');
	const rarity =
		candidateRarity && rarities.has(candidateRarity as CardRarity)
			? (candidateRarity as CardRarity)
			: undefined;
	return {
		cards: getCards(
			{ page: Math.max(1, Number(url.searchParams.get('page') ?? 1)), pageSize: 12, query, rarity },
			{ fetch }
		),
		filters: { query, rarity }
	};
};
