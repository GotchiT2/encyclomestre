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
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

interface ApiWishlistSummary {
	id: number;
	name: string;
	description?: string | null;
	nbCards?: number;
	imagePageId?: number | null;
	image?: string | null;
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
	imagePageId?: number | null;
	image?: string | null;
}

const wishlistPageSizes = new Map<string, number>();

function toSummary(wishlist: ApiWishlistSummary, access: WishlistAccess): WishlistRegistrySummary {
	return {
		id: String(wishlist.id),
		title: wishlist.name,
		description: wishlist.description ?? '',
		cardCount: wishlist.nbCards ?? null,
		imagePageId: wishlist.imagePageId == null ? null : String(wishlist.imagePageId),
		imageUrl: wishlist.image?.trim() || null,
		ownerName: wishlist.ownerName ?? null,
		invitedAt: wishlist.invitedAt ? wikiForgeUtcDate(wishlist.invitedAt).toISOString() : null,
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
	if ((query?.trim().length ?? 0) >= 3) parameters.set('q', query!.trim());
	for (const rarity of rarities) {
		parameters.append('rarity', cardRarityCodeByName[rarity] as WikiForgePublicPageRarity);
	}
	const response = await apiRequest<ApiWishlistResult | null | undefined>(
		`/wishlists/${wikiForgeNumericId(id, 'wishlist')}?${parameters}`,
		wikiForgeOptions(options)
	);
	const results = response?.results ?? [];
	const total = Math.max(0, response?.nbResults ?? results.length);
	if (results.length && !wishlistPageSizes.has(id)) wishlistPageSizes.set(id, results.length);
	const pageSize = wishlistPageSizes.get(id) ?? Math.max(1, results.length || total || 1);
	return {
		items: results.map((entry) => ({
			card: toPublicPageCardRecord(entry.page),
			addedAt: wikiForgeUtcDate(entry.addedAt).toISOString()
		})),
		meta: {
			page: (response?.page ?? Math.max(0, page - 1)) + 1,
			pageSize,
			total,
			totalPages: Math.max(1, Math.ceil(total / pageSize))
		}
	};
}

export async function createWishlistRegistry(
	_userId: string,
	input: { title: string; description: string; imagePageId?: string | null },
	options?: RequestOptions
): Promise<WishlistRegistrySummary> {
	const response = await apiRequest<ApiWishlistSummary>('/wishlists', {
		...wikiForgeOptions(options),
		method: 'POST',
		body: {
			name: input.title,
			description: input.description,
			...(input.imagePageId
				? { imagePageId: wikiForgeNumericId(input.imagePageId, 'illustration') }
				: {})
		}
	});
	return toSummary(response, 'owned');
}

export async function updateWishlistRegistry(
	id: string,
	input: { title: string; description: string; imagePageId?: string | null },
	options?: RequestOptions
): Promise<WishlistRegistrySummary> {
	const response = await apiRequest<ApiWishlistSummary>(
		`/wishlists/${wikiForgeNumericId(id, 'wishlist')}`,
		{
			...wikiForgeOptions(options),
			method: 'PATCH',
			body: {
				name: input.title,
				description: input.description,
				imagePageId: input.imagePageId
					? wikiForgeNumericId(input.imagePageId, 'illustration')
					: null
			}
		}
	);
	return toSummary(response, 'owned');
}

export const deleteWishlistRegistry = (id: string, _userId?: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlists/${wikiForgeNumericId(id, 'wishlist')}`, {
		...wikiForgeOptions(options),
		method: 'DELETE'
	});

export const addWishlistRegistryCard = (
	id: string,
	_userId: string,
	pageId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/wishlists/${wikiForgeNumericId(id, 'wishlist')}/pages/${wikiForgeNumericId(pageId, 'page')}`,
		{
			...wikiForgeOptions(options),
			method: 'PUT'
		}
	);

export const removeWishlistRegistryCard = (
	id: string,
	_userId: string,
	pageId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/wishlists/${wikiForgeNumericId(id, 'wishlist')}/pages/${wikiForgeNumericId(pageId, 'page')}`,
		{
			...wikiForgeOptions(options),
			method: 'DELETE'
		}
	);

export const inviteWishlistFollower = (
	wishlistId: string,
	invitedId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/wishlists/${wikiForgeNumericId(wishlistId, 'wishlist')}/shares/${wikiForgeNumericId(invitedId, 'utilisateur')}`,
		{ ...wikiForgeOptions(options), method: 'POST' }
	);

export async function getWishlistFollowers(
	wishlistId: string,
	options?: RequestOptions
): Promise<WishlistFollower[]> {
	const response = await apiRequest<ApiWishlistFollower[]>(
		`/wishlists/${wikiForgeNumericId(wishlistId, 'wishlist')}/shares`,
		wikiForgeOptions(options)
	);
	return response.map((follower) => ({
		id: String(follower.id),
		name: follower.name,
		imagePageId: follower.imagePageId == null ? null : String(follower.imagePageId),
		imageUrl: follower.image?.trim() || null,
		accepted: follower.accepted
	}));
}

export const acceptWishlistInvitation = (wishlistId: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlists/${wikiForgeNumericId(wishlistId, 'wishlist')}/shares/accept`, {
		...wikiForgeOptions(options),
		method: 'POST'
	});

export const leaveWishlist = (wishlistId: string, options?: RequestOptions) =>
	apiRequest<void>(`/wishlists/${wikiForgeNumericId(wishlistId, 'wishlist')}/shares`, {
		...wikiForgeOptions(options),
		method: 'DELETE'
	});

export const revokeWishlistFollower = (
	wishlistId: string,
	revokedId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/wishlists/${wikiForgeNumericId(wishlistId, 'wishlist')}/shares/${wikiForgeNumericId(revokedId, 'utilisateur')}`,
		{ ...wikiForgeOptions(options), method: 'DELETE' }
	);
