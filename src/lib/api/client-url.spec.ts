import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api/public-env', () => ({
		env: {
			PUBLIC_API_MOCK_ENABLED: 'false',
			PUBLIC_WIKIFORGE_API_BASE_URL: 'https://api.wikiforge.fr'
	}
}));

import { apiRequest } from './client';

describe('apiRequest public API transport', () => {
	it('uses the WikiForge API by default', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

		await apiRequest('/friends/1', {
			method: 'DELETE',
			fetch: fetcher as typeof fetch
		});

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/friends/1',
			expect.objectContaining({ method: 'DELETE', credentials: 'include' })
		);
	});

	it('keeps the explicit WikiForge target compatible', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

		await apiRequest('/me', { fetch: fetcher as typeof fetch, apiTarget: 'wikiforge' });

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/me',
			expect.objectContaining({ credentials: 'include' })
		);
	});
});
