import type { CardRecord, CardVariant, PaginatedResponse } from '$lib/types';

export function matchesCardVariant(card: CardRecord, variant: CardVariant) {
	return (
		variant === 'all' ||
		(variant === 'alternative' && Boolean(card.isFullArt)) ||
		(variant === 'normal' && !card.isFullArt)
	);
}

export function filterCardPageByVariant(
	page: PaginatedResponse<CardRecord>,
	variant: CardVariant
): PaginatedResponse<CardRecord> {
	if (variant === 'all') return page;
	return { ...page, items: page.items.filter((card) => matchesCardVariant(card, variant)) };
}
