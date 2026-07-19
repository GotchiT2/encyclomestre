import { apiRequest, type RequestOptions } from './client';
import { getWikiForgeCard, getWikiForgeCards, toCardPage, toCardRecord } from './wikiforge';
import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
import type {
	CardPriceHistory,
	CardRarity,
	CardRecord,
	CardVariant,
	CardWishlistReference,
	FriendOwnerInfo
} from '$lib/types';

export interface CardQuery {
	page?: number;
	pageSize?: number;
	query?: string;
	rarity?: CardRarity;
	rarities?: CardRarity[];
	sortBy?: 'name' | 'rarity';
	sortDirection?: 'ASC' | 'DESC';
	variant?: CardVariant;
}

export const getCards = async (
	{
		page = 1,
		pageSize = 12,
		query,
		rarity,
		rarities,
		sortBy = 'name',
		sortDirection = 'ASC',
		variant = 'all'
	}: CardQuery = {},
	options?: RequestOptions
) => {
	const responsePage = toCardPage(
		await getWikiForgeCards(
			{
				page: Math.max(0, page - 1),
				size: pageSize,
				q: query,
				rarities: (rarities ?? (rarity ? [rarity] : [])).map(
					(value) => cardRarityCodeByName[value]
				),
				sortBy,
				sortDirection,
				variant
			},
			options
		)
	);
	return {
		...responsePage,
		items: await hydrateCardSocialStates(responsePage.items, options)
	};
};

const cardRequestCache = new Map<string, Promise<CardRecord>>();

export const getCard = async (id: string, options?: RequestOptions): Promise<CardRecord> => {
	if (options) {
		const [card] = await hydrateCardSocialStates(
			[toCardRecord(await getWikiForgeCard(id, options))],
			options
		);
		return card;
	}
	const cached = cardRequestCache.get(id);
	if (cached) return cached;
	const request = getWikiForgeCard(id)
		.then(toCardRecord)
		.then(async (card) => (await hydrateCardSocialStates([card]))[0])
		.catch((error) => {
			cardRequestCache.delete(id);
			throw error;
		});
	cardRequestCache.set(id, request);
	return request;
};

interface ApiCardSocialState {
	cardId: string;
	ownedCount: number;
	wishlists: CardWishlistReference[];
	owners: Array<{
		userId: string;
		username: string;
		avatarUrl: string | null;
		ownedCount: number;
	}>;
}

export const getCardSocialStates = async (cardIds: string[], options?: RequestOptions) => {
	const uniqueIds = [...new Set(cardIds)].slice(0, 100);
	if (!uniqueIds.length) return new Map<string, ApiCardSocialState>();
	const states = await apiRequest<ApiCardSocialState[]>('/api/cards/social-states', {
		...options,
		method: 'POST',
		body: { cardIds: uniqueIds }
	});
	return new Map(states.map((state) => [state.cardId, state]));
};

export const hydrateCardSocialStates = async (cards: CardRecord[], options?: RequestOptions) => {
	const states = await getCardSocialStates(
		cards.map((card) => card.catalogueId ?? card.id),
		options
	);
	return cards.map((card) => {
		const state = states.get(card.catalogueId ?? card.id);
		if (!state) return card;
		return {
			...card,
			ownedCount: state.ownedCount,
			wishlistMemberships: state.wishlists,
			friendsWhoOwn: state.owners.map((owner): FriendOwnerInfo => ({
				friendId: owner.userId,
				username: owner.username,
				avatarUrl: owner.avatarUrl ?? '',
				ownedCount: owner.ownedCount
			}))
		};
	});
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
