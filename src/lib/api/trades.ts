import { apiRequest, type RequestOptions } from './client';
import { toWikiForgeCollectionCard, type WikiForgeCollectionCardDto } from './collection';
import type {
	CreateTradeOfferInput,
	TradeCardDetail,
	TradeCardSide,
	TradeOffer,
	TradeOfferStatus,
	TradeParticipant
} from '$lib/types';
import type { VariantDefinition } from '$lib/types';
import { getVariants } from './variants';
import { wikiForgeApiErrorCode, wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

interface WikiForgeTradeParticipantDto {
	id: number;
	name: string;
	image?: string | null;
}

interface WikiForgeTradeCardDto {
	card: WikiForgeCollectionCardDto;
	status?: 'ADDED' | 'REMOVED' | null;
}

interface WikiForgeTradeDto {
	id: number;
	status: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
	message?: string | null;
	expiresAt?: string | null;
	creationDate: string;
	modificationDate: string;
	initiator: WikiForgeTradeParticipantDto;
	recipient: WikiForgeTradeParticipantDto;
	offered?: WikiForgeTradeCardDto[] | null;
	requested?: WikiForgeTradeCardDto[] | null;
	offeredMoney?: number;
	requestedMoney?: number;
	originalOfferedMoney?: number;
	originalRequestedMoney?: number;
}

interface WikiForgeTradesDto {
	received?: WikiForgeTradeDto[] | null;
	sent?: WikiForgeTradeDto[] | null;
	done?: WikiForgeTradeDto[] | null;
}

export interface TradeRegistry {
	received: TradeOffer[];
	sent: TradeOffer[];
	done: TradeOffer[];
}

const statusByApi: Record<WikiForgeTradeDto['status'], TradeOfferStatus> = {
	PENDING: 'pending',
	COUNTERED: 'countered',
	ACCEPTED: 'accepted',
	DECLINED: 'declined',
	CANCELLED: 'cancelled',
	EXPIRED: 'expired'
};

function toParticipant(user: WikiForgeTradeParticipantDto): TradeParticipant {
	return {
		id: String(user.id),
		username: user.name,
		displayName: user.name,
		avatarUrl: user.image?.trim() || null
	};
}

function toTradeCardDetail(
	entry: WikiForgeTradeCardDto,
	side: TradeCardSide,
	variants: VariantDefinition[]
): TradeCardDetail {
	return {
		userCardId: String(entry.card.id),
		side,
		status:
			entry.status === 'REMOVED' ? 'removed' : entry.status === 'ADDED' ? 'added' : 'unchanged',
		card: toWikiForgeCollectionCard(entry.card, variants)
	};
}

function toTradeOffer(offer: WikiForgeTradeDto, variants: VariantDefinition[]): TradeOffer {
	const offered = (offer.offered ?? []).map((entry) =>
		toTradeCardDetail(entry, 'offered', variants)
	);
	const requested = (offer.requested ?? []).map((entry) =>
		toTradeCardDetail(entry, 'requested', variants)
	);
	return {
		id: String(offer.id),
		initiatorId: String(offer.initiator.id),
		recipientId: String(offer.recipient.id),
		initiator: toParticipant(offer.initiator),
		recipient: toParticipant(offer.recipient),
		offeredCardIds: offered
			.filter((entry) => entry.status !== 'removed')
			.map((entry) => entry.userCardId),
		requestedCardIds: requested
			.filter((entry) => entry.status !== 'removed')
			.map((entry) => entry.userCardId),
		offeredMoney: offer.offeredMoney ?? 0,
		requestedMoney: offer.requestedMoney ?? 0,
		originalOfferedMoney: offer.originalOfferedMoney ?? offer.offeredMoney ?? 0,
		originalRequestedMoney: offer.originalRequestedMoney ?? offer.requestedMoney ?? 0,
		cards: [...offered, ...requested],
		message: offer.message?.trim() || undefined,
		status: statusByApi[offer.status],
		expiresAt: offer.expiresAt ? wikiForgeUtcDate(offer.expiresAt).toISOString() : null,
		createdAt: wikiForgeUtcDate(offer.creationDate).toISOString(),
		updatedAt: wikiForgeUtcDate(offer.modificationDate).toISOString()
	};
}

const wikiForgeOptions = (options?: RequestOptions): RequestOptions => ({
	...options,
	apiTarget: 'wikiforge'
});

export async function getTradeRegistry(
	done = 20,
	options?: RequestOptions
): Promise<TradeRegistry> {
	const safeDone = Math.max(0, Math.trunc(done));
	const [response, variants] = await Promise.all([
		apiRequest<WikiForgeTradesDto>(`/trades?done=${safeDone}`, {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return {
		received: (response.received ?? []).map((offer) => toTradeOffer(offer, variants)),
		sent: (response.sent ?? []).map((offer) => toTradeOffer(offer, variants)),
		done: (response.done ?? []).map((offer) => toTradeOffer(offer, variants))
	};
}

export const getReceivedTradeOffers = async (options?: RequestOptions) =>
	(await getTradeRegistry(20, options)).received;

export const getSentTradeOffers = async (options?: RequestOptions) =>
	(await getTradeRegistry(20, options)).sent;

export const getTradeHistory = async (options?: RequestOptions) =>
	(await getTradeRegistry(20, options)).done;

export const getTradeOffers = async (_userId?: string, options?: RequestOptions) => {
	const registry = await getTradeRegistry(20, options);
	return [...registry.received, ...registry.sent, ...registry.done];
};

export const getTradeOffer = async (id: string, options?: RequestOptions) => {
	const [offer, variants] = await Promise.all([
		apiRequest<WikiForgeTradeDto>(
			`/trades/${wikiForgeNumericId(id, 'échange')}`,
			wikiForgeOptions(options)
		),
		getVariants(options)
	]);
	return toTradeOffer(offer, variants);
};

export const getTradeCards = async (
	id: string,
	options?: RequestOptions
): Promise<TradeCardDetail[]> => (await getTradeOffer(id, options)).cards ?? [];

function tradeBody(input: CreateTradeOfferInput, includeRecipient: boolean) {
	return {
		...(includeRecipient
			? { recipientId: wikiForgeNumericId(input.recipientId, 'utilisateur') }
			: {}),
		message: input.message?.trim() || '',
		offeredCardIds: input.offeredCardIds.slice(0, 20).map((id) => wikiForgeNumericId(id, 'carte')),
		requestedCardIds: input.requestedCardIds
			.slice(0, 20)
			.map((id) => wikiForgeNumericId(id, 'carte')),
		offeredMoney: Math.max(0, Math.trunc(input.offeredMoney ?? 0)),
		requestedMoney: Math.max(0, Math.trunc(input.requestedMoney ?? 0))
	};
}

async function tradeMutation(
	path: string,
	options?: RequestOptions,
	body?: unknown
): Promise<TradeOffer> {
	const response = await apiRequest<WikiForgeTradeDto | undefined>(path, {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST',
		...(body === undefined ? {} : { body })
	});
	if (response) return toTradeOffer(response, await getVariants(options));
	if (path === '/trades') {
		throw new Error('La création de l’échange n’a renvoyé aucun détail.');
	}
	const id = path.split('/')[2];
	return getTradeOffer(id, options);
}

export const createTradeOffer = async (input: CreateTradeOfferInput, options?: RequestOptions) =>
	tradeMutation('/trades', options, tradeBody(input, true));

export const respondToTradeOffer = async (
	id: string,
	status: 'accepted' | 'declined',
	options?: RequestOptions
) =>
	tradeMutation(
		`/trades/${wikiForgeNumericId(id, 'échange')}/${status === 'accepted' ? 'accept' : 'decline'}`,
		options
	);

export const cancelTradeOffer = async (id: string, options?: RequestOptions) =>
	tradeMutation(`/trades/${wikiForgeNumericId(id, 'échange')}/cancel`, options);

export const counterTradeOffer = async (
	id: string,
	input: CreateTradeOfferInput,
	options?: RequestOptions
) =>
	tradeMutation(
		`/trades/${wikiForgeNumericId(id, 'échange')}/counter`,
		options,
		tradeBody(input, false)
	);

export async function acceptTradeOfferWithRetry(id: string, options?: RequestOptions) {
	try {
		return await respondToTradeOffer(id, 'accepted', options);
	} catch (error) {
		if (wikiForgeApiErrorCode(error) !== 'TRADE_CONFLICT') throw error;
		return respondToTradeOffer(id, 'accepted', options);
	}
}
