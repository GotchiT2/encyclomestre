import { apiRequest, type RequestOptions } from './client';
import { getCard, hydrateCardSocialStates } from './cards';
import { getUser } from './users';
import type { CreateSaleInput, SaleBid, SaleListing } from '$lib/types';
import { toCardRecord, type WikiForgeCard, type WikiForgePage } from './wikiforge';

interface ApiSale extends Omit<SaleListing, 'cardId' | 'card'> {
	cardId: string;
	card: WikiForgeCard;
}

interface ApiBid {
	id: string;
	bidderId: string;
	amount: number;
	createdAt: string;
}

const toSale = (sale: ApiSale): SaleListing => ({
	...sale,
	cardId: sale.cardId,
	card: toCardRecord(sale.card)
});
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
		sellerId?: string;
		bidderId?: string;
	} = {},
	options?: RequestOptions
) => {
	const parameters = new URLSearchParams({ page: '0', size: '100' });
	if (input.query) parameters.set('q', input.query);
	if (input.sellerId) parameters.set('sellerId', input.sellerId);
	if (input.bidderId) parameters.set('bidderId', input.bidderId);
	const response = await apiRequest<WikiForgePage<ApiSale>>(`/api/sales?${parameters}`, options);
	const sales = (response.results ?? []).map(toSale);
	const cards = await hydrateCardSocialStates(
		sales.flatMap((sale) => (sale.card ? [sale.card] : [])),
		options
	);
	const cardsById = new Map(cards.map((card) => [card.id, card]));
	return sales.map((sale) => ({ ...sale, card: cardsById.get(sale.cardId) ?? sale.card }));
};

export const getSale = async (id: string, options?: RequestOptions) => {
	const sale = toSale(await apiRequest<ApiSale>(`/api/sales/${encodeURIComponent(id)}`, options));
	if (!sale.card) return sale;
	const [card] = await hydrateCardSocialStates([sale.card], options);
	return { ...sale, card };
};

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

export const createSale = (input: CreateSaleInput, options?: RequestOptions) =>
	apiRequest<ApiSale>('/api/sales', {
		...options,
		method: 'POST',
		body: input
	}).then(toSale);

export const withdrawSale = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/sales/${encodeURIComponent(id)}`, {
		...options,
		method: 'DELETE'
	});

export const purchaseSale = (id: string, options?: RequestOptions) =>
	apiRequest<ApiSale>(`/api/sales/${encodeURIComponent(id)}/purchase`, {
		...options,
		method: 'POST'
	}).then(toSale);

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
