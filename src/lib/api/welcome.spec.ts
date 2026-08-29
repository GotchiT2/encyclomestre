import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import { getWikiForgeWelcome } from './welcome';

describe('WikiForge welcome API', () => {
	beforeEach(() => vi.mocked(apiRequest).mockReset());

	it('loads the aggregate welcome payload and maps recent CardDTO cards', async () => {
		vi.mocked(apiRequest).mockResolvedValueOnce({
			boostersStatus: { available: 2, max: 10, nextAvailableAt: null },
			collection: {
				nbCards: 12,
				recent: [
					{ id: 8, pageId: 42, title: 'Rose', rarity: 'SR', ownedCount: 3, rarityCounts: { SR: 3 } }
				]
			},
			pendingTrades: 0,
			pendingAuction: 0,
			money: 350
		});

		await expect(getWikiForgeWelcome()).resolves.toMatchObject({
			collection: { uniqueCards: 12 },
			boosterStatus: { availableBoosters: 2 },
			money: 350,
			recentAcquisitions: [
				expect.objectContaining({ id: '8', ownedCount: 3, rarityCounts: { SR: 3 } })
			]
		});
		expect(apiRequest).toHaveBeenCalledWith('/welcome', { apiTarget: 'wikiforge' });
	});
});
