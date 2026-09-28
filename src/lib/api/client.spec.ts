import { afterEach, describe, expect, it, vi } from 'vitest';

const { apiEnv } = vi.hoisted(() => ({
	apiEnv: { PUBLIC_API_MOCK_ENABLED: 'true' } as Record<string, string>
}));
vi.mock('$env/dynamic/public', () => ({
	env: apiEnv
}));

import { login } from './auth';
import { API_TIMEOUT_MS, ApiTimeoutError, apiRequest } from './client';

describe('apiRequest en mode mock', () => {
	afterEach(() => {
		delete apiEnv.PUBLIC_API_MOCK_DELAY_MS;
		vi.useRealTimers();
	});

	it('intercepte la requête sans appeler le fetch fourni', async () => {
		const fetcher = vi.fn();

		const card = await apiRequest<{ id: number; variantId: number }>('/cards/girls-generation-1', {
			fetch: fetcher as typeof fetch
		});

		expect(card).toMatchObject({ id: 1, variantId: expect.any(Number) });
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('reproduit le flux OAuth2 puis /me sans réseau', async () => {
		const fetcher = vi.fn();

		const session = await login(
			{ email: 'camille@example.test', password: 'secret', turnstileToken: 'mock-token' },
			{ fetch: fetcher as typeof fetch }
		);

		expect(session).toMatchObject({
			accessToken: 'mock-access-token-demo-user',
			refreshToken: 'mock-refresh-token-demo-user',
			user: { id: '1' }
		});
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('conserve les erreurs HTTP sur les réponses passkeys', async () => {
		await expect(
			apiRequest('/me/passkeys', {
				method: 'POST',
				headers: { 'CF-Turnstile-Response': 'mock-token' },
				body: { password: 'wrong', label: 'Test', credential: {} },
				retryAuth: false
			})
		).rejects.toMatchObject({ status: 403 });
	});

	it('interrompt une requête qui dépasse 12 secondes', async () => {
		vi.useFakeTimers();
		apiEnv.PUBLIC_API_MOCK_DELAY_MS = String(API_TIMEOUT_MS + 1);

		const request = apiRequest('/cards/girls-generation-1');
		const rejection = expect(request).rejects.toBeInstanceOf(ApiTimeoutError);
		await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS);

		await rejection;
	});
});
