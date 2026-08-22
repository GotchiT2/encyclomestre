import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
import type {
	PaginatedResponse,
	WishlistAccess,
	WishlistFollower,
	WishlistGroups,
	WishlistPageEntry,
	WishlistQuery,
	WishlistRegistrySummary
} from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import {
	toPublicPageCardRecord,
	type WikiForgePublicPageCard,
	type WikiForgePublicPageRarity
} from './pages';

interface ApiWishlistSummary {
	id: number;
	name: string;
	description?: string | null;
	nbCards?: number;
	ownerName?: string | null;
	invitedAt?: string | null;
}

interface ApiWishlists {
	owned?: ApiWishlistSummary[];
	shared?: ApiWishlistSummary[];
	pending?: ApiWishlistSummary[];
}

interface ApiWishlistEntry {
	page: WikiForgePublicPageCard;
	addedAt: string;
}

interface ApiWishlistResult {
	nbResults?: number;
	page?: number;
	sortBy?: 'ADDED_AT' | 'NAME' | 'RARITY';
	sortDirection?: 'ASC' | 'DESC';
	results?: ApiWishlistEntry[] | null;
	filters?: Record<string, unknown>;
}

interface ApiWishlistFollower {
	id: number;
	name: string;
	accepted: boolean;
}

const wishlistPageSize = 50;

function toSummary(wishlist: ApiWishlistSummary, access: WishlistAccess): WishlistRegistrySummary {
	return {
		id: String(wishlist.id),
		title: wishlist.name,
		description: wishlist.description ?? '',
		cardCount: wishlist.nbCards ?? 0,
		ownerName: wishlist.ownerName ?? null,
		invitedAt: wishlist.invitedAt ?? null,
		access
	};
}

const wikiForgeOptions = (options?: RequestOptions): RequestOptions => ({
	...options,
	apiTarget: 'wikiforge'
});

export async function getWishlistGroups(options?: RequestOptions): Promise<WishlistGroups> {
	const response = await apiRequest<ApiWishlists>('/wishlists', wikiForgeOptions(options));
	return {
		owned: (response.owned ?? []).map((wishlist) => toSummary(wishlist, 'owned')),
		shared: (response.shared ?? []).map((wishlist) => toSummary(wishlist, 'shared')),
		pending: (response.pending ?? []).map((wishlist) => toSummary(wishlist, 'pending'))
	};
}

/** Owned lists are the only valid destinations when adding a card from a detail modal. */
export async function getWishlists(
	_userId?: string,
	options?: RequestOptions
): Promise<WishlistRegistrySummary[]> {
	return (await getWishlistGroups(options)).owned;
}

export async function getWishlistPage(
	id: string,
	{ page = 1, query, rarities = [], sortBy = 'date', sortDirection = 'DESC' }: WishlistQuery = {},
	options?: RequestOptions
): Promise<PaginatedResponse<WishlistPageEntry>> {
	const parameters = new URLSearchParams({
		page: String(Math.max(0, page - 1)),
		sortBy: sortBy === 'date' ? 'ADDED_AT' : sortBy.toUpperCase(),
		sortDirection
	});
	if (query?.trim()) parameters.set('q', query.trim());
	for (const rarity of rarities) {
		parameters.append('rarity', cardRarityCodeByName[rarity] as WikiForgePublicPageRarity);
	}
	const response = await apiRequest<ApiWishlistResult | null | undefined>(
		`/wishlists/${encodeURIComponent(id)}?${parameters}`,
		wikiForgeOptions(options)
	);
	const results = response?.results ?? [];
	const total = Math.max(0, response?.nbResults ?? results.length);
	return {
		items: results.map((entry) => ({
			card: toPublicPageCardRecord(entry.page),
			addedAt: entry.addedAt
		})),
		meta: {
			page: (response?.page ?? Math.max(0, page - 1)) + 1,
			pageSize: wishlistPageSize,
			total,
			totalPages: Math.max(1, Math.ceil(total / wishlistPageSize))
		}
	};
}

export async function createWishlistRegistry(
	_userId: string,
	input: { title: string; description: string },
	options?: RequestOptions
): Promise<WishlistRegistrySummary> {
	const response = await apiRequest<ApiWishlistSummary>('/wishlists', {
		...wikiForgeOptions(options),
		method: 'POST',
		body: { name: input.title, description: input.description }
	});
	return toSummary(response, 'owned');
}

export async function updateWishlistRegistry(
	id: string,
	input: { title: string; description: string },
	options?: RequestOptions
): Promise<WishlistRegistrySummary> {
	const response = await apiRequest<ApiWishlistSummary>(`/wishlists/${encodeURIComponent(id)}`, {
		...wikiForgeOptions(options),
		method: 'PATCH',
		body: { name: input.title, description: input.description }
	});
	return toSummary(response, 'owned');
}

export const deleteWishlistRegistry = (id: string, _userId?: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlists/${encodeURIComponent(id)}`, {
		...wikiForgeOptions(options),
		method: 'DELETE'
	});

export const addWishlistRegistryCard = (
	id: string,
	_userId: string,
	pageId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(`/wishlists/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageId)}`, {
		...wikiForgeOptions(options),
		method: 'PUT'
	});

export const removeWishlistRegistryCard = (
	id: string,
	_userId: string,
	pageId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(`/wishlists/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageId)}`, {
		...wikiForgeOptions(options),
		method: 'DELETE'
	});

export const inviteWishlistFollower = (
	wishlistId: string,
	invitedId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/wishlists/${encodeURIComponent(wishlistId)}/shares/${encodeURIComponent(invitedId)}`,
		{ ...wikiForgeOptions(options), method: 'POST' }
	);

export async function getWishlistFollowers(
	wishlistId: string,
	options?: RequestOptions
): Promise<WishlistFollower[]> {
	const response = await apiRequest<ApiWishlistFollower[]>(
		`/wishlists/${encodeURIComponent(wishlistId)}/shares`,
		wikiForgeOptions(options)
	);
	return response.map((follower) => ({ ...follower, id: String(follower.id) }));
}

export const acceptWishlistInvitation = (wishlistId: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlists/${encodeURIComponent(wishlistId)}/shares/accept`, {
		...wikiForgeOptions(options),
		method: 'POST'
	});

export const leaveWishlist = (wishlistId: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlists/${encodeURIComponent(wishlistId)}/shares`, {
		...wikiForgeOptions(options),
		method: 'DELETE'
	});

export const revokeWishlistFollower = (
	wishlistId: string,
	revokedId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/wishlists/${encodeURIComponent(wishlistId)}/shares/${encodeURIComponent(revokedId)}`,
		{ ...wikiForgeOptions(options), method: 'DELETE' }
	);
