import { env } from '$env/dynamic/public';
import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import type { CardRecord, PaginatedResponse } from '$lib/types';

export type WikiForgePublicPageRarity = CardRarityCode;

export interface WikiForgePublicPageCard {
	id: number;
	title: string;
	description?: string;
	image?: string;
	atk: number;
	length: number;
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
	sortBy: 'NAME' | 'RARITY';
	sortDirection: 'ASC' | 'DESC';
}

export interface WikiForgePublicPagesQuery {
	q?: string;
	page?: number;
	rarity?: WikiForgePublicPageRarity;
	sortBy?: 'name' | 'rarity';
	sortDirection?: 'ASC' | 'DESC';
}

export interface PublicPagesRequestOptions {
	fetch?: typeof fetch;
	signal?: AbortSignal;
}

const defaultPublicPagesApiBaseUrl = 'https://api.wikiforge.fr';
const publicPagesPageSize = 50;

function publicPagesApiUrl(path: string): string {
	const baseUrl = (env.PUBLIC_CARDS_API_BASE_URL ?? defaultPublicPagesApiBaseUrl).replace(
		/\/$/,
		''
	);
	return `${baseUrl}${path}`;
}

function publicPagesPath(query: WikiForgePublicPagesQuery): string {
	const parameters = new URLSearchParams({
		page: String(Math.max(0, query.page ?? 0)),
		sortBy: query.sortBy ?? 'rarity',
		sortDirection: query.sortDirection ?? 'ASC'
	});
	if (query.q?.trim()) parameters.set('q', query.q.trim());
	if (query.rarity) parameters.set('rarity', query.rarity);
	return `/pages?${parameters}`;
}

/**
 * Public catalogue source. It deliberately bypasses the authenticated local
 * WikiForge API: this is the future canonical source for global card search.
 */
export async function getWikiForgePublicPages(
	query: WikiForgePublicPagesQuery = {},
	options: PublicPagesRequestOptions = {}
): Promise<WikiForgePublicPagesResponse> {
	const response = await (options.fetch ?? fetch)(publicPagesApiUrl(publicPagesPath(query)), {
		headers: { accept: 'application/json' },
		credentials: 'omit',
		signal: options.signal
	});
	if (!response.ok) throw new Error(`Erreur API catalogue (${response.status})`);
	return response.json() as Promise<WikiForgePublicPagesResponse>;
}

export function toPublicPageCardRecord(card: WikiForgePublicPageCard): CardRecord {
	const rarity = cardRarityByCode[card.rarity] ?? cardRarityByCode.C;
	const imageName = card.image?.trim();
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
		imageUrl: imageName
			? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}?width=600`
			: '/card-placeholder.svg',
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

export function toPublicPage(source: WikiForgePublicPagesResponse): PaginatedResponse<CardRecord> {
	return {
		items: source.results.map(toPublicPageCardRecord),
		meta: {
			page: source.page + 1,
			pageSize: publicPagesPageSize,
			total: source.nbResults,
			totalPages: Math.max(1, Math.ceil(source.nbResults / publicPagesPageSize))
		}
	};
}
