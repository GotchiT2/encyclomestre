import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_MOCK_ENABLED: 'false',
		PUBLIC_WIKIFORGE_API_BASE_URL: 'https://api.wikiforge.fr'
	}
}));

import { persistSession } from '$lib/auth/session';
import type { User } from '$lib/types';
import { login, logout, logoutAll } from './auth';

function createStorage() {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key: string) => values.get(key) ?? null,
		key: (index: number) => [...values.keys()][index] ?? null,
		setItem: (key: string, value: string) => values.set(key, value),
		removeItem: (key: string) => values.delete(key)
	} satisfies Storage;
}

const user: User = {
	id: '1',
	username: 'Test',
	displayName: 'Test',
	email: 'demo@example.test',
	avatarUrl: null,
	imagePageId: null,
	nsfwEnabled: false,
	safeWords: [],
	visibility: 'FRIENDS',
	mutedNotifications: [],
	lastConnection: 'TODAY',
	role: 'user',
	createdAt: '2026-08-20T14:11:51.007Z',
	updatedAt: '2026-08-20T14:11:51.007Z'
};

const oauthProfile = {
	id: 1,
	name: 'Test',
	email: 'demo@example.test',
	roles: ['USER'],
	lastConnection: 'TODAY',
	createdAt: '2026-08-20T14:11:51.007077'
};

describe('OAuth2 authentication', () => {
	let storage: Storage;

	beforeEach(() => {
		storage = createStorage();
		vi.stubGlobal('localStorage', storage);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('échange les identifiants puis charge le profil courant', async () => {
		const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			if (String(input).endsWith('/oauth2/token')) {
				expect(String(input)).toBe('https://api.wikiforge.fr/oauth2/token');
				expect(init?.method).toBe('POST');
				expect(new Headers(init?.headers).get('content-type')).toBe(
					'application/x-www-form-urlencoded'
				);
				expect(init?.body).toBeInstanceOf(URLSearchParams);
				const form = init?.body as URLSearchParams;
				expect(Object.fromEntries(form)).toEqual({
					grant_type: 'password',
					username: 'demo@example.test',
					password: 'secret',
					'cf-turnstile-response': 'login-token'
				});
				return Response.json({
					access_token: 'access',
					refresh_token: 'refresh',
					token_type: 'Bearer',
					expires_in: 3600
				});
			}

			expect(String(input)).toBe('https://api.wikiforge.fr/me');
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer access');
			return Response.json(oauthProfile);
		});

		await expect(
			login(
				{ email: 'demo@example.test', password: 'secret', turnstileToken: 'login-token' },
				{ fetch: fetcher as typeof fetch }
			)
		).resolves.toEqual({
			accessToken: 'access',
			refreshToken: 'refresh',
			accessTokenExpiresAt: expect.any(Number),
			user
		});
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('révoque le jeton de renouvellement lors de la déconnexion', async () => {
		persistSession(storage, { accessToken: 'access', refreshToken: 'refresh', user });
		const fetcher = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
			expect(init?.body).toBeInstanceOf(URLSearchParams);
			expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
				token: 'refresh',
				token_type_hint: 'refresh_token'
			});
			return new Response(undefined, { status: 200 });
		});

		await logout({ fetch: fetcher as typeof fetch });

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/oauth2/revoke',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('demande la déconnexion de tous les appareils avec le jeton courant', async () => {
		persistSession(storage, { accessToken: 'access', refreshToken: 'refresh', user });
		const fetcher = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer access');
			return new Response(undefined, { status: 200 });
		});

		await logoutAll({ fetch: fetcher as typeof fetch });

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/auth/logout-all',
			expect.objectContaining({ method: 'POST' })
		);
	});
});
