import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_MOCK_ENABLED: 'false',
		PUBLIC_WIKIFORGE_API_BASE_URL: 'https://api.wikiforge.fr'
	}
}));

import { getWikiForgeTags } from './wikiforge';

describe('WikiForge tags read API', () => {
	it('loads numeric tags from the canonical API and adapts their ids for the UI', async () => {
		const fetcher = vi.fn(async () => Response.json([{ id: 7, name: 'Favori', color: '#feb823' }]));

		await expect(getWikiForgeTags({ fetch: fetcher as typeof fetch })).resolves.toEqual([
			{ id: '7', name: 'Favori', color: '#feb823' }
		]);
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/tags',
			expect.objectContaining({ credentials: 'include' })
		);
	});
});
