import { apiRequest, type RequestOptions } from './client';
import type { Friendship, UpdateUserInput, UpdateUserPreferencesInput, User } from '$lib/types';

export const getUser = (id: string, options?: RequestOptions) =>
	apiRequest<User>(`/users/${encodeURIComponent(id)}`, options);

export const getTradePartners = (userId: string, options?: RequestOptions) =>
	apiRequest<User[]>(`/users?excludeId=${encodeURIComponent(userId)}`, options);

export const getFriends = (userId: string, options?: RequestOptions) =>
	apiRequest<Friendship[]>(`/friends?userId=${encodeURIComponent(userId)}`, options);

export const createFriendRequest = (
	userId: string,
	recipientId: string,
	options?: RequestOptions
) =>
	apiRequest<Friendship>('/friends', { ...options, method: 'POST', body: { userId, recipientId } });

export const respondToFriendRequest = (
	id: string,
	status: 'accepted' | 'received',
	options?: RequestOptions
) =>
	apiRequest<Friendship>(`/friends/${encodeURIComponent(id)}`, {
		...options,
		method: 'PATCH',
		body: { status }
	});

export const removeFriend = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/friends/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });

export const updateUser = (id: string, input: UpdateUserInput, options?: RequestOptions) =>
	apiRequest<User>(`/users/${encodeURIComponent(id)}`, {
		...options,
		method: 'PATCH',
		body: input
	});

export const deleteUser = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/users/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });

export const updateUserPreferences = (
	id: string,
	input: UpdateUserPreferencesInput,
	options?: RequestOptions
) =>
	apiRequest<User>(`/users/${encodeURIComponent(id)}/preferences`, {
		...options,
		method: 'PATCH',
		body: input
	});
