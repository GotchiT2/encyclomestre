import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_MOCK_ENABLED: 'false',
		PUBLIC_WIKIFORGE_API_BASE_URL: 'https://api.wikiforge.fr'
	}
}));

import { getBoosterInventory, openBooster } from './boosters';

afterEach(() => vi.unstubAllGlobals());

describe('WikiForge boosters API', () => {
	it('loads the inventory from the canonical endpoint', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({ available: 3, max: 10, nextAvailableAt: '2026-08-23T12:00:00Z' })
		);

		await expect(
			getBoosterInventory(undefined, { fetch: fetcher as typeof fetch })
		).resolves.toEqual({
			available: 3,
			capacity: 10,
			nextRechargeAt: '2026-08-23T12:00:00Z'
		});
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/boosters',
			expect.objectContaining({ credentials: 'include' })
		);
	});

	it('uses the opening response directly without reloading the inventory', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				available: 2,
				max: 10,
				nextAvailableAt: '2026-08-23T12:00:00Z',
				cards: [
					{
						id: 8818,
						pageId: 12208062,
						title: 'Rose Thisse-Derouette',
						description: 'Compositrice belge',
						image: 'https://images.wikiforge.test/Rose%20Thisse%20Derouette.jpg',
						rarity: 'SR',
						atk: 70,
						alt: true,
						duplicate: true,
						protected: true,
						tagIds: [4, 9],
						acquiredDate: '2026-08-23T11:00:00Z',
						creationDate: '2026-08-23T11:00:00Z',
						pendingTradeId: 12,
						ownedCount: 4,
						rarityCounts: { SR: 3, R: 1 }
					}
				]
			})
		);

		const result = await openBooster(undefined, { fetch: fetcher as typeof fetch });

		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/boosters/open',
			expect.objectContaining({ method: 'POST', credentials: 'include' })
		);
		expect(result.inventory).toEqual({
			available: 2,
			capacity: 10,
			nextRechargeAt: '2026-08-23T12:00:00Z'
		});
		expect(result.pulls[0]?.card).toMatchObject({
			id: '8818',
			catalogueId: '12208062',
			variant: 'FULL_ART',
			title: 'Rose Thisse-Derouette',
			imageUrl: 'https://images.wikiforge.test/Rose%20Thisse%20Derouette.jpg',
			collectionTagIds: ['4', '9'],
			duplicate: true,
			userProtected: true,
			pendingTradeId: '12',
			ownedCount: 4,
			rarityCounts: { SR: 3, R: 1 }
		});
	});
});
