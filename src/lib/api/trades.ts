import { apiRequest, type RequestOptions } from './client';
import type { CreateTradeOfferInput, TradeOffer } from '$lib/types';

interface ApiTradeOffer {
	id: string;
	initiatorId: string;
	recipientId: string;
	status: TradeOffer['status'];
	offeredUserCardIds: string[];
	requestedUserCardIds: string[];
	offeredCredits: number;
	requestedCredits: number;
	createdAt: string;
}

const toTradeOffer = (offer: ApiTradeOffer): TradeOffer => ({
	id: offer.id,
	initiatorId: offer.initiatorId,
	recipientId: offer.recipientId,
	offeredCardIds: offer.offeredUserCardIds,
	requestedCardIds: offer.requestedUserCardIds,
	offeredCredits: offer.offeredCredits,
	requestedCredits: offer.requestedCredits,
	status: offer.status,
	createdAt: offer.createdAt,
	updatedAt: offer.createdAt
});

const getTradeOfferGroup = async (path: string, options?: RequestOptions) =>
	(await apiRequest<ApiTradeOffer[]>(path, options)).map(toTradeOffer);

export const getReceivedTradeOffers = async (options?: RequestOptions) =>
	getTradeOfferGroup('/api/trades/received', options);

export const getSentTradeOffers = async (options?: RequestOptions) =>
	getTradeOfferGroup('/api/trades/sended', options);

export const getTradeHistory = async (options?: RequestOptions) =>
	getTradeOfferGroup('/api/trades/history', options);

export const getTradeOffers = async (_userId?: string, options?: RequestOptions) => {
	const [received, sent, history] = await Promise.all([
		getReceivedTradeOffers(options),
		getSentTradeOffers(options),
		getTradeHistory(options)
	]);
	return [...received, ...sent, ...history];
};

export const createTradeOffer = async (input: CreateTradeOfferInput, options?: RequestOptions) =>
	toTradeOffer(
		await apiRequest<ApiTradeOffer>('/api/trades', {
			...options,
			method: 'POST',
			body: {
				recipientId: input.recipientId,
				offeredUserCardIds: input.offeredCardIds,
				requestedUserCardIds: input.requestedCardIds,
				offeredCredits: input.offeredCredits ?? 0,
				requestedCredits: input.requestedCredits ?? 0
			}
		})
	);

export const respondToTradeOffer = async (
	id: string,
	status: Extract<TradeOffer['status'], 'accepted' | 'rejected'>,
	options?: RequestOptions
) =>
	toTradeOffer(
		await apiRequest<ApiTradeOffer>(`/api/trades/${encodeURIComponent(id)}`, {
			...options,
			method: 'PATCH',
			body: { status }
		})
	);

export const cancelTradeOffer = async (id: string, options?: RequestOptions) =>
	toTradeOffer(
		await apiRequest<ApiTradeOffer>(`/api/trades/${encodeURIComponent(id)}`, {
			...options,
			method: 'PATCH',
			body: { status: 'cancelled' }
		})
	);
