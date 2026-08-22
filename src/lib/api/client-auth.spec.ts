import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_MOCK_ENABLED: 'false',
		PUBLIC_API_BASE_URL: 'https://wikiforge-api.roselaqueen.fr',
		PUBLIC_CARDS_API_BASE_URL: 'https://api.wikiforge.fr'
	}
}));

import { persistSession, restoreSession } from '$lib/auth/session';
import { ApiError, apiRequest } from './client';

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

const user = {
	id: 'user-1',
	username: 'demo',
	displayName: 'Demo',
	role: 'user' as const,
	createdAt: '2026-01-01',
	updatedAt: '2026-01-01'
};

describe('apiRequest authentication recovery', () => {
	let storage: Storage;

	beforeEach(() => {
		storage = createStorage();
		persistSession(storage, { accessToken: 'expired', refreshToken: 'refresh', user });
		vi.stubGlobal('localStorage', storage);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('renouvelle une seule fois les appels simultanés refusés avec un statut 401', async () => {
		let refreshCalls = 0;
		const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			if (String(input).endsWith('/oauth2/token')) {
				refreshCalls += 1;
				expect(String(input)).toBe('https://api.wikiforge.fr/oauth2/token');
				await new Promise((resolve) => setTimeout(resolve, 0));
				expect(new Headers(init?.headers).get('content-type')).toBe(
					'application/x-www-form-urlencoded'
				);
				expect(init?.body).toBeInstanceOf(URLSearchParams);
				expect((init?.body as URLSearchParams).get('grant_type')).toBe('refresh_token');
				expect((init?.body as URLSearchParams).get('refresh_token')).toBe('refresh');
				return Response.json({
					access_token: 'renewed',
					refresh_token: 'rotated',
					token_type: 'Bearer',
					expires_in: 3600
				});
			}

			const authorization = new Headers(init?.headers).get('authorization');
			return authorization === 'Bearer renewed'
				? Response.json({ ok: true })
				: Response.json({ message: 'Token expiré' }, { status: 401 });
		});

		const responses = await Promise.all([
			apiRequest<{ ok: boolean }>('/dashboard', {
				fetch: fetcher as typeof fetch,
				apiTarget: 'cards'
			}),
			apiRequest<{ ok: boolean }>('/friends', {
				fetch: fetcher as typeof fetch,
				apiTarget: 'cards'
			})
		]);

		expect(responses).toEqual([{ ok: true }, { ok: true }]);
		expect(refreshCalls).toBe(1);
		expect(restoreSession(storage)?.accessToken).toBe('renewed');
		expect(restoreSession(storage)?.refreshToken).toBe('rotated');
	});

	it('supprime la session lorsque le renouvellement est refusé', async () => {
		const fetcher = vi.fn(async (input: string | URL | Request) =>
			String(input).endsWith('/oauth2/token')
				? Response.json({ error: 'invalid_grant' }, { status: 400 })
				: Response.json({ message: 'Token expiré' }, { status: 401 })
		);

		await expect(
			apiRequest('/dashboard', { fetch: fetcher as typeof fetch, apiTarget: 'cards' })
		).rejects.toBeInstanceOf(ApiError);
		expect(restoreSession(storage)).toBeNull();
	});

	it('conserve la session lorsqu’une route legacy rejette le jeton OAuth Cards', async () => {
		const fetcher = vi.fn().mockResolvedValue(Response.json({ message: 'Non autorisé' }, { status: 401 }));

		await expect(
			apiRequest('/api/dashboard', { fetch: fetcher as typeof fetch })
		).rejects.toBeInstanceOf(ApiError);

		expect(fetcher).toHaveBeenCalledOnce();
		expect(restoreSession(storage)?.accessToken).toBe('expired');
	});
});
