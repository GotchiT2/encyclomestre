import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));
vi.mock('./variants', async (importOriginal) => ({
	...(await importOriginal<typeof import('./variants')>()),
	getVariants: vi
		.fn()
		.mockResolvedValue([
			{ id: 1, name: 'Standard', color: '#b8f2d5', styles: ['NORMAL'], renderKey: 'standard' }
		])
}));

import { apiRequest } from './client';
import { getWikiForgeWelcome } from './welcome';

describe('WikiForge welcome API', () => {
	beforeEach(() => vi.mocked(apiRequest).mockReset());

	it('loads the aggregate welcome payload and maps recent CardDTO cards', async () => {
		vi.mocked(apiRequest).mockResolvedValueOnce({
			boosters: {
				families: [{ family: 'NORMAL', available: 2, max: 10, bonus: 1 }],
				slots: [
					{
						id: 1,
						name: 'Quotidien',
						pack: {
							id: 3,
							name: 'Quotidien',
							description: 'Cinq cartes',
							family: 'NORMAL',
							nbCards: 5,
							openAll: true
						}
					}
				]
			},
			collection: {
				nbCards: 12,
				rank: 412,
				recent: [{ id: 8, pageId: 42, title: 'Rose', variantId: 1, packId: 3, ownedCount: 3 }]
			},
			pendingTrades: 0,
			pendingAuction: 0,
			money: 350
		});

		await expect(getWikiForgeWelcome()).resolves.toMatchObject({
			collection: { totalCopies: 12 },
			rank: 412,
			packs: [expect.objectContaining({ id: 3, available: 3, bonus: 1 })],
			money: 350,
			recentAcquisitions: [expect.objectContaining({ id: '8', ownedCount: 3, variantId: 1 })]
		});
		expect(apiRequest).toHaveBeenCalledWith('/welcome', { apiTarget: 'wikiforge' });
	});
});
