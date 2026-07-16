import { apiRequest, type RequestOptions } from './client';
import { toCardRecord, type WikiForgeCard } from './wikiforge';
import type {
	CreateTradeOfferInput,
	TradeCardDetail,
	TradeCardSide,
	TradeOffer,
	TradeParticipant
} from '$lib/types';

interface ApiTradeParticipant {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string | null;
}

interface ApiTradeOffer {
	id: string;
	initiatorId: string;
	recipientId: string;
	initiator?: ApiTradeParticipant;
	recipient?: ApiTradeParticipant;
	status: TradeOffer['status'];
	offeredUserCardIds: string[];
	requestedUserCardIds: string[];
	offeredCredits: number;
	requestedCredits: number;
	createdAt: string;
}

interface ApiTradeCardDetail {
	userCardId: string;
	side: TradeCardSide;
	card: WikiForgeCard;
}

const fallbackParticipant = (id: string): TradeParticipant => ({
	id,
	username: id,
	displayName: id
});

const toTradeOffer = (offer: ApiTradeOffer): TradeOffer => ({
	id: offer.id,
	initiatorId: offer.initiatorId,
	recipientId: offer.recipientId,
	initiator: offer.initiator ?? fallbackParticipant(offer.initiatorId),
	recipient: offer.recipient ?? fallbackParticipant(offer.recipientId),
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

export const getTradeCards = async (
	id: string,
	options?: RequestOptions
): Promise<TradeCardDetail[]> =>
	(
		await apiRequest<ApiTradeCardDetail[]>(`/api/trades/${encodeURIComponent(id)}/cards`, options)
	).map((entry) => {
		const card = toCardRecord(entry.card);
		return {
			userCardId: entry.userCardId,
			side: entry.side,
			card: { ...card, id: entry.userCardId, catalogueId: card.id }
		};
	});

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
