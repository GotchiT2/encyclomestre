import { apiRequest, type RequestOptions } from './client';
import type {
	CardRecord,
	GuildWishlistShare,
	PaginatedResponse,
	WishlistAlert,
	WishlistEntry,
	WishlistPriority,
	WishlistQuery,
	WishlistRegistry,
	WishlistRegistrySummary
} from '$lib/types';
import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
import { toCardRecord, type WikiForgeCard, type WikiForgePage } from './wikiforge';

interface ApiWishlistEntry extends Omit<WishlistEntry, 'cardId' | 'card'> {
	cardId: string;
	card: WikiForgeCard;
}

interface ApiWishlistAlert {
	type: 'auction' | 'friend-owner';
	cardId: string;
	saleId?: string | null;
	price?: number | null;
	message: string;
}

interface ApiWishlistRegistry extends Omit<WishlistRegistry, 'cardIds' | 'cards'> {
	cardIds: string[];
	cards?: WikiForgeCard[];
	opportunityCount: number;
	shareToken?: string | null;
}

const toEntry = (entry: ApiWishlistEntry): WishlistEntry => ({
	...entry,
	cardId: entry.cardId,
	card: toCardRecord(entry.card)
});

const toRegistry = (registry: ApiWishlistRegistry): WishlistRegistrySummary => ({
	...registry,
	cardIds: registry.cardIds,
	cards: (registry.cards ?? []).map(toCardRecord)
});

export const getWishlist = async (
	_userId: string,
	{
		page = 1,
		pageSize = 12,
		query,
		priority,
		hasAlert,
		rarities,
		variant = 'all',
		sortBy = 'name',
		sortDirection = 'ASC'
	}: WishlistQuery = {},
	options?: RequestOptions
): Promise<PaginatedResponse<WishlistEntry>> => {
	const parameters = new URLSearchParams({
		page: String(Math.max(0, page - 1)),
		size: String(Math.min(100, Math.max(1, pageSize))),
		variant: variant === 'alternative' ? 'FULL_ART' : variant.toUpperCase(),
		hasAlert: String(Boolean(hasAlert)),
		sortBy,
		sortDirection
	});
	if (query?.trim()) parameters.set('q', query.trim());
	if (priority) parameters.set('priority', priority);
	rarities?.forEach((rarity) => parameters.append('rarity', cardRarityCodeByName[rarity]));
	const response = await apiRequest<WikiForgePage<ApiWishlistEntry>>(
		`/api/wishlist?${parameters}`,
		options
	);
	return {
		items: response.results.map(toEntry),
		meta: {
			page: response.page + 1,
			pageSize: response.size,
			total: response.nbResults,
			totalPages: Math.max(1, Math.ceil(response.nbResults / response.size))
		}
	};
};

export const getWishlistAlerts = async (
	_userId?: string,
	options?: RequestOptions
): Promise<WishlistAlert[]> =>
	(await apiRequest<ApiWishlistAlert[]>('/api/wishlist/alerts', options)).map((alert, index) => ({
		id: alert.saleId ?? `${alert.type}-${alert.cardId}-${index}`,
		cardId: alert.cardId,
		type: alert.type,
		context: alert.message,
		createdAt: ''
	}));

export const addWishlistEntry = async (_userId: string, cardId: string, options?: RequestOptions) =>
	toEntry(
		await apiRequest<ApiWishlistEntry>('/api/wishlist', {
			...options,
			method: 'POST',
			body: { cardId, priority: 'medium', note: null }
		})
	);

export const updateWishlistEntry = async (
	_userId: string,
	cardId: string,
	input: { priority?: WishlistPriority; note?: string | null },
	options?: RequestOptions
) =>
	toEntry(
		await apiRequest<ApiWishlistEntry>(`/api/wishlist/${encodeURIComponent(cardId)}`, {
			...options,
			method: 'PATCH',
			body: {
				cardId,
				priority: input.priority ?? 'medium',
				note: input.note ?? null
			}
		})
	);

export const removeWishlistEntry = (_userId: string, cardId: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/wishlist/${encodeURIComponent(cardId)}`, {
		...options,
		method: 'DELETE'
	});

export const getWishlists = async (
	_userId?: string,
	options?: RequestOptions
): Promise<WishlistRegistrySummary[]> =>
	(await apiRequest<ApiWishlistRegistry[]>('/api/wishlists', options)).map(toRegistry);

export const getWishlistRegistry = async (
	id: string,
	_userId?: string,
	options?: RequestOptions
): Promise<WishlistRegistry> =>
	toRegistry(
		await apiRequest<ApiWishlistRegistry>(`/api/wishlists/${encodeURIComponent(id)}`, options)
	);

export const getWishlistRegistryCards = async (
	id: string,
	options?: RequestOptions
): Promise<CardRecord[]> =>
	(
		await apiRequest<WikiForgeCard[]>(`/api/wishlists/${encodeURIComponent(id)}/cards`, options)
	).map(toCardRecord);

export const createWishlistRegistry = async (
	_userId: string,
	input: Pick<WishlistRegistry, 'title' | 'description'>,
	options?: RequestOptions
) =>
	toRegistry(
		await apiRequest<ApiWishlistRegistry>('/api/wishlists', {
			...options,
			method: 'POST',
			body: input
		})
	);

export const deleteWishlistRegistry = (id: string, _userId?: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/wishlists/${encodeURIComponent(id)}`, {
		...options,
		method: 'DELETE'
	});

export const addWishlistRegistryCard = async (
	id: string,
	_userId: string,
	cardId: string,
	options?: RequestOptions
) => {
	await apiRequest<void>(
		`/api/wishlists/${encodeURIComponent(id)}/cards?cardId=${encodeURIComponent(cardId)}`,
		{ ...options, method: 'POST' }
	);
};

export const removeWishlistRegistryCard = async (
	id: string,
	_userId: string,
	cardId: string,
	options?: RequestOptions
) => {
	await apiRequest<void>(
		`/api/wishlists/${encodeURIComponent(id)}/cards/${encodeURIComponent(cardId)}`,
		{ ...options, method: 'DELETE' }
	);
};

export const shareWishlistRegistry = async (
	id: string,
	_userId?: string,
	_target: 'link' | 'guild' = 'link',
	options?: RequestOptions
) => {
	void _target;
	const { token } = await apiRequest<{ token: string }>(
		`/api/wishlists/${encodeURIComponent(id)}/share`,
		{ ...options, method: 'POST' }
	);
	const base = typeof window === 'undefined' ? '' : window.location.origin;
	return { sealUrl: `${base}/wishlists?share=${encodeURIComponent(token)}` };
};

export const getGuildWishlistShares = async (
	options?: RequestOptions
): Promise<GuildWishlistShare[]> => {
	const guild = await apiRequest<{ id?: string }>('/api/guilds/me', options);
	if (!guild.id) return [];
	return apiRequest<GuildWishlistShare[]>(
		`/api/guilds/${encodeURIComponent(guild.id)}/wishlist-shares`,
		options
	);
};

export const importWishlistRegistryFromLink = async (
	_userId: string,
	sealUrl: string,
	options?: RequestOptions
) => {
	let token = sealUrl.trim();
	try {
		const url = new URL(
			sealUrl,
			typeof window === 'undefined' ? 'http://localhost' : window.location.origin
		);
		token = url.searchParams.get('share') ?? token;
	} catch {
		// La valeur brute peut déjà être le jeton attendu par l'API.
	}
	return toRegistry(
		await apiRequest<ApiWishlistRegistry>(
			`/api/wishlists/import?token=${encodeURIComponent(token)}`,
			{ ...options, method: 'POST' }
		)
	);
};
