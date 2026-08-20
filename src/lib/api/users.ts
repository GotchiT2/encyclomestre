import { apiRequest, type RequestOptions } from './client';
import { toCurrentUser, type OAuthCurrentUserResponse } from './current-user';
import {
	toCollectionCardRecord,
	type WikiForgeCollectionCard,
	type WikiForgePage
} from './wikiforge';
import type {
	CardRarity,
	CardRecord,
	CardVariant,
	Friendship,
	PaginatedResponse,
	UpdateUserInput,
	UpdateUserPreferencesInput,
	User,
	UserBlock
} from '$lib/types';
import { cardRarityCodeByName } from '$lib/domain/cards/rarities';

export interface UserCollectionPageQuery {
	query?: string;
	rarities?: CardRarity[];
	variant?: CardVariant;
	sortBy?: 'rarity' | 'name';
	page?: number;
	pageSize?: number;
}

const apiVariantByFilter: Record<CardVariant, 'ALL' | 'NORMAL' | 'FULL_ART'> = {
	all: 'ALL',
	normal: 'NORMAL',
	alternative: 'FULL_ART'
};

export const getUserCollectionPage = async (
	id: string,
	query: UserCollectionPageQuery = {},
	options?: RequestOptions
): Promise<PaginatedResponse<CardRecord>> => {
	const parameters = new URLSearchParams({
		page: String(Math.max(0, query.page ?? 0)),
		size: String(Math.min(24, Math.max(1, query.pageSize ?? 12))),
		sortBy: query.sortBy ?? 'rarity',
		sortDirection: query.sortBy === 'name' ? 'ASC' : 'DESC',
		variant: apiVariantByFilter[query.variant ?? 'all']
	});
	if (query.query?.trim()) parameters.set('q', query.query.trim());
	for (const rarity of query.rarities ?? []) {
		parameters.append('rarity', cardRarityCodeByName[rarity]);
	}
	const response = await apiRequest<WikiForgePage<WikiForgeCollectionCard>>(
		`/api/users/${encodeURIComponent(id)}/collection?${parameters}`,
		options
	);
	return {
		items: response.results.map(toCollectionCardRecord),
		meta: {
			page: response.page + 1,
			pageSize: response.size,
			total: response.nbResults,
			totalPages: Math.max(1, Math.ceil(response.nbResults / Math.max(1, response.size)))
		}
	};
};

export const getCurrentUser = async (options?: RequestOptions) =>
	toCurrentUser(
		await apiRequest<OAuthCurrentUserResponse>('/me', { ...options, apiTarget: 'cards' })
	);

export const getUser = (id: string, options?: RequestOptions) =>
	apiRequest<User>(`/api/users/${encodeURIComponent(id)}`, options);

export const getUserCollection = async (
	id: string,
	options?: RequestOptions
): Promise<CardRecord[]> => {
	const endpoint = `/api/users/${encodeURIComponent(id)}/collection`;
	const firstPage = await apiRequest<WikiForgePage<WikiForgeCollectionCard>>(
		`${endpoint}?page=0&size=100`,
		options
	);
	const pageSize = Math.max(1, firstPage.size || 100);
	const totalPages = Math.max(1, Math.ceil(firstPage.nbResults / pageSize));
	const remainingPages = await Promise.all(
		Array.from({ length: totalPages - 1 }, (_, index) =>
			apiRequest<WikiForgePage<WikiForgeCollectionCard>>(
				`${endpoint}?page=${index + 1}&size=${pageSize}`,
				options
			)
		)
	);
	return [firstPage, ...remainingPages].flatMap((page) => page.results.map(toCollectionCardRecord));
};

export const getUserCollectionCopies = async (
	id: string,
	variantIds: string[],
	options?: RequestOptions
): Promise<CardRecord[]> => {
	if (!variantIds.length) return [];
	const parameters = new URLSearchParams();
	for (const variantId of [...new Set(variantIds)].slice(0, 50)) {
		parameters.append('variantId', variantId);
	}
	return (
		await apiRequest<WikiForgeCollectionCard[]>(
			`/api/users/${encodeURIComponent(id)}/collection/copies?${parameters}`,
			options
		)
	).map(toCollectionCardRecord);
};

export const getUserCollectionCounts = (
	id: string,
	variantIds: string[],
	options?: RequestOptions
): Promise<Record<string, number>> => {
	if (!variantIds.length) return Promise.resolve({});
	const parameters = new URLSearchParams();
	for (const variantId of [...new Set(variantIds)].slice(0, 50)) {
		parameters.append('variantId', variantId);
	}
	return apiRequest<Record<string, number>>(
		`/api/users/${encodeURIComponent(id)}/collection/counts?${parameters}`,
		options
	);
};

export const getOwnedCollectionCards = async (
	userCardIds: string[],
	options?: RequestOptions
): Promise<CardRecord[]> => {
	if (!userCardIds.length) return [];
	const parameters = new URLSearchParams();
	for (const userCardId of [...new Set(userCardIds)].slice(0, 50)) {
		parameters.append('userCardId', userCardId);
	}
	return (
		await apiRequest<WikiForgeCollectionCard[]>(`/api/collection/copies?${parameters}`, options)
	).map(toCollectionCardRecord);
};

export const searchUsers = async (
	query: string,
	{ page = 0, size = 20 }: { page?: number; size?: number } = {},
	options?: RequestOptions
): Promise<User[]> => {
	const parameters = new URLSearchParams({
		excludeCurrent: 'true',
		page: String(Math.max(0, page)),
		size: String(Math.min(100, Math.max(1, size)))
	});
	if (query.trim()) parameters.set('q', query.trim());
	const response = await apiRequest<PaginatedResponse<User> | WikiForgePage<User>>(
		`/api/users?${parameters}`,
		options
	);
	return 'results' in response ? response.results : response.items;
};

export const getTradePartners = async (
	_userId?: string,
	options?: RequestOptions
): Promise<User[]> =>
	(await getFriends(undefined, options))
		.filter((friendship) => friendship.status === 'accepted')
		.map((friendship) => friendship.user);

export const getFriends = (_userId?: string, options?: RequestOptions) =>
	apiRequest<Friendship[]>('/api/friends', options);

export const createFriendRequest = (
	_userId: string,
	recipientId: string,
	options?: RequestOptions
) =>
	apiRequest<Friendship>('/api/friends', {
		...options,
		method: 'POST',
		body: { recipientId }
	});

export const respondToFriendRequest = (
	id: string,
	status: 'accepted' | 'rejected',
	options?: RequestOptions
) =>
	apiRequest<Friendship>(`/api/friends/${encodeURIComponent(id)}`, {
		...options,
		method: 'PATCH',
		body: { status }
	});

export const removeFriend = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/friends/${encodeURIComponent(id)}`, {
		...options,
		method: 'DELETE'
	});

export const getUserBlocks = (options?: RequestOptions) =>
	apiRequest<UserBlock[]>('/api/users/me/blocks', options);

export const blockUser = (id: string, options?: RequestOptions) =>
	apiRequest<UserBlock>(`/api/users/${encodeURIComponent(id)}/block`, {
		...options,
		method: 'PUT'
	});

export const unblockUser = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/users/${encodeURIComponent(id)}/block`, {
		...options,
		method: 'DELETE'
	});

export const updateUser = (_id: string, input: UpdateUserInput, options?: RequestOptions) =>
	apiRequest<User>('/api/users/me', { ...options, method: 'PATCH', body: input });

export const deleteUser = (_id?: string, options?: RequestOptions) =>
	apiRequest<void>('/api/users/me', { ...options, method: 'DELETE' });

export const updateUserPreferences = (
	_id: string,
	input: UpdateUserPreferencesInput,
	options?: RequestOptions
) =>
	apiRequest<User>('/api/users/me/preferences', {
		...options,
		method: 'PATCH',
		body: input
	});
