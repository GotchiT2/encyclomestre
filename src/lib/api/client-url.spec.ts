import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
		env: {
			PUBLIC_API_MOCK_ENABLED: 'false',
			PUBLIC_API_BASE_URL: 'https://wikiforge-api.roselaqueen.fr',
			PUBLIC_WIKIFORGE_API_BASE_URL: 'https://api.wikiforge.fr',
			PUBLIC_CARDS_API_BASE_URL: 'https://api.wikiforge.fr'
	}
}));

import { apiRequest } from './client';

describe('apiRequest public API transport', () => {
	it('uses the legacy API by default', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

		await apiRequest('/api/friends/friend-1', {
			method: 'DELETE',
			fetch: fetcher as typeof fetch
		});

		expect(fetcher).toHaveBeenCalledWith(
			'https://wikiforge-api.roselaqueen.fr/api/friends/friend-1',
			expect.objectContaining({ method: 'DELETE', credentials: 'include' })
		);
	});

	it('uses the canonical WikiForge API only when the endpoint requests it', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

		await apiRequest('/me', { fetch: fetcher as typeof fetch, apiTarget: 'wikiforge' });

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/me',
			expect.objectContaining({ credentials: 'include' })
		);
	});
});
