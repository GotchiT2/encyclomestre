import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('./client', () => ({ apiRequest }));
vi.mock('./variants', async (importOriginal) => ({
	...(await importOriginal<typeof import('./variants')>()),
	getVariants: vi
		.fn()
		.mockResolvedValue([
			{ id: 1, name: 'Standard', color: '#b8f2d5', styles: ['NORMAL'], renderKey: 'standard' }
		])
}));

import {
	buyInstantSale,
	buyShowcaseSlot,
	cancelInstantSale,
	createInstantSale,
	getLeaderboard,
	getMyShowcase,
	getUserInstantSales,
	getUserProfile,
	replaceMyShowcase
} from './player-profile';

const card = {
	id: 12,
	pageId: 42,
	title: 'Rose',
	description: 'Fleur symbole de passion.',
	image: 'https://img.test/rose.jpg',
	variantId: 1,
	packId: 1,
	atk: 20,
	alt: false
};

describe('WikiForge player profile contracts', () => {
	beforeEach(() => apiRequest.mockReset());

	it('maps full and reduced profiles from /users/{id}', async () => {
		apiRequest.mockResolvedValueOnce({
			id: 7,
			name: 'Camille',
			joinedAt: '2026-03',
			lastConnection: 'THIS_WEEK',
			full: true,
			nbCards: 12,
			tags: [],
			showcase: [{ title: 'Top', cards: [card] }]
		});
		await expect(getUserProfile('7')).resolves.toMatchObject({
			id: '7',
			full: true,
			lastConnection: 'THIS_WEEK',
			showcase: [
				{ cards: [{ id: '12', imageUrl: card.image, shortDescription: card.description }] }
			]
		});
		expect(apiRequest).toHaveBeenCalledWith('/users/7', { apiTarget: 'wikiforge' });

		apiRequest.mockResolvedValueOnce({
			id: 8,
			name: 'Privé',
			joinedAt: '2026-04',
			full: false,
			nbCards: 3
		});
		await expect(getUserProfile('8')).resolves.toMatchObject({
			full: false,
			tags: [],
			showcase: []
		});
	});

	it('uses full replacement and slot purchase contracts', async () => {
		apiRequest.mockResolvedValue({
			slots: 3,
			maxSlots: 4,
			usedSlots: 1,
			slotPrice: 100,
			lines: [{ title: 'Top', cards: [card] }]
		});
		await getMyShowcase();
		await replaceMyShowcase([{ title: ' Top ', cardIds: ['12'] }]);
		await buyShowcaseSlot();
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/me/showcase', { apiTarget: 'wikiforge' });
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/me/showcase', {
			apiTarget: 'wikiforge',
			method: 'PUT',
			body: { lines: [{ title: 'Top', cardIds: [12] }] }
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/me/showcase/slots', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
	});

	it('connects every fixed-price sale endpoint', async () => {
		apiRequest.mockResolvedValue({ instantSales: [{ id: 5, price: 250, card }] });
		await expect(getUserInstantSales('7')).resolves.toMatchObject({
			instantSales: [{ id: '5', price: 250 }]
		});
		await createInstantSale('12', 250);
		await cancelInstantSale('5');
		await buyInstantSale('5');
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/users/7/sales', { apiTarget: 'wikiforge' });
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/me/sales', {
			apiTarget: 'wikiforge',
			method: 'POST',
			body: { cardId: 12, price: 250 }
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/me/sales/5', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(4, '/sales/5/buy', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
	});

	it.each(['global', 'daily', 'weekly'] as const)(
		'loads the %s leaderboard without parameters',
		async (period) => {
			apiRequest.mockResolvedValueOnce({ top: [{ rank: 1, id: 7, name: 'Camille', nbCards: 42 }] });
			await expect(getLeaderboard(period)).resolves.toMatchObject({
				top: [{ id: '7', rank: 1 }],
				around: []
			});
			expect(apiRequest).toHaveBeenCalledWith(`/leaderboards/${period}`, {
				apiTarget: 'wikiforge'
			});
		}
	);

	it('maps leaderboard cache metadata without a rarity filter', async () => {
		apiRequest.mockResolvedValueOnce({
			top: [],
			computedAt: '2026-09-07T10:00:00',
			refreshAt: '2026-09-07T10:05:00'
		});
		await expect(getLeaderboard('global')).resolves.toMatchObject({
			computedAt: '2026-09-07T10:00:00.000Z',
			refreshAt: '2026-09-07T10:05:00.000Z'
		});
		expect(apiRequest).toHaveBeenCalledWith('/leaderboards/global', { apiTarget: 'wikiforge' });
	});
});
