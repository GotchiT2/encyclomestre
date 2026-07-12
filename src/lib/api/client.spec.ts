import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_MOCK_ENABLED: 'true' }
}));

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
});
