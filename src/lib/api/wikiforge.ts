import { apiRequest, type RequestOptions } from './client';
import type {
	CardRecord,
	CollectionTag,
	DashboardData,
	GuildMember,
	GuildObjective,
	GuildSummary,
	PaginatedResponse
} from '$lib/types';

export type WikiForgeRarity = 'C' | 'PC' | 'R' | 'SR' | 'UR' | 'L' | 'KTD';

export interface WikiForgeCard {
	id: string | number;
	wikipediaTitle: string;
	shortDescription?: string;
	longDescription?: string;
	imageUrl: string;
	rarity: string;
	isFullArt?: boolean;
	category?: string;
	atk?: number;
	def?: number;
	qScore?: number;
	pageviews?: number;
	globalSupply?: number;
	acquiredAt?: string;
	createdAt?: string;
	wikipediaUrl?: string;
}

export interface WikiForgeCollectionCard {
	userCardId: string;
	cardId: string | number;
	acquiredAt: string;
	tags: CollectionTag[];
	card: WikiForgeCard;
}

export interface WikiForgePage<T> {
	results: T[];
	page: number;
	nbResults: number;
	size: number;
	sortBy?: string;
	sortDirection?: string;
	filters?: Record<string, unknown>;
	q?: string | null;
}

export interface WikiForgeQuery {
	q?: string;
	page?: number;
	size?: number;
	sortBy?: 'name' | 'rarity';
	sortDirection?: 'ASC' | 'DESC';
	rarities?: WikiForgeRarity[];
	tagIds?: string[];
	untagged?: boolean;
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
	query.tagIds?.forEach((tagId) => parameters.append('tag', tagId));
	if (query.untagged) parameters.set('untagged', 'true');
	return `${endpoint}?${parameters}`;
}

export const getWikiForgeCards = (query: WikiForgeQuery = {}, options?: RequestOptions) =>
	apiRequest<WikiForgePage<WikiForgeCard>>(queryPath('/api/cards', query), options);

export const getWikiForgeCollection = (query: WikiForgeQuery = {}, options?: RequestOptions) =>
	apiRequest<WikiForgePage<WikiForgeCollectionCard>>(queryPath('/api/collection', query), options);

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
	apiRequest<{ cards: WikiForgeCollectionCard[] }>('/api/boosters/open', {
		...options,
		method: 'POST'
	});

export interface WikiForgeTag {
	id: string;
	name: string;
	color: string;
}

export const getWikiForgeTags = (options?: RequestOptions) =>
	apiRequest<WikiForgeTag[]>('/api/tags', options);
export const createWikiForgeTag = (input: Omit<WikiForgeTag, 'id'>, options?: RequestOptions) =>
	apiRequest<WikiForgeTag>('/api/tags', { ...options, method: 'POST', body: input });
export const updateWikiForgeTag = (
	id: string,
	input: Omit<WikiForgeTag, 'id'>,
	options?: RequestOptions
) =>
	apiRequest<WikiForgeTag>(`/api/tags/${encodeURIComponent(id)}`, {
		...options,
		method: 'PUT',
		body: input
	});
export const deleteWikiForgeTag = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/tags/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
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

interface DashboardResponse extends Omit<DashboardData, 'recentAcquisitions'> {
	recentAcquisitions: Array<{
		userCardId: string;
		cardId: number;
		rarity: string;
		acquiredAt: string;
		wikipediaTitle: string;
		imageUrl: string;
	}>;
}

export const getDashboard = async (options?: RequestOptions): Promise<DashboardData> => {
	const response = await apiRequest<DashboardResponse>('/api/dashboard', options);
	return {
		...response,
		recentAcquisitions: response.recentAcquisitions.map((item) =>
			toCardRecord({
				id: item.userCardId,
				wikipediaTitle: item.wikipediaTitle,
				imageUrl: item.imageUrl,
				rarity: item.rarity,
				acquiredAt: item.acquiredAt
			})
		)
	};
};

export const getMyGuild = (options?: RequestOptions) =>
	apiRequest<GuildSummary | Record<string, never>>('/api/guilds/me', options);
export const getGuildMembers = (id: string, options?: RequestOptions) =>
	apiRequest<GuildMember[]>(`/api/guilds/${encodeURIComponent(id)}/members`, options);
export const getGuildObjective = (id: string, options?: RequestOptions) =>
	apiRequest<GuildObjective>(`/api/guilds/${encodeURIComponent(id)}/objective`, options);
export const getWikiForgeGuildWishlistShares = <T = unknown>(
	id: string,
	options?: RequestOptions
) => apiRequest<T[]>(`/api/guilds/${encodeURIComponent(id)}/wishlist-shares`, options);

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

export function toCardRecord(card: WikiForgeCard): CardRecord {
	const rarity = rarityMeta[card.rarity] ?? rarityMeta.C;
	return {
		id: String(card.id),
		title: card.wikipediaTitle,
		shortDescription: card.shortDescription ?? card.category ?? '',
		longDescription: card.longDescription ?? card.shortDescription ?? card.category ?? '',
		rarity: rarity.name,
		rarityInitials: rarity.initials,
		rarityColor: rarity.color,
		viewCount: card.pageviews ?? 0,
		imageUrl: card.imageUrl || '/card-placeholder.svg',
		wikipediaUrl: card.wikipediaUrl ?? '',
		attack: card.atk ?? 0,
		defense: card.def ?? 0,
		ownedCount: card.acquiredAt ? 1 : 0,
		globalSupply: card.globalSupply ?? 0,
		friendsWhoOwn: [],
		isFullArt: card.isFullArt ?? false,
		category: card.category,
		qScore: card.qScore,
		acquiredAt: card.acquiredAt
	};
}

export function toCollectionCardRecord(item: WikiForgeCollectionCard): CardRecord {
	return {
		...toCardRecord({ ...item.card, id: item.userCardId, acquiredAt: item.acquiredAt }),
		catalogueId: String(item.cardId),
		collectionTags: item.tags ?? []
	};
}

export function toCardPage(source: WikiForgePage<WikiForgeCard>): PaginatedResponse<CardRecord> {
	return toFrontendPage(source, source.results.map(toCardRecord));
}

export function toCollectionPage(
	source: WikiForgePage<WikiForgeCollectionCard>
): PaginatedResponse<CardRecord> {
	return toFrontendPage(source, source.results.map(toCollectionCardRecord));
}

function toFrontendPage<T>(source: WikiForgePage<unknown>, items: T[]): PaginatedResponse<T> {
	return {
		items,
		meta: {
			page: source.page + 1,
			pageSize: source.size,
			total: source.nbResults,
			totalPages: Math.max(1, Math.ceil(source.nbResults / source.size))
		}
	};
}
