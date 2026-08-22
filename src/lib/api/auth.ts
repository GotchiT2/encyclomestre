import { apiRequest, type RequestOptions } from './client';
import { toCurrentUser, type OAuthCurrentUserResponse } from './current-user';
import { restoreSession } from '$lib/auth/session';
import type { AuthSession, LoginInput, OAuth2TokenResponse, User } from '$lib/types';

export interface WikiForgeTokens {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresInSeconds: number;
	refreshTokenExpiresInSeconds: number;
	user: User;
}

function oauthForm(values: Record<string, string>) {
	return new URLSearchParams(values);
}

function bearerAuthorization(tokens: OAuth2TokenResponse) {
	return `${tokens.token_type || 'Bearer'} ${tokens.access_token}`;
}

export const register = (input: LoginInput, options?: RequestOptions) =>
	apiRequest<WikiForgeTokens>('/api/auth/register', {
		...options,
		method: 'POST',
		body: input
	});

export async function login(input: LoginInput, options?: RequestOptions): Promise<AuthSession> {
	const tokens = await apiRequest<OAuth2TokenResponse>('/oauth2/token', {
		...options,
		method: 'POST',
		body: oauthForm({ grant_type: 'password', username: input.email, password: input.password }),
		skipAuth: true,
		apiTarget: 'cards'
	});
	const profile = await apiRequest<OAuthCurrentUserResponse>('/me', {
		...options,
		headers: { ...options?.headers, authorization: bearerAuthorization(tokens) },
		skipAuth: true,
		apiTarget: 'cards'
	});
	const user = toCurrentUser(profile);
	return {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		user
	};
}

export const logout = (options?: RequestOptions) => {
	const refreshToken =
		typeof localStorage === 'undefined' ? undefined : restoreSession(localStorage)?.refreshToken;
	if (!refreshToken) return Promise.resolve();
	return apiRequest<void>('/oauth2/revoke', {
		...options,
		method: 'POST',
		body: oauthForm({ token: refreshToken, token_type_hint: 'refresh_token' }),
		skipAuth: true,
		apiTarget: 'cards'
	});
};

export const logoutAll = (options?: RequestOptions) =>
	apiRequest<void>('/auth/logout-all', { ...options, method: 'POST', apiTarget: 'cards' });

export const forgotPassword = (email: string, options?: RequestOptions) =>
	apiRequest<void>('/api/auth/forgot-password', {
		...options,
		method: 'POST',
		body: { email }
	});

export const resetPassword = (token: string, newPassword: string, options?: RequestOptions) =>
	apiRequest<void>('/api/auth/reset-password', {
		...options,
		method: 'POST',
		body: { token, newPassword }
	});
