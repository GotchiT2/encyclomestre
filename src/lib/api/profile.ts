import { apiRequest, type RequestOptions } from './client';
import type { ProfileRegistrySummary, ProfileSettings } from '$lib/types';

export const getProfileRegistrySummary = (id: string, options?: RequestOptions) =>
	apiRequest<ProfileRegistrySummary>(`/users/${encodeURIComponent(id)}/registry-summary`, options);
export const getProfileSettings = (id: string, options?: RequestOptions) =>
	apiRequest<ProfileSettings>(`/users/${encodeURIComponent(id)}/profile`, options);
export const updateProfileSettings = (
	id: string,
	input: Partial<ProfileSettings>,
	options?: RequestOptions
) =>
	apiRequest<ProfileSettings>(`/users/${encodeURIComponent(id)}/profile`, {
		...options,
		method: 'PATCH',
		body: input
	});
