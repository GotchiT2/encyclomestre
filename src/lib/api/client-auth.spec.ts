import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_MOCK_ENABLED: 'false', PUBLIC_API_BASE_URL: 'http://localhost:8080' }
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
		persistSession(storage, { access_token: 'expired', refresh_token: 'refresh', user });
		vi.stubGlobal('localStorage', storage);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('renouvelle une seule fois les appels simultanés refusés avec un statut 403', async () => {
		let refreshCalls = 0;
		const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			if (String(input).endsWith('/api/auth/refresh')) {
				refreshCalls += 1;
				await new Promise((resolve) => setTimeout(resolve, 0));
				return Response.json({ accessToken: 'renewed', refreshToken: 'rotated' });
			}

			const authorization = new Headers(init?.headers).get('authorization');
			return authorization === 'Bearer renewed'
				? Response.json({ ok: true })
				: Response.json({ message: 'Token expiré' }, { status: 403 });
		});

		const responses = await Promise.all([
			apiRequest<{ ok: boolean }>('/api/dashboard', { fetch: fetcher as typeof fetch }),
			apiRequest<{ ok: boolean }>('/api/friends', { fetch: fetcher as typeof fetch })
		]);

		expect(responses).toEqual([{ ok: true }, { ok: true }]);
		expect(refreshCalls).toBe(1);
		expect(restoreSession(storage)?.access_token).toBe('renewed');
		expect(restoreSession(storage)?.refresh_token).toBe('rotated');
	});

	it('supprime la session lorsque le renouvellement est refusé', async () => {
		const fetcher = vi.fn(async (input: string | URL | Request) =>
			String(input).endsWith('/api/auth/refresh')
				? Response.json({ message: 'Refresh expiré' }, { status: 403 })
				: Response.json({ message: 'Token expiré' }, { status: 403 })
		);

		await expect(
			apiRequest('/api/dashboard', { fetch: fetcher as typeof fetch })
		).rejects.toBeInstanceOf(ApiError);
		expect(restoreSession(storage)).toBeNull();
	});
});
