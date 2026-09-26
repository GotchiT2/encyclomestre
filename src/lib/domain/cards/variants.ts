import type { CardRecord, PaginatedResponse } from '$lib/types';

export function matchesCardVariant(card: CardRecord, variantIds: number[]) {
	return !variantIds.length || variantIds.includes(card.variantId);
}

export function filterCardPageByVariant(
	page: PaginatedResponse<CardRecord>,
	variantIds: number[]
): PaginatedResponse<CardRecord> {
	if (!variantIds.length) return page;
	return { ...page, items: page.items.filter((card) => matchesCardVariant(card, variantIds)) };
}
