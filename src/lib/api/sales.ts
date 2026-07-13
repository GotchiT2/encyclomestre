import { apiRequest, type RequestOptions } from './client';
import type { SaleBid, SaleListing } from '$lib/types';

export const getSales = (sellerId: string, options?: RequestOptions) =>
	apiRequest<SaleListing[]>(`/sales?sellerId=${encodeURIComponent(sellerId)}`, options);

export const getCardSales = (cardId: string, options?: RequestOptions) =>
	apiRequest<SaleListing[]>(`/sales?cardId=${encodeURIComponent(cardId)}`, options);

export const getMarketListings = (
	input: {
		query?: string;
		type?: SaleListing['type'];
		maxPrice?: number;
		sellerId?: string;
		bidderId?: string;
	} = {},
	options?: RequestOptions
) => {
	const parameters = new URLSearchParams();
	if (input.query) parameters.set('q', input.query);
	if (input.type) parameters.set('type', input.type);
	if (input.maxPrice) parameters.set('maxPrice', String(input.maxPrice));
	if (input.sellerId) parameters.set('sellerId', input.sellerId);
	if (input.bidderId) parameters.set('bidderId', input.bidderId);
	return apiRequest<SaleListing[]>(`/sales?${parameters}`, options);
};

export const getSale = (id: string, options?: RequestOptions) =>
	apiRequest<SaleListing>(`/sales/${encodeURIComponent(id)}`, options);

export const getSaleBids = (id: string, options?: RequestOptions) =>
	apiRequest<SaleBid[]>(`/sales/${encodeURIComponent(id)}/bids`, options);

export const placeBid = (id: string, amount: number, options?: RequestOptions) =>
	apiRequest<SaleBid>(`/sales/${encodeURIComponent(id)}/bids`, {
		...options,
		method: 'POST',
		body: { amount, bidderId: 'demo-user' }
	});
