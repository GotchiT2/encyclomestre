import { apiRequest, type RequestOptions } from './client';
import type {
	CardRecord,
	CardSearchSort,
	CardVariant,
	CardVariantCode,
	CollectionTag,
	DashboardData,
	GuildMember,
	GuildObjective,
	GuildSummary,
	PaginatedResponse,
	SaleState,
	ActiveSaleSummary
} from '$lib/types';
import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import { cardSearchSortDirection, defaultCardSearchSort } from '$lib/domain/cards/search';

export type WikiForgeRarity = CardRarityCode;

export interface WikiForgeCard {
	id: string;
	baseCardId?: number;
	variant: CardVariantCode;
	wikipediaTitle: string;
	shortDescription?: string;
	longDescription?: string;
	imageUrl: string;
	rarity: string;
	isFullArt: boolean;
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
	cardId: string;
	acquiredAt: string;
	tags: CollectionTag[];
	card: WikiForgeCard;
	activeSale?: ActiveSaleSummary | null;
}

export interface WikiForgePage<T> {
	results?: T[] | null;
	page: number;
	nbResults: number;
	size?: number;
	nextCursor?: string | null;
	sortBy?: string;
	sortDirection?: string;
	filters?: Record<string, unknown>;
	q?: string | null;
}

export interface WikiForgeQuery {
	q?: string;
	page?: number;
	size?: number;
	sortBy?: CardSearchSort;
	sortDirection?: 'ASC' | 'DESC';
	cursor?: string;
	rarities?: WikiForgeRarity[];
	tagIds?: string[];
	untagged?: boolean;
	variant?: CardVariant;
	saleState?: SaleState;
}

const apiVariantByFilter: Record<CardVariant, 'ALL' | CardVariantCode> = {
	all: 'ALL',
	normal: 'NORMAL',
	alternative: 'FULL_ART'
};

function queryPath(endpoint: '/api/cards' | '/api/collection', query: WikiForgeQuery) {
	const sortBy = defaultCardSearchSort(query.q, query.sortBy, 'name');
	const parameters = new URLSearchParams({
		page: String(Math.max(0, query.page ?? 0)),
		size: String(Math.min(100, Math.max(1, query.size ?? 50))),
		sortBy: sortBy.toUpperCase(),
		sortDirection: query.sortDirection ?? cardSearchSortDirection(sortBy)
	});
	if (query.q) parameters.set('q', query.q);
	if (query.cursor) parameters.set('cursor', query.cursor);
	parameters.set('variant', apiVariantByFilter[query.variant ?? 'all']);
	query.rarities?.forEach((rarity) => parameters.append('rarity', rarity));
	query.tagIds?.forEach((tagId) => parameters.append('tag', tagId));
	if (query.untagged) parameters.set('untagged', 'true');
	if (endpoint === '/api/collection') parameters.set('saleState', query.saleState ?? 'ALL');
	return `${endpoint}?${parameters}`;
}

export const getWikiForgeCards = (query: WikiForgeQuery = {}, options?: RequestOptions) =>
	apiRequest<WikiForgePage<WikiForgeCard>>(queryPath('/api/cards', query), options);

export const getWikiForgeCollection = (query: WikiForgeQuery = {}, options?: RequestOptions) =>
	apiRequest<WikiForgePage<WikiForgeCollectionCard>>(queryPath('/api/collection', query), options);

export const getWikiForgeVariantCopies = (variantId: string, options?: RequestOptions) =>
	apiRequest<WikiForgeCollectionCard[]>(
		`/api/collection/variants/${encodeURIComponent(variantId)}/copies`,
		options
	);

export const getWikiForgeCard = (id: string, options?: RequestOptions) =>
	apiRequest<WikiForgeCard>(`/api/cards/${encodeURIComponent(id)}`, options);

interface WikiForgeTagDto {
	id: number;
	name: string;
	color: string;
}

const toCollectionTag = (tag: WikiForgeTagDto): CollectionTag => ({ ...tag, id: String(tag.id) });
const tagOptions = (options?: RequestOptions): RequestOptions => ({
	...options,
	apiTarget: 'wikiforge'
});
const numericWikiForgeId = (value: string) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0)
		throw new Error(`Identifiant WikiForge invalide: ${value}`);
	return id;
};

export const getWikiForgeTags = async (options?: RequestOptions) =>
	(await apiRequest<WikiForgeTagDto[]>('/tags', tagOptions(options))).map(toCollectionTag);
export const createWikiForgeTag = async (
	input: Omit<CollectionTag, 'id'>,
	options?: RequestOptions
) =>
	toCollectionTag(
		await apiRequest<WikiForgeTagDto>('/tags', {
			...tagOptions(options),
			method: 'POST',
			body: input
		})
	);
export const updateWikiForgeTag = (
	id: string,
	input: Omit<CollectionTag, 'id'>,
	options?: RequestOptions
) =>
	apiRequest<WikiForgeTagDto>(`/tags/${numericWikiForgeId(id)}`, {
		...tagOptions(options),
		method: 'PATCH',
		body: input
	}).then(toCollectionTag);
export const deleteWikiForgeTag = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/tags/${numericWikiForgeId(id)}`, { ...tagOptions(options), method: 'DELETE' });
export const applyWikiForgeTag = (tagId: string, userCardIds: string[], options?: RequestOptions) =>
	apiRequest<unknown[]>(`/collection/tags/${numericWikiForgeId(tagId)}`, {
		...tagOptions(options),
		method: 'PUT',
		body: userCardIds.map(numericWikiForgeId)
	});
export const removeWikiForgeTag = (
	tagId: string,
	userCardIds: string[],
	options?: RequestOptions
) =>
	apiRequest<unknown[]>(`/collection/tags/${numericWikiForgeId(tagId)}`, {
		...tagOptions(options),
		method: 'DELETE',
		body: userCardIds.map(numericWikiForgeId)
	});

interface DashboardResponse extends Omit<DashboardData, 'recentAcquisitions'> {
	recentAcquisitions: Array<{
		userCardId: string;
		cardId: string;
		variant: CardVariantCode;
		isFullArt: boolean;
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
				id: item.cardId,
				variant: item.variant,
				isFullArt: item.isFullArt,
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

export function toCardRecord(card: WikiForgeCard): CardRecord {
	const rarity = cardRarityByCode[card.rarity as CardRarityCode] ?? cardRarityByCode.C;
	return {
		id: String(card.id),
		baseCardId: card.baseCardId,
		variant: card.variant,
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
		isFullArt: card.isFullArt,
		category: card.category,
		qScore: card.qScore,
		acquiredAt: card.acquiredAt
	};
}

export function toCollectionCardRecord(item: WikiForgeCollectionCard): CardRecord {
	return {
		...toCardRecord({ ...item.card, id: item.userCardId, acquiredAt: item.acquiredAt }),
		catalogueId: String(item.cardId),
		collectionTags: item.tags ?? [],
		activeSale: item.activeSale ?? null
	};
}

export function toCardPage(source: WikiForgePage<WikiForgeCard>): PaginatedResponse<CardRecord> {
	return toFrontendPage(source, (source.results ?? []).map(toCardRecord));
}

export function toCollectionPage(
	source: WikiForgePage<WikiForgeCollectionCard>
): PaginatedResponse<CardRecord> {
	return toFrontendPage(source, (source.results ?? []).map(toCollectionCardRecord));
}

function toFrontendPage<T>(source: WikiForgePage<unknown>, items: T[]): PaginatedResponse<T> {
	const pageSize = Math.max(1, source.size ?? (source.results?.length || 50));
	return {
		items,
		meta: {
			page: source.page + 1,
			pageSize,
			total: source.nbResults,
			totalPages: Math.max(1, Math.ceil(source.nbResults / pageSize)),
			...(source.nextCursor === undefined ? {} : { nextCursor: source.nextCursor })
		}
	};
}
