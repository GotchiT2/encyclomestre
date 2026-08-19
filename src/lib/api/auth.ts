import { apiRequest, type RequestOptions } from './client';
import { restoreSession } from '$lib/auth/session';
import type { AuthSession, LoginInput, User } from '$lib/types';

export interface WikiForgeTokens {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	refreshTokenExpiresInSeconds: number;
	user: User;
}

export const register = (input: LoginInput, options?: RequestOptions) =>
	apiRequest<WikiForgeTokens>('/api/auth/register', {
		...options,
		method: 'POST',
		body: input
	});

export const login = (input: LoginInput, options?: RequestOptions): Promise<AuthSession> =>
	apiRequest<WikiForgeTokens>('/oauth2/token', {
		...options,
		method: 'POST',
		body: new URLSearchParams({ ...input, grant_type: 'password' })
	});

export const logout = (options?: RequestOptions) => {
	const refreshToken =
		typeof localStorage === 'undefined' ? undefined : restoreSession(localStorage)?.refresh_token;
	if (!refreshToken) return Promise.resolve();
	return apiRequest<void>('/api/auth/logout', {
		...options,
		method: 'POST',
		body: { refreshToken }
	});
};

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
