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
	CardSearchSort,
	CardVariant,
	Friendship,
	PaginatedResponse,
	UpdateUserInput,
	UpdateUserPreferencesInput,
	User,
	UserBlock
} from '$lib/types';
import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
import { cardSearchSortDirection, defaultCardSearchSort } from '$lib/domain/cards/search';
import {
	collectionPath,
	toWikiForgeCollectionCard,
	type CollectionPageResult,
	type CollectionQuery,
	type WikiForgeCollectionResponse
} from './collection';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

export interface UserCollectionPageQuery {
	query?: string;
	rarities?: CardRarity[];
	variant?: CardVariant;
	sortBy?: CardSearchSort;
	page?: number;
	pageSize?: number;
	cursor?: string;
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
	const sortBy = defaultCardSearchSort(query.query, query.sortBy);
	const parameters = new URLSearchParams({
		page: String(Math.max(0, query.page ?? 0)),
		size: String(Math.min(24, Math.max(1, query.pageSize ?? 12))),
		sortBy: sortBy.toUpperCase(),
		sortDirection: cardSearchSortDirection(sortBy),
		variant: apiVariantByFilter[query.variant ?? 'all']
	});
	if (query.query?.trim()) parameters.set('q', query.query.trim());
	if (query.cursor) parameters.set('cursor', query.cursor);
	for (const rarity of query.rarities ?? []) {
		parameters.append('rarity', cardRarityCodeByName[rarity]);
	}
	const response = await apiRequest<WikiForgePage<WikiForgeCollectionCard>>(
		`/api/users/${encodeURIComponent(id)}/collection?${parameters}`,
		options
	);
	const results = response.results ?? [];
	return {
		items: results.map(toCollectionCardRecord),
		meta: {
			page: response.page + 1,
			pageSize: response.size ?? Math.max(1, results.length || 50),
			total: response.nbResults,
			totalPages: Math.max(
				1,
				Math.ceil(response.nbResults / Math.max(1, response.size ?? (results.length || 50)))
			),
			...(response.nextCursor === undefined ? {} : { nextCursor: response.nextCursor })
		}
	};
};

export const getCurrentUser = async (options?: RequestOptions) =>
	toCurrentUser(
		await apiRequest<OAuthCurrentUserResponse>('/me', { ...options, apiTarget: 'wikiforge' })
	);

export const getCurrentUserMoney = (options?: RequestOptions) =>
	apiRequest<number>('/me/money', { ...options, apiTarget: 'wikiforge' });

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
	return [firstPage, ...remainingPages].flatMap((page) =>
		(page.results ?? []).map(toCollectionCardRecord)
	);
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
	_options: { page?: number; size?: number } = {},
	options?: RequestOptions
): Promise<User[]> => {
	void _options;
	const text = query.trim();
	if (text.length < 3) return [];
	const response = await apiRequest<WikiForgeSimpleUserDto[]>(
		`/users?${new URLSearchParams({ q: text })}`,
		{ ...options, apiTarget: 'wikiforge' }
	);
	return response.map(toWikiForgeUser);
};

export const getTradePartners = async (
	_userId?: string,
	options?: RequestOptions
): Promise<User[]> =>
	(await getFriends(undefined, options))
		.filter((friendship) => friendship.status === 'accepted')
		.map((friendship) => friendship.user);

export interface WikiForgeSimpleUserDto {
	id: number;
	name: string;
	imagePageId?: number | null;
	image?: string | null;
	createdAt?: string;
}

export interface UpdateWikiForgeMeInput {
	name: string;
	imagePageId?: number;
	nsfw: boolean;
	safeWords: string[];
}

export interface WikiForgeFriendListsDto {
	friends?: WikiForgeSimpleUserDto[];
	received?: WikiForgeSimpleUserDto[];
	sent?: WikiForgeSimpleUserDto[];
}

interface WikiForgeBlockedUserDto extends WikiForgeSimpleUserDto {
	createdAt: string;
}

function wikiForgeUserImage(image?: string | null): string | null {
	if (!image?.trim()) return null;
	if (/^https?:\/\//.test(image)) return image;
	return `https://fr.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(image)}?width=250`;
}

export function toWikiForgeUser(user: WikiForgeSimpleUserDto): User {
	return {
		id: String(user.id),
		username: user.name,
		displayName: user.name,
		avatarUrl: wikiForgeUserImage(user.image),
		role: 'user',
		createdAt: user.createdAt ? wikiForgeUtcDate(user.createdAt).toISOString() : '',
		updatedAt: user.createdAt ? wikiForgeUtcDate(user.createdAt).toISOString() : ''
	};
}

function toFriendship(user: WikiForgeSimpleUserDto, status: Friendship['status']): Friendship {
	return {
		id: String(user.id),
		user: toWikiForgeUser(user),
		status,
		createdAt: user.createdAt ? wikiForgeUtcDate(user.createdAt).toISOString() : '',
		lastActiveAt: ''
	};
}

export const getFriends = async (
	_userId?: string,
	options?: RequestOptions
): Promise<Friendship[]> => {
	const response = await apiRequest<WikiForgeFriendListsDto>('/friends', {
		...options,
		apiTarget: 'wikiforge'
	});
	return [
		...(response.friends ?? []).map((user) => toFriendship(user, 'accepted')),
		...(response.received ?? []).map((user) => toFriendship(user, 'received')),
		...(response.sent ?? []).map((user) => toFriendship(user, 'sent'))
	];
};

export const createFriendRequest = (
	_userId: string,
	recipientId: string,
	options?: RequestOptions
) =>
	apiRequest<void>(`/friends/${wikiForgeNumericId(recipientId, 'utilisateur')}`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST'
	});

export const respondToFriendRequest = (
	id: string,
	status: 'accepted' | 'rejected',
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/friends/${wikiForgeNumericId(id, 'utilisateur')}${status === 'accepted' ? '/accept' : ''}`,
		{
			...options,
			apiTarget: 'wikiforge',
			method: status === 'accepted' ? 'POST' : 'DELETE'
		}
	);

export const removeFriend = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/friends/${wikiForgeNumericId(id, 'utilisateur')}`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'DELETE'
	});

export const getUserBlocks = async (options?: RequestOptions): Promise<UserBlock[]> => {
	const response = await apiRequest<WikiForgeBlockedUserDto[] | Record<string, never>>('/blocks', {
		...options,
		apiTarget: 'wikiforge'
	});
	return Array.isArray(response)
		? response.map((block) => ({
				user: toWikiForgeUser(block),
				createdAt: wikiForgeUtcDate(block.createdAt).toISOString()
			}))
		: [];
};

export const blockUser = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/blocks/${wikiForgeNumericId(id, 'utilisateur')}`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST'
	});

export const unblockUser = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/blocks/${wikiForgeNumericId(id, 'utilisateur')}`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'DELETE'
	});

export const updateWikiForgeMe = async (
	input: UpdateWikiForgeMeInput,
	options?: RequestOptions
): Promise<User> =>
	toCurrentUser(
		await apiRequest<OAuthCurrentUserResponse>('/me', {
			...options,
			apiTarget: 'wikiforge',
			method: 'PATCH',
			body: input
		})
	);

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

export async function getFriendCollectionPage(
	friendId: string,
	query: CollectionQuery = {},
	options?: RequestOptions
): Promise<CollectionPageResult> {
	const endpoint = `/friends/${wikiForgeNumericId(friendId, 'ami')}/collection`;
	const response = await apiRequest<WikiForgeCollectionResponse>(collectionPath(query, endpoint), {
		...options,
		apiTarget: 'wikiforge'
	});
	return {
		items: (response.results ?? []).map(toWikiForgeCollectionCard),
		page: response.page,
		total: response.nbResults,
		hasNext: response.hasNext,
		nextCursor: response.nextCursor,
		rarityResults: response.rarityResults ?? null
	};
}

export async function getFriendTags(
	friendId: string,
	options?: RequestOptions
): Promise<import('$lib/types').CollectionTag[]> {
	const response = await apiRequest<WikiForgeTagDto[]>(
		`/friends/${wikiForgeNumericId(friendId, 'ami')}/tags`,
		{ ...options, apiTarget: 'wikiforge' }
	);
	return response.map((tag) => ({ id: String(tag.id), name: tag.name, color: tag.color }));
}

interface WikiForgeTagDto {
	id: number;
	name: string;
	color: string;
}
