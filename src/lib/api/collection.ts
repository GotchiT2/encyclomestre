import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import type { CardRecord, CollectionBooleanFilter, CollectionSort } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { wikiForgeImageUrl } from './pages';
import { getWikiForgeVariantCopies, toCollectionCardRecord } from './wikiforge';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

export interface WikiForgeCollectionCardDto {
	id: number;
	pageId: number;
	title: string;
	description?: string;
	image?: string;
	nsfw?: boolean;
	rarity: CardRarityCode;
	atk?: number;
	alt?: boolean;
	duplicate?: boolean;
	protected?: boolean;
	tagIds?: number[];
	acquiredDate?: string;
	creationDate?: string;
	pendingTradeId?: number | null;
	ownedCount?: number;
	rarityCounts?: Partial<Record<CardRarityCode, number>>;
}

export interface WikiForgeCollectionResponse {
	nbResults: number;
	page: number;
	sortBy: 'ACQUIRED_DATE' | 'RARITY' | 'NAME';
	sortDirection: 'ASC' | 'DESC';
	results?: WikiForgeCollectionCardDto[] | null;
	nextCursor: string | null;
	hasNext: boolean;
	rarityResults?: Partial<Record<CardRarityCode, number>> | null;
	q: string | null;
}

export interface CollectionQuery {
	query?: string;
	sortBy?: CollectionSort;
	rarities?: CardRarityCode[];
	tagIds?: string[];
	duplicate?: CollectionBooleanFilter;
	protected?: CollectionBooleanFilter;
	page?: number;
	cursor?: string;
	wishlistOwnerId?: string;
}

export interface CollectionPageResult {
	items: CardRecord[];
	page: number;
	total: number;
	hasNext: boolean;
	nextCursor: string | null;
	rarityResults: Partial<Record<CardRarityCode, number>> | null;
}

export interface CollectionPosition {
	page: number;
	cursor: string | null;
}

const sortCode: Record<CollectionSort, WikiForgeCollectionResponse['sortBy']> = {
	acquiredDate: 'ACQUIRED_DATE',
	rarity: 'RARITY',
	name: 'NAME'
};

export function collectionPath(query: CollectionQuery = {}, endpoint = '/collection'): string {
	const parameters = new URLSearchParams({ sortBy: sortCode[query.sortBy ?? 'acquiredDate'] });
	const text = query.query?.trim() ?? '';
	if (text.length >= 3) parameters.set('q', text);
	query.rarities?.forEach((rarity) => parameters.append('rarity', rarity));
	const tagIds = query.tagIds?.includes('-1') ? ['-1'] : (query.tagIds ?? []);
	tagIds.forEach((tagId) =>
		parameters.append('tags', tagId === '-1' ? '-1' : String(wikiForgeNumericId(tagId, 'tag')))
	);
	if (query.duplicate && query.duplicate !== 'all') {
		parameters.set('duplicate', String(query.duplicate === 'yes'));
	}
	if (query.protected && query.protected !== 'all') {
		parameters.set('protected', String(query.protected === 'yes'));
	}
	if (query.cursor) parameters.set('cursor', query.cursor);
	else if ((query.page ?? 0) > 0) parameters.set('page', String(query.page));
	if (query.wishlistOwnerId) {
		parameters.set('wishlist', String(wikiForgeNumericId(query.wishlistOwnerId, 'wishlist')));
	}
	return `${endpoint}?${parameters}`;
}

export function nextCollectionPosition(
	response: Pick<WikiForgeCollectionResponse, 'hasNext' | 'nextCursor' | 'page'>
): CollectionPosition | null {
	if (!response.hasNext) return null;
	return response.nextCursor
		? { page: 0, cursor: response.nextCursor }
		: { page: response.page + 1, cursor: null };
}

export function toWikiForgeCollectionCard(card: WikiForgeCollectionCardDto): CardRecord {
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
		ownedCount: card.ownedCount ?? 1,
		rarityCounts: card.rarityCounts,
		globalSupply: 0,
		friendsWhoOwn: [],
		isFullArt: Boolean(card.alt),
		acquiredAt: card.acquiredDate ? wikiForgeUtcDate(card.acquiredDate).toISOString() : undefined,
		collectionTagIds: (card.tagIds ?? []).map(String),
		duplicate: Boolean(card.duplicate),
		userProtected: Boolean(card.protected),
		pendingTradeId: card.pendingTradeId == null ? null : String(card.pendingTradeId),
		nsfw: Boolean(card.nsfw)
	};
}

export async function getWikiForgeCollectionPage(
	query: CollectionQuery = {},
	options?: RequestOptions
): Promise<CollectionPageResult> {
	const response = await apiRequest<WikiForgeCollectionResponse>(collectionPath(query), {
		...options,
		apiTarget: 'wikiforge'
	});
	return {
		items: (response.results ?? []).map(toWikiForgeCollectionCard),
		page: response.page,
		total: response.nbResults,
		hasNext: response.hasNext,
		nextCursor: response.nextCursor,
		rarityResults: response.rarityResults ?? null
	};
}

export const getCollection = (options?: RequestOptions) => getWikiForgeCollectionPage({}, options);

export const getVariantCopies = async (variantId: string, options?: RequestOptions) =>
	(await getWikiForgeVariantCopies(variantId, options)).map(toCollectionCardRecord);

export const protectWikiForgeCard = (cardId: string, options?: RequestOptions) =>
	apiRequest<void>(`/collection/${wikiForgeNumericId(cardId, 'carte')}/protect`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'PUT'
	});

export const unprotectWikiForgeCard = (cardId: string, options?: RequestOptions) =>
	apiRequest<void>(`/collection/${wikiForgeNumericId(cardId, 'carte')}/unprotect`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'PUT'
	});

export const addWikiForgeCardTag = (cardId: string, tagId: string, options?: RequestOptions) =>
	apiRequest<WikiForgeCollectionCardDto>(
		`/collection/${wikiForgeNumericId(cardId, 'carte')}/tags/${wikiForgeNumericId(tagId, 'tag')}`,
		{ ...options, apiTarget: 'wikiforge', method: 'PUT' }
	).then(toWikiForgeCollectionCard);

export const removeWikiForgeCardTag = (cardId: string, tagId: string, options?: RequestOptions) =>
	apiRequest<WikiForgeCollectionCardDto>(
		`/collection/${wikiForgeNumericId(cardId, 'carte')}/tags/${wikiForgeNumericId(tagId, 'tag')}`,
		{ ...options, apiTarget: 'wikiforge', method: 'DELETE' }
	).then(toWikiForgeCollectionCard);
