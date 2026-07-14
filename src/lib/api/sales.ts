import { apiRequest, type RequestOptions } from './client';
import { getCard } from './cards';
import { getUser } from './users';
import type { SaleBid, SaleListing } from '$lib/types';
import type { WikiForgePage } from './wikiforge';

interface ApiSale extends Omit<SaleListing, 'cardId'> {
	cardId: number;
}

interface ApiBid {
	id: string;
	bidderId: string;
	amount: number;
	createdAt: string;
}

const toSale = (sale: ApiSale): SaleListing => ({ ...sale, cardId: String(sale.cardId) });
const toBid = (saleId: string, bid: ApiBid): SaleBid => ({
	...bid,
	saleId,
	bidderName: bid.bidderId
});

export const getSales = async (sellerId: string, options?: RequestOptions) =>
	getMarketListings({ sellerId }, options);

export const getCardSales = async (cardId: string, options?: RequestOptions) =>
	(await getMarketListings({ query: (await getCard(cardId, options)).title }, options)).filter(
		(sale) => sale.cardId === cardId
	);

export const getMarketListings = async (
	input: {
		query?: string;
		type?: SaleListing['type'];
		maxPrice?: number;
		sellerId?: string;
		bidderId?: string;
	} = {},
	options?: RequestOptions
) => {
	const parameters = new URLSearchParams({ page: '0', size: '100' });
	if (input.query) parameters.set('q', input.query);
	if (input.type) parameters.set('type', input.type);
	if (input.maxPrice) parameters.set('maxPrice', String(input.maxPrice));
	if (input.sellerId) parameters.set('sellerId', input.sellerId);
	if (input.bidderId) parameters.set('bidderId', input.bidderId);
	const response = await apiRequest<WikiForgePage<ApiSale>>(`/api/sales?${parameters}`, options);
	return response.results.map(toSale);
};

export const getSale = async (id: string, options?: RequestOptions) =>
	toSale(await apiRequest<ApiSale>(`/api/sales/${encodeURIComponent(id)}`, options));

export const getSaleBids = async (id: string, options?: RequestOptions) => {
	const bids = await apiRequest<ApiBid[]>(`/api/sales/${encodeURIComponent(id)}/bids`, options);
	return Promise.all(
		bids.map(async (bid) => {
			const mapped = toBid(id, bid);
			const bidder = await getUser(bid.bidderId, options).catch(() => null);
			return { ...mapped, bidderName: bidder?.username ?? mapped.bidderName };
		})
	);
};

export const placeBid = async (id: string, amount: number, options?: RequestOptions) =>
	toBid(
		id,
		await apiRequest<ApiBid>(`/api/sales/${encodeURIComponent(id)}/bids`, {
			...options,
			method: 'POST',
			body: { amount }
		})
	);

export const getSaleFavorites = async (options?: RequestOptions) =>
	(await apiRequest<ApiSale[]>('/api/users/me/sale-favorites', options)).map(toSale);

export const addSaleFavorite = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/users/me/sale-favorites/${encodeURIComponent(id)}`, {
		...options,
		method: 'PUT'
	});

export const removeSaleFavorite = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/users/me/sale-favorites/${encodeURIComponent(id)}`, {
		...options,
		method: 'DELETE'
	});
