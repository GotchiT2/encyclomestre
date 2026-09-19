import { apiRequest, type RequestOptions } from './client';
import { toCurrentUser, type OAuthCurrentUserResponse } from './current-user';
import type {
	LastConnection,
	Friendship,
	User,
	ProfileVisibility,
	MutedNotificationCategory,
	UserBlock
} from '$lib/types';
import {
	collectionPath,
	toWikiForgeCollectionCard,
	type CollectionPageResult,
	type CollectionQuery,
	type WikiForgeCollectionResponse
} from './collection';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';
import { getVariants } from './variants';

export const getCurrentUser = async (options?: RequestOptions) =>
	toCurrentUser(
		await apiRequest<OAuthCurrentUserResponse>('/me', { ...options, apiTarget: 'wikiforge' })
	);

export const getCurrentUserMoney = (options?: RequestOptions) =>
	apiRequest<number>('/me/money', { ...options, apiTarget: 'wikiforge' });

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
	lastConnection?: LastConnection;
	sharesWishlist?: boolean;
}

export interface UpdateWikiForgeMeInput {
	name: string;
	imagePageId: number | null;
	nsfw: boolean;
	safeWords: string[];
	visibility: ProfileVisibility;
	mutedNotifications: MutedNotificationCategory[];
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
		updatedAt: user.createdAt ? wikiForgeUtcDate(user.createdAt).toISOString() : '',
		lastConnection: user.lastConnection,
		sharesWishlist: user.sharesWishlist
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

export const updateWikiForgeImage = async (
	imagePageId: number | null,
	options?: RequestOptions
): Promise<User> =>
	toCurrentUser(
		await apiRequest<OAuthCurrentUserResponse>('/me/image', {
			...options,
			apiTarget: 'wikiforge',
			method: 'PATCH',
			body: { imagePageId }
		})
	);

export async function getFriendCollectionPage(
	friendId: string,
	query: CollectionQuery = {},
	options?: RequestOptions
): Promise<CollectionPageResult> {
	const endpoint = `/friends/${wikiForgeNumericId(friendId, 'ami')}/collection`;
	const [response, variants] = await Promise.all([
		apiRequest<WikiForgeCollectionResponse>(collectionPath(query, endpoint), {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return {
		items: (response.results ?? []).map((card) => toWikiForgeCollectionCard(card, variants)),
		page: response.page,
		total: response.nbResults,
		hasNext: response.hasNext,
		nextCursor: response.nextCursor
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
	visibility?: ProfileVisibility;
}
