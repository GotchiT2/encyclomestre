import { apiRequest, type RequestOptions } from './client';
import type {
	GuildWishlistShare,
	PaginatedResponse,
	WishlistAlert,
	WishlistEntry,
	WishlistPriority,
	WishlistQuery,
	WishlistRegistry,
	WishlistRegistrySummary
} from '$lib/types';

interface ApiWishlistEntry extends Omit<WishlistEntry, 'cardId'> {
	cardId: number;
}

interface ApiWishlistAlert {
	type: 'auction' | 'friend-owner';
	cardId: number;
	saleId?: string | null;
	price?: number | null;
	message: string;
}

interface ApiWishlistRegistry extends Omit<WishlistRegistry, 'cardIds'> {
	cardIds: number[];
	opportunityCount: number;
	shareToken?: string | null;
}

const toEntry = (entry: ApiWishlistEntry): WishlistEntry => ({
	...entry,
	cardId: String(entry.cardId)
});

const toRegistry = (registry: ApiWishlistRegistry): WishlistRegistrySummary => ({
	...registry,
	cardIds: registry.cardIds.map(String)
});

export const getWishlist = async (
	_userId: string,
	{ page = 1, pageSize = 12, query, priority, hasAlert }: WishlistQuery = {},
	options?: RequestOptions
): Promise<PaginatedResponse<WishlistEntry>> => {
	const [rawEntries, alerts] = await Promise.all([
		apiRequest<ApiWishlistEntry[]>('/api/wishlist', options),
		hasAlert ? getWishlistAlerts('', options) : Promise.resolve([])
	]);
	const alertIds = new Set(alerts.map((alert) => alert.cardId));
	const normalizedQuery = query?.trim().toLocaleLowerCase('fr-FR');
	const entries = rawEntries.map(toEntry).filter((entry) => {
		return (
			(!priority || entry.priority === priority) &&
			(!hasAlert || alertIds.has(entry.cardId)) &&
			(!normalizedQuery || entry.note?.toLocaleLowerCase('fr-FR').includes(normalizedQuery))
		);
	});
	return {
		items: entries.slice((page - 1) * pageSize, page * pageSize),
		meta: {
			page,
			pageSize,
			total: entries.length,
			totalPages: Math.max(1, Math.ceil(entries.length / pageSize))
		}
	};
};

export const getWishlistAlerts = async (
	_userId?: string,
	options?: RequestOptions
): Promise<WishlistAlert[]> =>
	(await apiRequest<ApiWishlistAlert[]>('/api/wishlist/alerts', options)).map((alert, index) => ({
		id: alert.saleId ?? `${alert.type}-${alert.cardId}-${index}`,
		cardId: String(alert.cardId),
		type: alert.type,
		context: alert.message,
		createdAt: ''
	}));

export const addWishlistEntry = async (_userId: string, cardId: string, options?: RequestOptions) =>
	toEntry(
		await apiRequest<ApiWishlistEntry>('/api/wishlist', {
			...options,
			method: 'POST',
			body: { cardId: Number(cardId), priority: 'medium', note: null }
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
				cardId: Number(cardId),
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
