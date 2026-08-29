import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import { cardSearchSortDirection, defaultCardSearchSort } from '$lib/domain/cards/search';
import type { CardRecord, CardSearchSort, PaginatedResponse } from '$lib/types';
import { apiRequest } from './client';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

export type WikiForgePublicPageRarity = CardRarityCode;

export interface WikiForgePublicPageCard {
	id: number;
	title: string;
	description?: string;
	image?: string;
	nsfw?: boolean;
	atk: number;
	length?: number;
	viewCount: number;
	rarity: WikiForgePublicPageRarity;
	createdAt: string;
	globalCount: number;
	ownedCount?: number;
}

export interface WikiForgePublicPagesResponse {
	nbResults: number;
	page: number;
	rarityResults?: Record<WikiForgePublicPageRarity, number> | null;
	results?: WikiForgePublicPageCard[] | null;
	sortBy: 'NAME' | 'RARITY' | 'RELEVANCE';
	sortDirection: 'ASC' | 'DESC';
}

export interface WikiForgePublicPagesQuery {
	q?: string;
	page?: number;
	rarity?: WikiForgePublicPageRarity;
	rarities?: WikiForgePublicPageRarity[];
	sortBy?: CardSearchSort;
	sortDirection?: 'ASC' | 'DESC';
}

export interface PublicPagesRequestOptions {
	fetch?: typeof fetch;
	signal?: AbortSignal;
}

export interface PublicCataloguePage extends PaginatedResponse<CardRecord> {
	rarityResults: Record<WikiForgePublicPageRarity, number>;
}

let publicPagesPageSize: number | null = null;
const emptyRarityResults: Record<WikiForgePublicPageRarity, number> = {
	L: 0,
	UR: 0,
	SR: 0,
	R: 0,
	PC: 0,
	C: 0
};

export function wikiForgeImageUrl(image?: string | null): string {
	return image?.trim() || '/card-placeholder.svg';
}

function publicPagesPath(query: WikiForgePublicPagesQuery): string {
	const sortBy = defaultCardSearchSort(query.q, query.sortBy);
	const parameters = new URLSearchParams({
		page: String(Math.max(0, query.page ?? 0)),
		sortBy: sortBy.toUpperCase(),
		sortDirection:
			query.sortDirection ?? (query.q?.trim() ? cardSearchSortDirection(sortBy) : 'ASC')
	});
	if ((query.q?.trim().length ?? 0) >= 3) parameters.set('q', query.q!.trim());
	for (const rarity of query.rarities ?? (query.rarity ? [query.rarity] : [])) {
		parameters.append('rarity', rarity);
	}
	return `/pages?${parameters}`;
}

/** Canonical WikiForge catalogue source. */
export async function getWikiForgePublicPages(
	query: WikiForgePublicPagesQuery = {},
	options: PublicPagesRequestOptions = {}
): Promise<WikiForgePublicPagesResponse> {
	return apiRequest<WikiForgePublicPagesResponse>(publicPagesPath(query), {
		fetch: options.fetch,
		signal: options.signal,
		apiTarget: 'wikiforge'
	});
}

/**
 * Public card detail source. The API returns the same card shape as an item
 * from the paginated catalogue, so both views share one display mapping.
 */
export async function getWikiForgePublicPage(
	id: string | number,
	options: PublicPagesRequestOptions = {}
): Promise<WikiForgePublicPageCard> {
	return apiRequest<WikiForgePublicPageCard>(`/pages/${wikiForgeNumericId(id, 'page')}`, {
		fetch: options.fetch,
		signal: options.signal,
		apiTarget: 'wikiforge'
	});
}

export function toPublicPageCardRecord(card: WikiForgePublicPageCard): CardRecord {
	const rarity = cardRarityByCode[card.rarity] ?? cardRarityByCode.C;
	return {
		id: String(card.id),
		baseCardId: card.id,
		variant: 'NORMAL',
		title: card.title,
		shortDescription: card.description ?? '',
		longDescription: card.description ?? '',
		rarity: rarity.name,
		rarityInitials: rarity.initials,
		rarityColor: rarity.color,
		viewCount: card.viewCount,
		imageUrl: wikiForgeImageUrl(card.image),
		wikipediaUrl: `https://fr.wikipedia.org/?curid=${card.id}`,
		attack: card.atk,
		defense: 0,
		ownedCount: card.ownedCount ?? 0,
		globalSupply: card.globalCount,
		friendsWhoOwn: [],
		isFullArt: false,
		acquiredAt: wikiForgeUtcDate(card.createdAt).toISOString(),
		nsfw: Boolean(card.nsfw)
	};
}

export function toPublicPage(source: WikiForgePublicPagesResponse): PublicCataloguePage {
	const resultCount = source.results?.length ?? 0;
	if (source.page === 0 && resultCount > 0) publicPagesPageSize = resultCount;
	const pageSize = publicPagesPageSize ?? Math.max(1, resultCount || source.nbResults || 1);
	return {
		items: (source.results ?? []).map(toPublicPageCardRecord),
		rarityResults: source.rarityResults ?? emptyRarityResults,
		meta: {
			page: source.page + 1,
			pageSize,
			total: source.nbResults,
			totalPages: Math.max(1, Math.ceil(source.nbResults / pageSize))
		}
	};
}
