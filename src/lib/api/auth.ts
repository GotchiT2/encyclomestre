import {
	apiRequest,
	disableWikiForgeSessionRefresh,
	enableWikiForgeSessionRefresh,
	type RequestOptions
} from './client';
import { toCurrentUser, type OAuthCurrentUserResponse } from './current-user';
import { restoreSession } from '$lib/auth/session';
import type { AuthSession, LoginInput, OAuth2TokenResponse } from '$lib/types';

function oauthForm(values: Record<string, string>) {
	return new URLSearchParams(values);
}

function bearerAuthorization(tokens: OAuth2TokenResponse) {
	return `${tokens.token_type || 'Bearer'} ${tokens.access_token}`;
}

function accessTokenExpiresAt(tokens: OAuth2TokenResponse) {
	const lifetime = Number(tokens.expires_in);
	return Number.isFinite(lifetime) && lifetime > 0 ? Date.now() + lifetime * 1_000 : undefined;
}

export async function login(input: LoginInput, options?: RequestOptions): Promise<AuthSession> {
	enableWikiForgeSessionRefresh();
	const tokens = await apiRequest<OAuth2TokenResponse>('/oauth2/token', {
		...options,
		method: 'POST',
		body: oauthForm({
			grant_type: 'password',
			username: input.email,
			password: input.password,
			'cf-turnstile-response': input.turnstileToken
		}),
		skipAuth: true,
		apiTarget: 'wikiforge'
	});
	return finalizeOAuthLogin(tokens, options);
}

export async function finalizeOAuthLogin(
	tokens: OAuth2TokenResponse,
	options?: RequestOptions
): Promise<AuthSession> {
	enableWikiForgeSessionRefresh();
	const profile = await apiRequest<OAuthCurrentUserResponse>('/me', {
		...options,
		headers: { ...options?.headers, authorization: bearerAuthorization(tokens) },
		skipAuth: true,
		apiTarget: 'wikiforge'
	});
	const user = toCurrentUser(profile);
	return {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		accessTokenExpiresAt: accessTokenExpiresAt(tokens),
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
		apiTarget: 'wikiforge'
	});
};

export const logoutAll = (options?: RequestOptions) => {
	disableWikiForgeSessionRefresh();
	return apiRequest<void>('/auth/logout-all', {
		...options,
		method: 'POST',
		apiTarget: 'wikiforge'
	});
};
