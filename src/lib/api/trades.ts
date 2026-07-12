import { apiRequest, type RequestOptions } from './client';
import type { CreateTradeOfferInput, TradeOffer } from '$lib/types';

export const getTradeOffers = (userId: string, options?: RequestOptions) =>
	apiRequest<TradeOffer[]>(`/trades?userId=${encodeURIComponent(userId)}`, options);

export const createTradeOffer = (input: CreateTradeOfferInput, options?: RequestOptions) =>
	apiRequest<TradeOffer>('/trades', { ...options, method: 'POST', body: input });

export const respondToTradeOffer = (
	id: string,
	status: Extract<TradeOffer['status'], 'accepted' | 'rejected'>,
	options?: RequestOptions
) =>
	apiRequest<TradeOffer>(`/trades/${encodeURIComponent(id)}`, {
		...options,
		method: 'PATCH',
		body: { status }
	});

export const cancelTradeOffer = (id: string, options?: RequestOptions) =>
	apiRequest<TradeOffer>(`/trades/${encodeURIComponent(id)}`, {
		...options,
		method: 'PATCH',
		body: { status: 'cancelled' }
	});
