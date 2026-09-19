import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request, variants } = vi.hoisted(() => ({
	request: vi.fn(),
	variants: [{ id: 2, name: 'Chrome', color: '#b1cff2', styles: ['CHROME'], renderKey: 'chrome' }]
}));
vi.mock('./client', () => ({ apiRequest: request }));
vi.mock('./variants', async (importOriginal) => ({
	...(await importOriginal<typeof import('./variants')>()),
	getVariants: vi.fn().mockResolvedValue(variants)
}));

import { getBoosters, openBooster } from './boosters';

describe('booster API', () => {
	beforeEach(() => request.mockReset());

	it('maps every active pack returned by the API', async () => {
		request.mockResolvedValue([
			{
				id: 4,
				name: 'Chrome annuel',
				description: 'Cinq cartes',
				image: '/chrome.png',
				imageAttribution: { sourceUrl: 'https://example.test/source', author: 'WikiForge' },
				nbCards: 5,
				available: 2,
				max: 3,
				nextAvailableAt: null
			}
		]);

		await expect(getBoosters()).resolves.toEqual([
			expect.objectContaining({
				id: 4,
				imageUrl: '/chrome.png',
				available: 2,
				imageAttribution: { sourceUrl: 'https://example.test/source', author: 'WikiForge' }
			})
		]);
		expect(request).toHaveBeenCalledWith('/boosters', { apiTarget: 'wikiforge' });
	});

	it('opens the selected pack and preserves the response order', async () => {
		request.mockResolvedValue({
			packId: 4,
			cards: [
				{ id: 9, pageId: 90, title: 'Première', variantId: 2, packId: 4 },
				{
					id: 3,
					pageId: 30,
					title: 'Spéciale',
					variantId: 2,
					packId: 4,
					serialNumber: 1,
					maxCopies: 10
				}
			]
		});

		const result = await openBooster(4);
		expect(request).toHaveBeenCalledWith('/boosters/4/open', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
		expect(result.cards.map((card) => card.id)).toEqual(['9', '3']);
		expect(result.cards[1]).toMatchObject({ serialNumber: 1, maxCopies: 10 });
	});
});
