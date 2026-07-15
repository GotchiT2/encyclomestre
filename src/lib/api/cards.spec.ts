import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getWikiForgeCards } = vi.hoisted(() => ({ getWikiForgeCards: vi.fn() }));

vi.mock('./wikiforge', () => ({
	getWikiForgeCards,
	getWikiForgeCard: vi.fn(),
	toCardRecord: vi.fn(),
	toCardPage: (page: unknown) => page
}));

import { getCards } from './cards';

describe('getCards', () => {
	beforeEach(() => getWikiForgeCards.mockReset());

	it('forwards pagination, repeated rarities and descending rarity order', async () => {
		getWikiForgeCards.mockResolvedValueOnce({
			items: [{ id: 'legendary' }],
			meta: { page: 2, pageSize: 12, total: 30, totalPages: 3 }
		});

		const cards = await getCards({
			page: 2,
			pageSize: 12,
			rarities: ['Légendaire', 'Rare'],
			sortBy: 'rarity',
			sortDirection: 'DESC'
		});

		expect(cards.items).toEqual([{ id: 'legendary' }]);
		expect(getWikiForgeCards).toHaveBeenCalledWith(
			expect.objectContaining({
				page: 1,
				size: 12,
				rarities: ['L', 'R'],
				sortBy: 'rarity',
				sortDirection: 'DESC'
			}),
			undefined
		);
	});
});
