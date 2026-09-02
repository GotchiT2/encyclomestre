import { apiRequest, type RequestOptions } from './client';
import type { ProfileRegistrySummary, ProfileSettings } from '$lib/types';

interface ProfileResponse {
	userId: string;
	settings: Partial<ProfileSettings> | null;
}

const defaultProfile: ProfileSettings = {
	username: '',
	avatarCardId: null,
	accentColor: '#feb823',
	bioTags: [],
	showcases: [],
	wantedCardIds: [],
	nsfwEnabled: false,
	censoredKeywords: [],
	visibility: 'FRIENDS'
};

function normalizeProfile(response: ProfileResponse): ProfileSettings {
	return { ...defaultProfile, ...(response.settings ?? {}) };
}

export const getProfileRegistrySummary = async (
	id: string,
	options?: RequestOptions
): Promise<ProfileRegistrySummary> => {
	const response = await apiRequest<
		Omit<ProfileRegistrySummary, 'publicTags'> & { publicTags: string[] }
	>(`/api/users/${encodeURIComponent(id)}/registry-summary`, options);
	return {
		...response,
		publicTags: response.publicTags.map((name, index) => ({
			id: `public-tag-${index}`,
			name,
			color: '#feb823'
		}))
	};
};

export const getMyProfileRegistrySummary = async (options?: RequestOptions) => {
	const response = await apiRequest<
		Omit<ProfileRegistrySummary, 'publicTags'> & { publicTags: string[] }
	>('/api/users/me/registry-summary', options);
	return {
		...response,
		publicTags: response.publicTags.map((name, index) => ({
			id: `public-tag-${index}`,
			name,
			color: '#feb823'
		}))
	};
};

export const getProfileSettings = async (id: string, options?: RequestOptions) =>
	normalizeProfile(
		await apiRequest<ProfileResponse>(`/api/users/${encodeURIComponent(id)}/profile`, options)
	);

export const getMyProfileSettings = async (options?: RequestOptions) =>
	normalizeProfile(await apiRequest<ProfileResponse>('/api/users/me/profile', options));

export const updateProfileSettings = async (
	_id: string,
	input: Partial<ProfileSettings>,
	options?: RequestOptions
) => normalizeProfile(await updateMyProfileSettings(input, options));

export const updateMyProfileSettings = (
	input: Partial<ProfileSettings>,
	options?: RequestOptions
) =>
	apiRequest<ProfileResponse>('/api/users/me/profile', {
		...options,
		method: 'PATCH',
		body: input
	});
