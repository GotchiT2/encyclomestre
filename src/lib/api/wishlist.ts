import { apiRequest, type RequestOptions } from './client';
import type {
	PaginatedResponse,
	WishlistAlert,
	WishlistEntry,
	WishlistPriority,
	WishlistQuery,
	GuildWishlistShare,
	WishlistRegistry,
	WishlistRegistrySummary
} from '$lib/types';

export const getWishlist = (
	userId: string,
	{ page = 1, pageSize = 12, query, priority, hasAlert }: WishlistQuery = {},
	options?: RequestOptions
) => {
	const parameters = new URLSearchParams({
		userId,
		page: String(page),
		pageSize: String(pageSize)
	});
	if (query) parameters.set('q', query);
	if (priority) parameters.set('priority', priority);
	if (hasAlert) parameters.set('hasAlert', 'true');
	return apiRequest<PaginatedResponse<WishlistEntry>>(`/wishlist?${parameters}`, options);
};
export const getWishlistAlerts = (userId: string, options?: RequestOptions) =>
	apiRequest<WishlistAlert[]>(`/wishlist/alerts?userId=${encodeURIComponent(userId)}`, options);
export const addWishlistEntry = (userId: string, cardId: string, options?: RequestOptions) =>
	apiRequest<WishlistEntry>('/wishlist', { ...options, method: 'POST', body: { userId, cardId } });
export const updateWishlistEntry = (
	userId: string,
	cardId: string,
	input: { priority?: WishlistPriority; note?: string | null },
	options?: RequestOptions
) =>
	apiRequest<WishlistEntry>(
		`/wishlist/${encodeURIComponent(cardId)}?userId=${encodeURIComponent(userId)}`,
		{ ...options, method: 'PATCH', body: input }
	);
export const removeWishlistEntry = (userId: string, cardId: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlist/${encodeURIComponent(cardId)}?userId=${encodeURIComponent(userId)}`, {
		...options,
		method: 'DELETE'
	});

export const getWishlists = (userId: string, options?: RequestOptions) =>
	apiRequest<WishlistRegistrySummary[]>(`/wishlists?userId=${encodeURIComponent(userId)}`, options);

export const getWishlistRegistry = (id: string, userId: string, options?: RequestOptions) =>
	apiRequest<WishlistRegistry>(
		`/wishlists/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
		options
	);

export const createWishlistRegistry = (
	userId: string,
	input: Pick<WishlistRegistry, 'title' | 'description'>,
	options?: RequestOptions
) =>
	apiRequest<WishlistRegistry>('/wishlists', {
		...options,
		method: 'POST',
		body: { userId, ...input }
	});

export const deleteWishlistRegistry = (id: string, userId: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlists/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, {
		...options,
		method: 'DELETE'
	});

export const addWishlistRegistryCard = (
	id: string,
	userId: string,
	cardId: string,
	options?: RequestOptions
) =>
	apiRequest<WishlistRegistry>(
		`/wishlists/${encodeURIComponent(id)}/cards?userId=${encodeURIComponent(userId)}`,
		{
			...options,
			method: 'POST',
			body: { cardId }
		}
	);

export const removeWishlistRegistryCard = (
	id: string,
	userId: string,
	cardId: string,
	options?: RequestOptions
) =>
	apiRequest<WishlistRegistry>(
		`/wishlists/${encodeURIComponent(id)}/remove?userId=${encodeURIComponent(userId)}`,
		{
			...options,
			method: 'POST',
			body: { cardId }
		}
	);

export const shareWishlistRegistry = (
	id: string,
	userId: string,
	target: 'link' | 'guild' = 'link',
	options?: RequestOptions
) =>
	apiRequest<{ sealUrl: string }>(
		`/wishlists/${encodeURIComponent(id)}/share?userId=${encodeURIComponent(userId)}`,
		{
			...options,
			method: 'POST',
			body: { target }
		}
	);

export const getGuildWishlistShares = (options?: RequestOptions) =>
	apiRequest<GuildWishlistShare[]>('/messages/guild-wishlists', options);

export const importWishlistRegistryFromLink = (
	userId: string,
	sealUrl: string,
	options?: RequestOptions
) =>
	apiRequest<WishlistRegistry>('/wishlists/import', {
		...options,
		method: 'POST',
		body: { userId, sealUrl }
	});
