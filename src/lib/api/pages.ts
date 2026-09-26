import { cardSearchSortDirection, defaultCardSearchSort } from '$lib/domain/cards/search';
import type { CardRecord, CardSearchSort, PaginatedResponse, VariantDefinition } from '$lib/types';
import { apiRequest } from './client';
import { wikiForgeImageUrl } from './cards';
import { defaultPageVariant, getVariants, standardVariant } from './variants';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

export interface WikiForgePublicPageCard {
	id: number;
	title: string;
	description?: string;
	image?: string;
	nsfw?: boolean;
	atk: number;
	length?: number;
	defaultVariantId?: number;
	createdAt?: string;
	/** Champ utilisé par les versions récentes du DTO WikiForge. */
	creationDate?: string;
	globalCount: number;
	ownedCount?: number;
	friends?: Array<{
		id: number;
		name: string;
		nbCards: number;
	}>;
	_variants?: VariantDefinition[];
}

export interface WikiForgePublicPagesResponse {
	nbResults: number;
	page: number;
	results?: WikiForgePublicPageCard[] | null;
	sortBy: 'NAME' | 'RELEVANCE';
	sortDirection: 'ASC' | 'DESC';
	_variants?: VariantDefinition[];
}

export interface WikiForgePublicPagesQuery {
	q?: string;
	page?: number;
	sortBy?: CardSearchSort;
	sortDirection?: 'ASC' | 'DESC';
}

export interface PublicPagesRequestOptions {
	fetch?: typeof fetch;
	signal?: AbortSignal;
}

export type PublicCataloguePage = PaginatedResponse<CardRecord>;

let publicPagesPageSize: number | null = null;
export { wikiForgeImageUrl } from './cards';

function publicPageDate(card: WikiForgePublicPageCard): string | undefined {
	const value = [card.createdAt, card.creationDate].find(
		(candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0
	);
	if (!value) return undefined;
	const date = wikiForgeUtcDate(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
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
	return `/pages?${parameters}`;
}

/** Canonical WikiForge catalogue source. */
export async function getWikiForgePublicPages(
	query: WikiForgePublicPagesQuery = {},
	options: PublicPagesRequestOptions = {}
): Promise<WikiForgePublicPagesResponse> {
	const [response, variants] = await Promise.all([
		apiRequest<WikiForgePublicPagesResponse>(publicPagesPath(query), {
			fetch: options.fetch,
			signal: options.signal,
			apiTarget: 'wikiforge'
		}),
		getVariants({ fetch: options.fetch, signal: options.signal })
	]);
	return { ...response, _variants: variants };
}

/**
 * Public card detail source. The API returns the same card shape as an item
 * from the paginated catalogue, so both views share one display mapping.
 */
export async function getWikiForgePublicPage(
	id: string | number,
	options: PublicPagesRequestOptions = {}
): Promise<WikiForgePublicPageCard> {
	const [card, variants] = await Promise.all([
		apiRequest<WikiForgePublicPageCard>(`/pages/${wikiForgeNumericId(id, 'page')}`, {
			fetch: options.fetch,
			signal: options.signal,
			apiTarget: 'wikiforge'
		}),
		getVariants({ fetch: options.fetch, signal: options.signal })
	]);
	return { ...card, _variants: variants };
}

export function toPublicPageCardRecord(
	card: WikiForgePublicPageCard,
	variants: VariantDefinition[] = card._variants ?? [standardVariant]
): CardRecord {
	const variant = defaultPageVariant(variants, card.defaultVariantId);
	const acquiredAt = publicPageDate(card);
	// Les données sociales sont optionnelles pendant la migration API : une valeur
	// incomplète ne doit jamais empêcher le rendu de toute la page catalogue.
	const friends = Array.isArray(card.friends) ? card.friends : [];
	return {
		id: String(card.id),
		baseCardId: card.id,
		variantId: variant.id,
		variant,
		title: card.title,
		shortDescription: card.description ?? '',
		longDescription: card.description ?? '',
		imageUrl: wikiForgeImageUrl(card.image),
		wikipediaUrl: `https://fr.wikipedia.org/?curid=${card.id}`,
		attack: card.atk,
		defense: 0,
		ownedCount: card.ownedCount ?? 0,
		globalSupply: card.globalCount,
		friendsWhoOwn: friends.map((friend) => {
			return {
				friendId: String(friend.id),
				username: friend.name,
				avatarUrl: '',
				ownedCount: friend.nbCards
			};
		}),
		...(acquiredAt ? { acquiredAt } : {}),
		nsfw: Boolean(card.nsfw)
	};
}

export function toPublicPage(source: WikiForgePublicPagesResponse): PublicCataloguePage {
	const resultCount = source.results?.length ?? 0;
	if (source.page === 0 && resultCount > 0) publicPagesPageSize = resultCount;
	const pageSize = publicPagesPageSize ?? Math.max(1, resultCount || source.nbResults || 1);
	return {
		items: (source.results ?? []).map((card) =>
			toPublicPageCardRecord(card, source._variants ?? [standardVariant])
		),
		meta: {
			page: source.page + 1,
			pageSize,
			total: source.nbResults,
			totalPages: Math.max(1, Math.ceil(source.nbResults / pageSize))
		}
	};
}
