import type {
	CardRecord,
	CollectionBooleanFilter,
	CollectionSort,
	VariantDefinition
} from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toCardRecord, type WikiForgeCardDto } from './cards';
import { getVariants, standardVariant } from './variants';
import { wikiForgeNumericId } from './wikiforge-contract';

export type WikiForgeCollectionCardDto = WikiForgeCardDto;

export interface WikiForgeCollectionResponse {
	nbResults: number;
	page: number;
	sortBy: 'ACQUIRED_DATE' | 'NAME';
	sortDirection: 'ASC' | 'DESC';
	results?: WikiForgeCollectionCardDto[] | null;
	nextCursor: string | null;
	hasNext: boolean;
	q: string | null;
}

export interface CollectionQuery {
	query?: string;
	sortBy?: CollectionSort;
	variantIds?: number[];
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
}

export interface CollectionPosition {
	page: number;
	cursor: string | null;
}

const sortCode: Record<CollectionSort, WikiForgeCollectionResponse['sortBy']> = {
	acquiredDate: 'ACQUIRED_DATE',
	name: 'NAME'
};

export function collectionPath(query: CollectionQuery = {}, endpoint = '/collection'): string {
	const parameters = new URLSearchParams({ sortBy: sortCode[query.sortBy ?? 'acquiredDate'] });
	const text = query.query?.trim() ?? '';
	if (text.length >= 3) parameters.set('q', text);
	query.variantIds?.forEach((variantId) => parameters.append('variant', String(variantId)));
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
	const cursorPagination = (query.sortBy ?? 'acquiredDate') === 'acquiredDate' && text.length < 3;
	if (query.cursor && cursorPagination) parameters.set('cursor', query.cursor);
	else if ((query.page ?? 0) > 0) parameters.set('page', String(query.page));
	if (query.wishlistOwnerId) {
		parameters.set('wishlist', String(wikiForgeNumericId(query.wishlistOwnerId, 'wishlist')));
	}
	return `${endpoint}?${parameters}`;
}

export function nextCollectionPosition(
	response: Pick<WikiForgeCollectionResponse, 'hasNext' | 'nextCursor' | 'page'> &
		Partial<Pick<WikiForgeCollectionResponse, 'sortBy' | 'q'>>
): CollectionPosition | null {
	if (!response.hasNext) return null;
	return response.nextCursor &&
		(response.sortBy ?? 'ACQUIRED_DATE') === 'ACQUIRED_DATE' &&
		!response.q
		? { page: 0, cursor: response.nextCursor }
		: { page: response.page + 1, cursor: null };
}

export function toWikiForgeCollectionCard(
	card: WikiForgeCollectionCardDto,
	variants: VariantDefinition[] = [standardVariant]
): CardRecord {
	return toCardRecord(card, variants);
}

export async function getWikiForgeCollectionPage(
	query: CollectionQuery = {},
	options?: RequestOptions
): Promise<CollectionPageResult> {
	const [response, variants] = await Promise.all([
		apiRequest<WikiForgeCollectionResponse>(collectionPath(query), {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return {
		items: (response.results ?? []).map((card) => toWikiForgeCollectionCard(card, variants)),
		page: response.page,
		total: response.nbResults,
		hasNext: response.hasNext,
		nextCursor: response.nextCursor
	};
}

export const getCollection = (options?: RequestOptions) => getWikiForgeCollectionPage({}, options);

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

const wikiForgeCardBatch = (cardIds: string[]) => {
	const ids = [...new Set(cardIds)];
	if (!ids.length || ids.length > 500) throw new Error('1 à 500 cartes sont requises.');
	return ids.map((cardId) => wikiForgeNumericId(cardId, 'carte'));
};

export const protectWikiForgeCards = (cardIds: string[], options?: RequestOptions) =>
	apiRequest<void>('/collection/protect', {
		...options,
		apiTarget: 'wikiforge',
		method: 'PUT',
		body: wikiForgeCardBatch(cardIds)
	});

export const unprotectWikiForgeCards = (cardIds: string[], options?: RequestOptions) =>
	apiRequest<void>('/collection/unprotect', {
		...options,
		apiTarget: 'wikiforge',
		method: 'PUT',
		body: wikiForgeCardBatch(cardIds)
	});

export const getWikiForgeCollectionCard = async (cardId: string, options?: RequestOptions) => {
	const [card, variants] = await Promise.all([
		apiRequest<WikiForgeCollectionCardDto>(`/collection/${wikiForgeNumericId(cardId, 'carte')}`, {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return toWikiForgeCollectionCard(card, variants);
};

export const addWikiForgeCardTag = async (
	cardId: string,
	tagId: string,
	options?: RequestOptions
) => {
	const [card, variants] = await Promise.all([
		apiRequest<WikiForgeCollectionCardDto>(
			`/collection/${wikiForgeNumericId(cardId, 'carte')}/tags/${wikiForgeNumericId(tagId, 'tag')}`,
			{ ...options, apiTarget: 'wikiforge', method: 'PUT' }
		),
		getVariants(options)
	]);
	return toWikiForgeCollectionCard(card, variants);
};

export const removeWikiForgeCardTag = async (
	cardId: string,
	tagId: string,
	options?: RequestOptions
) => {
	const [card, variants] = await Promise.all([
		apiRequest<WikiForgeCollectionCardDto>(
			`/collection/${wikiForgeNumericId(cardId, 'carte')}/tags/${wikiForgeNumericId(tagId, 'tag')}`,
			{ ...options, apiTarget: 'wikiforge', method: 'DELETE' }
		),
		getVariants(options)
	]);
	return toWikiForgeCollectionCard(card, variants);
};
