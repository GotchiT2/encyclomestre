import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_MOCK_ENABLED: 'false' }
}));

import { apiRequest } from './client';

describe('apiRequest same-origin transport', () => {
	it('sends DELETE requests through the local API proxy by default', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

		await apiRequest('/api/friends/friend-1', {
			method: 'DELETE',
			fetch: fetcher as typeof fetch
		});

		expect(fetcher).toHaveBeenCalledWith(
			'/api/friends/friend-1',
			expect.objectContaining({ method: 'DELETE', credentials: 'include' })
		);
	});
});
