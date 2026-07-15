import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getWikiForgeCards } = vi.hoisted(() => ({ getWikiForgeCards: vi.fn() }));

vi.mock('./wikiforge', () => ({
	getWikiForgeCards,
	getWikiForgeCard: vi.fn(),
	toCardRecord: vi.fn(),
	toCardPage: (page: unknown) => page
}));

import { getAllCards } from './cards';

describe('getAllCards', () => {
	beforeEach(() => getWikiForgeCards.mockReset());

	it('loads every catalogue page in descending rarity order', async () => {
		getWikiForgeCards
			.mockResolvedValueOnce({
				items: [{ id: 'legendary' }],
				meta: { page: 1, pageSize: 100, total: 101, totalPages: 2 }
			})
			.mockResolvedValueOnce({
				items: [{ id: 'common' }],
				meta: { page: 2, pageSize: 100, total: 101, totalPages: 2 }
			});

		const cards = await getAllCards({ sortBy: 'rarity', sortDirection: 'DESC' });

		expect(cards).toEqual([{ id: 'legendary' }, { id: 'common' }]);
		expect(getWikiForgeCards).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({ page: 0, size: 100, sortBy: 'rarity', sortDirection: 'DESC' }),
			undefined
		);
		expect(getWikiForgeCards).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ page: 1, size: 100, sortBy: 'rarity', sortDirection: 'DESC' }),
			undefined
		);
	});
});
