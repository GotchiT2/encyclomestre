import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import { getTradeOffers } from './trades';

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
				initiator: expect.objectContaining({ displayName: 'Claire Trade' })
			}),
			expect.objectContaining({ id: 'sent', requestedCardIds: ['requested-sent'] }),
			expect.objectContaining({ id: 'history', status: 'accepted' })
		]);
	});
});
