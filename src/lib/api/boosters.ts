import { apiRequest, type RequestOptions } from './client';
import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import type { BoosterInventory, BoosterOpenResult, CardRecord } from '$lib/types';
import { wikiForgeImageUrl } from '$lib/api/pages';

export interface BoosterCardDto {
	id: number;
	pageId: number;
	title: string;
	description?: string | null;
	image?: string | null;
	rarity: CardRarityCode;
	atk?: number | null;
	alt?: boolean;
	duplicate?: boolean;
	protected?: boolean;
	tagIds?: number[] | null;
	acquiredDate?: string | null;
	creationDate?: string | null;
	pendingTradeId?: number | null;
}

export interface BoostersDto {
	available: number;
	max: number;
	nextAvailableAt: string | null;
}

export interface OpenedBoostersDto extends BoostersDto {
	cards: BoosterCardDto[];
}

export function toBoosterCardRecord(card: BoosterCardDto): CardRecord {
	const rarity = cardRarityByCode[card.rarity] ?? cardRarityByCode.C;
	return {
		id: String(card.id),
		catalogueId: String(card.pageId),
		baseCardId: card.pageId,
		variant: card.alt ? 'FULL_ART' : 'NORMAL',
		title: card.title,
		shortDescription: card.description ?? '',
		longDescription: card.description ?? '',
		rarity: rarity.name,
		rarityInitials: rarity.initials,
		rarityColor: rarity.color,
		viewCount: 0,
		imageUrl: wikiForgeImageUrl(card.image),
		wikipediaUrl: `https://fr.wikipedia.org/?curid=${card.pageId}`,
		attack: card.atk ?? 0,
		defense: 0,
		ownedCount: 1,
		globalSupply: 0,
		friendsWhoOwn: [],
		isFullArt: Boolean(card.alt),
		acquiredAt: card.acquiredDate ?? undefined,
		collectionTagIds: (card.tagIds ?? []).map(String),
		duplicate: Boolean(card.duplicate),
		userProtected: Boolean(card.protected),
		pendingTradeId: card.pendingTradeId == null ? null : String(card.pendingTradeId)
	};
}

function toBoosterInventory(source: BoostersDto): BoosterInventory {
	return {
		available: source.available,
		capacity: source.max,
		nextRechargeAt: source.nextAvailableAt
	};
}

export const getBoosterInventory = async (
	_userId?: string,
	options?: RequestOptions
): Promise<BoosterInventory> =>
	toBoosterInventory(
		await apiRequest<BoostersDto>('/boosters', { ...options, apiTarget: 'wikiforge' })
	);

export const openBooster = async (
	_userId?: string,
	options?: RequestOptions
): Promise<BoosterOpenResult> => {
	const response = await apiRequest<OpenedBoostersDto>('/boosters/open', {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST'
	});
	return {
		pulls: response.cards.map((card) => ({
			card: toBoosterCardRecord(card),
			ownedBefore: 0,
			ownedAfter: 1
		})),
		inventory: toBoosterInventory(response)
	};
};
