import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import { cardSearchSortDirection, defaultCardSearchSort } from '$lib/domain/cards/search';
import type { CardRecord, CardSearchSort, PaginatedResponse } from '$lib/types';
import { apiRequest } from './client';

export type WikiForgePublicPageRarity = CardRarityCode;

export interface WikiForgePublicPageCard {
	id: number;
	title: string;
	description?: string;
	image?: string;
	atk: number;
	length?: number;
	viewCount: number;
	rarity: WikiForgePublicPageRarity;
	createdAt: string;
	globalCount: number;
}

export interface WikiForgePublicPagesResponse {
	nbResults: number;
	page: number;
	rarityResults: Record<WikiForgePublicPageRarity, number>;
	results: WikiForgePublicPageCard[];
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

const publicPagesPageSize = 50;

export function wikiForgeImageUrl(image?: string | null): string {
	const imageName = image?.trim();
	return imageName
		? `https://fr.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}?width=250`
		: '/card-placeholder.svg';
}

function publicPagesPath(query: WikiForgePublicPagesQuery): string {
	const sortBy = defaultCardSearchSort(query.q, query.sortBy);
	const parameters = new URLSearchParams({
		page: String(Math.max(0, query.page ?? 0)),
		sortBy: sortBy.toUpperCase(),
		sortDirection:
			query.sortDirection ?? (query.q?.trim() ? cardSearchSortDirection(sortBy) : 'ASC')
	});
	if (query.q?.trim()) parameters.set('q', query.q.trim());
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
	return apiRequest<WikiForgePublicPageCard>(`/pages/${encodeURIComponent(String(id))}`, {
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
		ownedCount: 0,
		globalSupply: card.globalCount,
		friendsWhoOwn: [],
		isFullArt: false,
		acquiredAt: card.createdAt
	};
}

export function toPublicPage(source: WikiForgePublicPagesResponse): PublicCataloguePage {
	return {
		items: source.results.map(toPublicPageCardRecord),
		rarityResults: source.rarityResults,
		meta: {
			page: source.page + 1,
			pageSize: publicPagesPageSize,
			total: source.nbResults,
			totalPages: Math.max(1, Math.ceil(source.nbResults / publicPagesPageSize))
		}
	};
}
