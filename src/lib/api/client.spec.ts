import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_MOCK_ENABLED: 'true' }
}));

import { login } from './auth';
import { apiRequest } from './client';

describe('apiRequest en mode mock', () => {
	it('intercepte la requête sans appeler le fetch fourni', async () => {
		const fetcher = vi.fn();

		const card = await apiRequest<{ id: string }>('/cards/girls-generation-1', {
			fetch: fetcher as typeof fetch
		});

		expect(card.id).toBe('girls-generation-1');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('reproduit le flux OAuth2 puis /users/me sans réseau', async () => {
		const fetcher = vi.fn();

		const session = await login(
			{ email: 'camille@example.test', password: 'secret' },
			{ fetch: fetcher as typeof fetch }
		);

		expect(session).toMatchObject({
			accessToken: 'mock-access-token-demo-user',
			refreshToken: 'mock-refresh-token-demo-user',
			user: { id: 'demo-user' }
		});
		expect(fetcher).not.toHaveBeenCalled();
	});
});
