import { apiRequest, type RequestOptions } from './client';
import { toCardRecord, type WikiForgePage } from './wikiforge';
import type {
	CardRecord,
	Friendship,
	PaginatedResponse,
	UpdateUserInput,
	UpdateUserPreferencesInput,
	User
} from '$lib/types';

interface PublicCollectionCard {
	cardId: number;
	rarity: string;
	acquiredAt: string;
	wikipediaTitle: string;
	imageUrl: string;
}

export const getCurrentUser = (options?: RequestOptions) =>
	apiRequest<User>('/api/users/me', options);

export const getUser = (id: string, options?: RequestOptions) =>
	apiRequest<User>(`/api/users/${encodeURIComponent(id)}`, options);

export const getUserCollection = async (
	id: string,
	options?: RequestOptions
): Promise<CardRecord[]> => {
	const page = await apiRequest<WikiForgePage<PublicCollectionCard>>(
		`/api/users/${encodeURIComponent(id)}/collection?page=0&size=100`,
		options
	);
	return page.results.map((item) =>
		toCardRecord({
			id: item.cardId,
			wikipediaTitle: item.wikipediaTitle,
			imageUrl: item.imageUrl,
			rarity: item.rarity,
			acquiredAt: item.acquiredAt
		})
	);
};

export const getTradePartners = async (
	_userId?: string,
	options?: RequestOptions
): Promise<User[]> => {
	const response = await apiRequest<PaginatedResponse<User> | WikiForgePage<User>>(
		'/api/users?excludeCurrent=true&page=0&size=100',
		options
	);
	return 'results' in response ? response.results : response.items;
};

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
