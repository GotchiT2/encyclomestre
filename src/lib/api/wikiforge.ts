import { apiRequest, type RequestOptions } from './client';
import type { CardRecord, PaginatedResponse } from '$lib/types';

export interface WikiForgeCard {
	id: string | number;
	wikipediaTitle: string;
	imageUrl: string;
	rarity: string;
	category?: string;
	atk?: number;
	def?: number;
	qScore?: number;
	pageviews?: number;
	acquiredAt?: string;
	createdAt?: string;
	wikipediaUrl?: string;
	tags?: WikiForgeTag[];
}

export interface WikiForgePage<T> {
	results: T[];
	page: number;
	nbResults: number;
	size: number;
}

export interface WikiForgeQuery {
	q?: string;
	page?: number;
	size?: number;
	sortBy?: 'name' | 'rarity';
	sortDirection?: 'ASC' | 'DESC';
	rarities?: Array<'C' | 'PC' | 'R' | 'SR' | 'UR' | 'L' | 'KTD'>;
}

function queryPath(endpoint: '/api/cards' | '/api/collection', query: WikiForgeQuery) {
	const parameters = new URLSearchParams({
		page: String(Math.max(0, query.page ?? 0)),
		size: String(Math.min(100, Math.max(1, query.size ?? 50))),
		sortBy: query.sortBy ?? 'name',
		sortDirection: query.sortDirection ?? 'ASC'
	});
	if (query.q) parameters.set('q', query.q);
	query.rarities?.forEach((rarity) => parameters.append('rarity', rarity));
	return `${endpoint}?${parameters}`;
}

export const getWikiForgeCards = (query: WikiForgeQuery = {}, options?: RequestOptions) =>
	apiRequest<WikiForgePage<WikiForgeCard>>(queryPath('/api/cards', query), options);

export const getWikiForgeCollection = (query: WikiForgeQuery = {}, options?: RequestOptions) =>
	apiRequest<WikiForgePage<WikiForgeCard>>(queryPath('/api/collection', query), options);

export const getWikiForgeCard = (id: string | number, options?: RequestOptions) =>
	apiRequest<WikiForgeCard>(`/api/cards/${encodeURIComponent(id)}`, options);

export interface BoosterStatus {
	availableBoosters: number;
	maxBoosters?: number;
	nextBoosterAvailableAt: string | null;
}
export const getWikiForgeBoosterStatus = (options?: RequestOptions) =>
	apiRequest<BoosterStatus>('/api/boosters/status', options);
export const openWikiForgeBooster = (options?: RequestOptions) =>
	apiRequest<{ cards: WikiForgeCard[] }>('/api/boosters/open', { ...options, method: 'POST' });

export interface WikiForgeTag {
	id: string;
	name: string;
	color: string;
}
export const createWikiForgeTag = (input: Omit<WikiForgeTag, 'id'>, options?: RequestOptions) =>
	apiRequest<WikiForgeTag>('/api/tags', { ...options, method: 'POST', body: input });
export const updateWikiForgeTag = (
	id: string,
	input: Omit<WikiForgeTag, 'id'>,
	options?: RequestOptions
) => apiRequest<WikiForgeTag>(`/api/tags/${id}`, { ...options, method: 'PUT', body: input });
export const deleteWikiForgeTag = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/tags/${id}`, { ...options, method: 'DELETE' });
export const applyWikiForgeTag = (tagId: string, userCardIds: string[], options?: RequestOptions) =>
	apiRequest<void>('/api/collection/tags/apply', {
		...options,
		method: 'POST',
		body: { tagId, userCardIds }
	});
export const removeWikiForgeTag = (
	tagId: string,
	userCardIds: string[],
	options?: RequestOptions
) =>
	apiRequest<void>('/api/collection/tags/remove', {
		...options,
		method: 'POST',
		body: { tagId, userCardIds }
	});

export function toCardPage(source: WikiForgePage<WikiForgeCard>): PaginatedResponse<CardRecord> {
	const rarityMeta: Record<
		string,
		{ name: CardRecord['rarity']; initials: CardRecord['rarityInitials']; color: string }
	> = {
		C: { name: 'Commune', initials: 'C', color: '#d3e4f8' },
		PC: { name: 'Peu Commune', initials: 'PC', color: '#1d71cf' },
		R: { name: 'Rare', initials: 'R', color: '#5c1dcf' },
		SR: { name: 'Super-Rare', initials: 'SR', color: '#b41dcf' },
		UR: { name: 'Ultra-Rare', initials: 'UR', color: '#cf7d1d' },
		L: { name: 'Légendaire', initials: 'L', color: '#cf1d1d' },
		KTD: { name: 'KTD', initials: 'KTD', color: '#1dcf47' }
	};
	return {
		items: source.results.map((card) => {
			const rarity = rarityMeta[card.rarity] ?? rarityMeta.C;
			return {
				id: String(card.id),
				title: card.wikipediaTitle,
				shortDescription: card.category ?? '',
				longDescription: card.category ?? '',
				rarity: rarity.name,
				rarityInitials: rarity.initials,
				rarityColor: rarity.color,
				viewCount: card.pageviews ?? 0,
				imageUrl: card.imageUrl || '/card-placeholder.svg',
				wikipediaUrl: card.wikipediaUrl ?? '',
				attack: card.atk ?? 0,
				defense: card.def ?? 0,
				ownedCount: card.acquiredAt ? 1 : 0,
				globalSupply: 0,
				friendsWhoOwn: [],
				category: card.category,
				qScore: card.qScore,
				acquiredAt: card.acquiredAt,
				collectionTags: card.tags ?? []
			};
		}),
		meta: {
			page: source.page + 1,
			pageSize: source.size,
			total: source.nbResults,
			totalPages: Math.max(1, Math.ceil(source.nbResults / source.size))
		}
	};
}

export function toCardRecord(card: WikiForgeCard): CardRecord {
	return toCardPage({ results: [card], page: 0, nbResults: 1, size: 1 }).items[0];
}
