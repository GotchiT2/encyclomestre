import { apiRequest, type RequestOptions } from './client';
import { getWikiForgeCard, getWikiForgeCards, toCardPage, toCardRecord } from './wikiforge';
import type { CardPriceHistory, CardRarity, CardRecord } from '$lib/types';

export interface CardQuery {
	page?: number;
	pageSize?: number;
	query?: string;
	rarity?: CardRarity;
}

const rarityCodes: Record<CardRarity, 'C' | 'PC' | 'R' | 'SR' | 'UR' | 'L' | 'KTD'> = {
	Commune: 'C',
	'Peu Commune': 'PC',
	Rare: 'R',
	'Super-Rare': 'SR',
	'Ultra-Rare': 'UR',
	Légendaire: 'L',
	KTD: 'KTD'
};

export const getCards = async (
	{ page = 1, pageSize = 12, query, rarity }: CardQuery = {},
	options?: RequestOptions
) =>
	toCardPage(
		await getWikiForgeCards(
			{
				page: Math.max(0, page - 1),
				size: pageSize,
				q: query,
				rarities: rarity ? [rarityCodes[rarity]] : undefined
			},
			options
		)
	);

export const getCard = async (id: string, options?: RequestOptions): Promise<CardRecord> =>
	toCardRecord(await getWikiForgeCard(id, options));

interface WikiForgePricePoint {
	price: number;
	currency: string;
	recordedAt: string;
	type: string;
}

export const getCardPriceHistory = async (
	id: string,
	options?: RequestOptions
): Promise<CardPriceHistory> => {
	const points = await apiRequest<WikiForgePricePoint[]>(
		`/api/cards/${encodeURIComponent(id)}/price-history`,
		options
	);
	return {
		cardId: id,
		points: points.map((point) => ({
			date: point.recordedAt,
			price: point.price,
			currency: point.currency
		}))
	};
};
