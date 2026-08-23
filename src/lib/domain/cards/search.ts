import type { CardRecord, CardSearchSort } from '$lib/types';

export const cardSearchSortDirection = (sortBy: CardSearchSort): 'ASC' | 'DESC' =>
	sortBy === 'name' ? 'ASC' : 'DESC';

export const defaultCardSearchSort = (
	query: string | undefined,
	requestedSort: CardSearchSort | undefined,
	fallback: CardSearchSort = 'rarity'
): CardSearchSort => requestedSort ?? (query?.trim() ? 'relevance' : fallback);

function normalized(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLocaleLowerCase('fr-FR');
}

function relevanceScore(card: CardRecord, query: string): number {
	const needle = normalized(query.trim());
	if (!needle) return 0;
	const title = normalized(card.title);
	const description = normalized(`${card.shortDescription} ${card.longDescription}`);
	if (title === needle) return 5;
	if (title.startsWith(needle)) return 4;
	if (title.split(/\s+/).some((word) => word.startsWith(needle))) return 3;
	if (title.includes(needle)) return 2;
	if (description.includes(needle)) return 1;
	return 0;
}

export function compareCardsByTextRelevance(
	left: CardRecord,
	right: CardRecord,
	query: string
): number {
	return (
		relevanceScore(right, query) - relevanceScore(left, query) ||
		left.title.localeCompare(right.title, 'fr')
	);
}
