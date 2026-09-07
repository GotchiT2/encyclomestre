import { apiRequest, type RequestOptions } from './client';
import type {
	CardRecord,
	CardVariantCode,
	CollectionTag,
	GuildMember,
	GuildSummary,
	PaginatedResponse,
	ActiveSaleSummary,
	ProfileVisibility
} from '$lib/types';
import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';

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

interface WikiForgeTagDto {
	id: number;
	name: string;
	color: string;
	visibility?: ProfileVisibility;
}

const toCollectionTag = (tag: WikiForgeTagDto): CollectionTag => ({
	id: String(tag.id),
	name: tag.name,
	color: tag.color,
	...(tag.visibility ? { visibility: tag.visibility } : {})
});
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
type WikiForgeTagInput = Pick<CollectionTag, 'name' | 'color'> & { visibility: ProfileVisibility };
export const createWikiForgeTag = async (input: WikiForgeTagInput, options?: RequestOptions) =>
	toCollectionTag(
		await apiRequest<WikiForgeTagDto>('/tags', {
			...tagOptions(options),
			method: 'POST',
			body: input
		})
	);
export const updateWikiForgeTag = (
	id: string,
	input: WikiForgeTagInput,
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
	apiRequest<import('./collection').WikiForgeCollectionCardDto[]>(
		`/collection/tags/${numericWikiForgeId(tagId)}`,
		{
			...tagOptions(options),
			method: 'PUT',
			body: userCardIds.map(numericWikiForgeId)
		}
	).then((cards) =>
		Promise.all([import('./collection')]).then(([module]) =>
			cards.map(module.toWikiForgeCollectionCard)
		)
	);
export const removeWikiForgeTag = (
	tagId: string,
	userCardIds: string[],
	options?: RequestOptions
) =>
	apiRequest<import('./collection').WikiForgeCollectionCardDto[]>(
		`/collection/tags/${numericWikiForgeId(tagId)}`,
		{
			...tagOptions(options),
			method: 'DELETE',
			body: userCardIds.map(numericWikiForgeId)
		}
	).then((cards) =>
		Promise.all([import('./collection')]).then(([module]) =>
			cards.map(module.toWikiForgeCollectionCard)
		)
	);

export const getMyGuild = (options?: RequestOptions) =>
	apiRequest<GuildSummary | Record<string, never>>('/me/guild', { ...options, apiTarget: 'wikiforge' });
export const getGuildMembers = (id: string, options?: RequestOptions) =>
	apiRequest<GuildMember[]>(`/guilds/${encodeURIComponent(id)}/members`, { ...options, apiTarget: 'wikiforge' });
export const getWikiForgeGuildWishlistShares = <T = unknown>(
	id: string,
	options?: RequestOptions
) => apiRequest<T[]>(`/guilds/${encodeURIComponent(id)}/wishlists`, { ...options, apiTarget: 'wikiforge' });

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
