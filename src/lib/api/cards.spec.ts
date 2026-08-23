import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest, getWikiForgeCard, getWikiForgeCards, toCardRecord } = vi.hoisted(() => ({
	apiRequest: vi.fn(),
	getWikiForgeCard: vi.fn(),
	getWikiForgeCards: vi.fn(),
	toCardRecord: vi.fn((card: unknown) => card)
}));

vi.mock('./client', () => ({ apiRequest }));

vi.mock('./wikiforge', () => ({
	getWikiForgeCards,
	getWikiForgeCard,
	toCardRecord,
	toCardPage: (page: unknown) => page
}));

import { getCard, getCards, getCardSocialStates } from './cards';

describe('getCards', () => {
	beforeEach(() => {
		getWikiForgeCard.mockReset();
		getWikiForgeCards.mockReset();
		toCardRecord.mockClear();
		apiRequest.mockReset();
		apiRequest.mockResolvedValue([]);
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
			variant: 'alternative',
			sortBy: 'rarity',
			sortDirection: 'DESC'
		});

		expect(cards.items).toEqual([{ id: 'legendary' }]);
		expect(getWikiForgeCards).toHaveBeenCalledWith(
			expect.objectContaining({
				page: 1,
				size: 12,
				rarities: ['L', 'R'],
				variant: 'alternative',
				sortBy: 'rarity',
				sortDirection: 'DESC'
			}),
			undefined
		);
		expect(apiRequest).not.toHaveBeenCalled();
	});

	it('reuses card details already requested by client-side wishlist views', async () => {
		getWikiForgeCard.mockResolvedValueOnce({ id: 'cache-card-42' });

		const [first, second] = await Promise.all([getCard('cache-card-42'), getCard('cache-card-42')]);

		expect(first).toEqual({ id: 'cache-card-42' });
		expect(second).toEqual(first);
		expect(getWikiForgeCard).toHaveBeenCalledOnce();
	});

	it('posts unique card ids in the social-state request body', async () => {
		apiRequest.mockResolvedValueOnce([
			{ cardId: 'card-1', ownedCount: 1, wishlists: [], owners: [] }
		]);

		const states = await getCardSocialStates(['card-1', 'card-1', 'card-2']);

		expect(apiRequest).toHaveBeenCalledWith('/api/cards/social-states', {
			method: 'POST',
			body: { cardIds: ['card-1', 'card-2'] }
		});
		expect(states.get('card-1')).toMatchObject({ ownedCount: 1 });
	});

	it('does not request personalized social states without an authenticated session', async () => {
		const localStorage = { getItem: vi.fn(() => null), removeItem: vi.fn() };
		vi.stubGlobal('localStorage', localStorage);

		const states = await getCardSocialStates(['card-1']);

		expect(states).toEqual(new Map());
		expect(apiRequest).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});
});
