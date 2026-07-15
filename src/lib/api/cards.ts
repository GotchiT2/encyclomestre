import { apiRequest, type RequestOptions } from './client';
import { getWikiForgeCard, getWikiForgeCards, toCardPage, toCardRecord } from './wikiforge';
import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
import type { CardPriceHistory, CardRarity, CardRecord } from '$lib/types';

export interface CardQuery {
	page?: number;
	pageSize?: number;
	query?: string;
	rarity?: CardRarity;
	rarities?: CardRarity[];
	sortBy?: 'name' | 'rarity';
	sortDirection?: 'ASC' | 'DESC';
}

export const getCards = async (
	{
		page = 1,
		pageSize = 12,
		query,
		rarity,
		rarities,
		sortBy = 'name',
		sortDirection = 'ASC'
	}: CardQuery = {},
	options?: RequestOptions
) =>
	toCardPage(
		await getWikiForgeCards(
			{
				page: Math.max(0, page - 1),
				size: pageSize,
				q: query,
				rarities: (rarities ?? (rarity ? [rarity] : [])).map(
					(value) => cardRarityCodeByName[value]
				),
				sortBy,
				sortDirection
			},
			options
		)
	);

const cardRequestCache = new Map<string, Promise<CardRecord>>();

export const getCard = async (id: string, options?: RequestOptions): Promise<CardRecord> => {
	if (options) return toCardRecord(await getWikiForgeCard(id, options));
	const cached = cardRequestCache.get(id);
	if (cached) return cached;
	const request = getWikiForgeCard(id)
		.then(toCardRecord)
		.catch((error) => {
			cardRequestCache.delete(id);
			throw error;
		});
	cardRequestCache.set(id, request);
	return request;
};

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
