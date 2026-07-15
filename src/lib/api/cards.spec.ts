import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getWikiForgeCard, getWikiForgeCards, toCardRecord } = vi.hoisted(() => ({
	getWikiForgeCard: vi.fn(),
	getWikiForgeCards: vi.fn(),
	toCardRecord: vi.fn((card: unknown) => card)
}));

vi.mock('./wikiforge', () => ({
	getWikiForgeCards,
	getWikiForgeCard,
	toCardRecord,
	toCardPage: (page: unknown) => page
}));

import { getCard, getCards } from './cards';

describe('getCards', () => {
	beforeEach(() => {
		getWikiForgeCard.mockReset();
		getWikiForgeCards.mockReset();
		toCardRecord.mockClear();
	});

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

	it('reuses card details already requested by client-side wishlist views', async () => {
		getWikiForgeCard.mockResolvedValueOnce({ id: 'cache-card-42' });

		const [first, second] = await Promise.all([getCard('cache-card-42'), getCard('cache-card-42')]);

		expect(first).toEqual({ id: 'cache-card-42' });
		expect(second).toEqual(first);
		expect(getWikiForgeCard).toHaveBeenCalledOnce();
	});
});
