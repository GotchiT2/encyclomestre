import { apiRequest, type RequestOptions } from './client';
import type { UpdateUserInput, UpdateUserPreferencesInput, User } from '$lib/types';

export const getUser = (id: string, options?: RequestOptions) =>
	apiRequest<User>(`/users/${encodeURIComponent(id)}`, options);

export const getTradePartners = (userId: string, options?: RequestOptions) =>
	apiRequest<User[]>(`/users?excludeId=${encodeURIComponent(userId)}`, options);

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
