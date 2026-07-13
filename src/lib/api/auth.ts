import { apiRequest, type RequestOptions } from './client';
import type { AuthSession, LoginInput } from '$lib/types';

export interface WikiForgeTokens {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresInSeconds: number;
	refreshTokenExpiresInSeconds: number;
}

export const register = (input: LoginInput, options?: RequestOptions) =>
	apiRequest<WikiForgeTokens>('/api/auth/register', { ...options, method: 'POST', body: input });

export const login = async (input: LoginInput, options?: RequestOptions): Promise<AuthSession> => {
	const tokens = await apiRequest<WikiForgeTokens>('/api/auth/login', { ...options, method: 'POST', body: input });
	return { ...tokens, user: { id: input.email, username: input.email, displayName: input.email, role: 'user', createdAt: '', updatedAt: '' } };
};

export const logout = (options?: RequestOptions) =>
	apiRequest<void>('/auth/logout', { ...options, method: 'POST' });
