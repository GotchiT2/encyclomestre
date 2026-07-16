import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import { getTradeCards, getTradeOffers } from './trades';

const apiOffer = (id: string, status: string) => ({
	id,
	initiatorId: 'user-1',
	recipientId: 'user-2',
	initiator: {
		id: 'user-1',
		username: 'claire.trade',
		displayName: 'Claire Trade'
	},
	recipient: {
		id: 'user-2',
		username: 'test',
		displayName: 'Test'
	},
	status,
	offeredUserCardIds: [`offered-${id}`],
	requestedUserCardIds: [`requested-${id}`],
	cards: [
		{
			userCardId: `offered-${id}`,
			side: 'offered',
			card: {
				id: `variant-${id}`,
				variant: 'NORMAL',
				isFullArt: false,
				wikipediaTitle: `Carte ${id}`,
				imageUrl: '/card-placeholder.svg',
				rarity: 'R'
			}
		}
	],
	offeredCredits: 10,
	requestedCredits: 5,
	createdAt: '2026-07-16T12:00:00Z'
});

describe('trade ledger', () => {
	beforeEach(() => {
		apiRequest.mockReset();
		apiRequest.mockImplementation((path: string) => {
			if (path === '/api/trades/received')
				return Promise.resolve([apiOffer('received', 'pending')]);
			if (path === '/api/trades/sended') return Promise.resolve([apiOffer('sent', 'pending')]);
			if (path === '/api/trades/history') return Promise.resolve([apiOffer('history', 'accepted')]);
			throw new Error(`Unexpected API path: ${path}`);
		});
	});

	it('loads and maps the received, sent and history endpoints', async () => {
		const offers = await getTradeOffers('ignored-session-user');

		expect(apiRequest).toHaveBeenCalledTimes(3);
		expect(apiRequest).toHaveBeenCalledWith('/api/trades/received', undefined);
		expect(apiRequest).toHaveBeenCalledWith('/api/trades/sended', undefined);
		expect(apiRequest).toHaveBeenCalledWith('/api/trades/history', undefined);
		expect(apiRequest).not.toHaveBeenCalledWith('/api/trades', expect.anything());
		expect(offers).toEqual([
			expect.objectContaining({
				id: 'received',
				offeredCardIds: ['offered-received'],
				cards: [
					expect.objectContaining({
						userCardId: 'offered-received',
						card: expect.objectContaining({
							id: 'offered-received',
							catalogueId: 'variant-received'
						})
					})
				],
				initiator: expect.objectContaining({ displayName: 'Claire Trade' })
			}),
			expect.objectContaining({ id: 'sent', requestedCardIds: ['requested-sent'] }),
			expect.objectContaining({ id: 'history', status: 'accepted' })
		]);
	});

	it('loads both sides with one request and preserves each user-card identity', async () => {
		apiRequest.mockReset();
		apiRequest.mockResolvedValueOnce([
			{
				userCardId: 'offered-copy-uuid',
				side: 'offered',
				card: {
					id: 'offered-variant-uuid',
					variant: 'NORMAL',
					isFullArt: false,
					wikipediaTitle: 'Carte proposée',
					imageUrl: '/card-placeholder.svg',
					rarity: 'R'
				}
			},
			{
				userCardId: 'requested-copy-uuid',
				side: 'requested',
				card: {
					id: 'requested-variant-uuid',
					variant: 'FULL_ART',
					isFullArt: true,
					wikipediaTitle: 'Carte demandée',
					imageUrl: '/card-placeholder.svg',
					rarity: 'L'
				}
			}
		]);

		const cards = await getTradeCards('trade/1');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/api/trades/trade%2F1/cards', undefined);
		expect(cards).toEqual([
			expect.objectContaining({
				userCardId: 'offered-copy-uuid',
				side: 'offered',
				card: expect.objectContaining({
					id: 'offered-copy-uuid',
					catalogueId: 'offered-variant-uuid'
				})
			}),
			expect.objectContaining({
				userCardId: 'requested-copy-uuid',
				side: 'requested',
				card: expect.objectContaining({
					id: 'requested-copy-uuid',
					catalogueId: 'requested-variant-uuid',
					isFullArt: true
				})
			})
		]);
	});
});
