import { apiRequest, type RequestOptions } from './client';
import type { CardPriceHistory, CardRarity, CardRecord, PaginatedResponse } from '$lib/types';

export interface CardQuery {
	page?: number;
	pageSize?: number;
	query?: string;
	rarity?: CardRarity;
}

export const getCards = (
	{ page = 1, pageSize = 12, query, rarity }: CardQuery = {},
	options?: RequestOptions
) => {
	const parameters = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
	if (query) parameters.set('q', query);
	if (rarity) parameters.set('rarity', rarity);
	return apiRequest<PaginatedResponse<CardRecord>>(`/cards?${parameters}`, options);
};

export const getCard = (id: string, options?: RequestOptions) =>
	apiRequest<CardRecord>(`/cards/${encodeURIComponent(id)}`, options);

export const getCardPriceHistory = (id: string, options?: RequestOptions) =>
	apiRequest<CardPriceHistory>(`/cards/${encodeURIComponent(id)}/price-history`, options);
