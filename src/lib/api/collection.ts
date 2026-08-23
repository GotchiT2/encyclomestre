import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import type { CardRecord, CollectionBooleanFilter, CollectionSort } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { wikiForgeImageUrl } from './pages';
import { getWikiForgeVariantCopies, toCollectionCardRecord } from './wikiforge';

export interface WikiForgeCollectionCardDto {
	id: number;
	pageId: number;
	title: string;
	description?: string;
	image?: string;
	rarity: CardRarityCode;
	atk?: number;
	alt?: boolean;
	duplicate?: boolean;
	protected?: boolean;
	tagIds?: number[];
	acquiredDate?: string;
	creationDate?: string;
	pendingTradeId?: number | null;
}

export interface WikiForgeCollectionResponse {
	nbResults: number;
	page: number;
	sortBy: 'ACQUIRED_DATE' | 'RARITY' | 'NAME';
	sortDirection: 'ASC' | 'DESC';
	results?: WikiForgeCollectionCardDto[] | null;
	nextCursor: string | null;
	hasNext: boolean;
	rarityResults: Partial<Record<CardRarityCode, number>> | null;
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

function numericId(value: string): number {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0)
		throw new Error(`Identifiant WikiForge invalide: ${value}`);
	return id;
}

export function collectionPath(query: CollectionQuery = {}): string {
	const parameters = new URLSearchParams({ sortBy: sortCode[query.sortBy ?? 'acquiredDate'] });
	const text = query.query?.trim() ?? '';
	if (text.length >= 3) parameters.set('q', text);
	query.rarities?.forEach((rarity) => parameters.append('rarity', rarity));
	query.tagIds?.forEach((tagId) => parameters.append('tags', String(numericId(tagId))));
	if (query.duplicate && query.duplicate !== 'all') {
		parameters.set('duplicate', String(query.duplicate === 'yes'));
	}
	if (query.protected && query.protected !== 'all') {
		parameters.set('protected', String(query.protected === 'yes'));
	}
	if (query.cursor) parameters.set('cursor', query.cursor);
	else if ((query.page ?? 0) > 0) parameters.set('page', String(query.page));
	return `/collection?${parameters}`;
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
		ownedCount: 1,
		globalSupply: 0,
		friendsWhoOwn: [],
		isFullArt: Boolean(card.alt),
		acquiredAt: card.acquiredDate,
		collectionTagIds: (card.tagIds ?? []).map(String),
		duplicate: Boolean(card.duplicate),
		userProtected: Boolean(card.protected),
		pendingTradeId: card.pendingTradeId == null ? null : String(card.pendingTradeId)
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
		rarityResults: response.rarityResults
	};
}

export const getCollection = (options?: RequestOptions) => getWikiForgeCollectionPage({}, options);

export const getVariantCopies = async (variantId: string, options?: RequestOptions) =>
	(await getWikiForgeVariantCopies(variantId, options)).map(toCollectionCardRecord);

export const protectWikiForgeCard = (cardId: string, options?: RequestOptions) =>
	apiRequest<void>(`/collection/${numericId(cardId)}/protect`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'PUT'
	});

export const unprotectWikiForgeCard = (cardId: string, options?: RequestOptions) =>
	apiRequest<void>(`/collection/${numericId(cardId)}/unprotect`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'PUT'
	});

export const addWikiForgeCardTag = (cardId: string, tagId: string, options?: RequestOptions) =>
	apiRequest<WikiForgeCollectionCardDto>(
		`/collection/${numericId(cardId)}/tags/${numericId(tagId)}`,
		{ ...options, apiTarget: 'wikiforge', method: 'PUT' }
	);

export const removeWikiForgeCardTag = (cardId: string, tagId: string, options?: RequestOptions) =>
	apiRequest<WikiForgeCollectionCardDto>(
		`/collection/${numericId(cardId)}/tags/${numericId(tagId)}`,
		{ ...options, apiTarget: 'wikiforge', method: 'DELETE' }
	);
