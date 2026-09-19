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
	cancelTradeOffer,
	counterTradeOffer,
	createTradeOffer,
	getTradeCards,
	getTradeOffer,
	getTradeOffers,
	respondToTradeOffer
} from './trades';

const apiCard = (id: number, pageId: number, title: string) => ({
	id,
	pageId,
	title,
	description: `${title} description`,
	image: `https://images.wikiforge.fr/${pageId}.jpg`,
	variantId: 1,
	packId: 1,
	atk: 42,
	alt: false,
	duplicate: false,
	protected: false,
	tagIds: []
});

const apiOffer = (id: number, status: 'PENDING' | 'ACCEPTED' = 'PENDING') => ({
	id,
	status,
	message: 'Une proposition précise',
	expiresAt: '2026-09-01T12:00:00Z',
	creationDate: '2026-08-27T10:00:00Z',
	modificationDate: '2026-08-27T11:00:00Z',
	initiator: { id: 11, name: 'Claire Trade', image: 'https://images.wikiforge.fr/claire.jpg' },
	recipient: { id: 22, name: 'Test' },
	offered: [{ card: apiCard(101, 1001, 'Carte proposée'), status: 'ADDED' as const }],
	requested: [{ card: apiCard(202, 2002, 'Carte retirée'), status: 'REMOVED' as const }],
	offeredMoney: 120,
	requestedMoney: 40,
	originalOfferedMoney: 100,
	originalRequestedMoney: 50
});

describe('WikiForge trades API', () => {
	beforeEach(() => apiRequest.mockReset());

	it('loads the three ledger groups with one authenticated WikiForge request', async () => {
		apiRequest.mockResolvedValue({
			received: [apiOffer(1)],
			sent: [apiOffer(2)],
			done: [apiOffer(3, 'ACCEPTED')]
		});

		const offers = await getTradeOffers();

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/trades?done=20', { apiTarget: 'wikiforge' });
		expect(offers).toEqual([
			expect.objectContaining({
				id: '1',
				initiatorId: '11',
				message: 'Une proposition précise',
				offeredCardIds: ['101'],
				requestedCardIds: [],
				offeredMoney: 120,
				requestedMoney: 40,
				cards: [
					expect.objectContaining({
						userCardId: '101',
						status: 'added',
						card: expect.objectContaining({
							id: '101',
							catalogueId: '1001',
							imageUrl: 'https://images.wikiforge.fr/1001.jpg'
						})
					}),
					expect.objectContaining({ userCardId: '202', status: 'removed' })
				]
			}),
			expect.objectContaining({ id: '2', status: 'pending' }),
			expect.objectContaining({ id: '3', status: 'accepted' })
		]);
	});

	it('loads a dedicated detail and reuses its embedded cards', async () => {
		apiRequest.mockResolvedValue(apiOffer(7));

		const detail = await getTradeOffer('7');
		const cards = await getTradeCards('7');

		expect(apiRequest).toHaveBeenNthCalledWith(1, '/trades/7', { apiTarget: 'wikiforge' });
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/trades/7', { apiTarget: 'wikiforge' });
		expect(detail.id).toBe('7');
		expect(cards.map((card) => card.userCardId)).toEqual(['101', '202']);
	});

	it('creates a trade with numeric identifiers and the Swagger body', async () => {
		apiRequest.mockResolvedValue(apiOffer(8));

		await createTradeOffer({
			initiatorId: '11',
			recipientId: '22',
			message: '  Proposition  ',
			offeredCardIds: ['101'],
			requestedCardIds: ['202'],
			offeredMoney: 10,
			requestedMoney: 20
		});

		expect(apiRequest).toHaveBeenCalledWith('/trades', {
			apiTarget: 'wikiforge',
			method: 'POST',
			body: {
				recipientId: 22,
				message: 'Proposition',
				offeredCardIds: [101],
				requestedCardIds: [202],
				offeredMoney: 10,
				requestedMoney: 20
			}
		});
	});

	it('uses the dedicated accept, decline, cancel and counter endpoints', async () => {
		apiRequest.mockResolvedValue(apiOffer(9));
		const input = {
			initiatorId: '11',
			recipientId: '22',
			message: 'Contre-proposition',
			offeredCardIds: ['202'],
			requestedCardIds: ['101'],
			offeredMoney: 30,
			requestedMoney: 5
		};

		await respondToTradeOffer('9', 'accepted');
		await respondToTradeOffer('9', 'declined');
		await cancelTradeOffer('9');
		await counterTradeOffer('9', input);

		expect(apiRequest).toHaveBeenNthCalledWith(1, '/trades/9/accept', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/trades/9/decline', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/trades/9/cancel', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(4, '/trades/9/counter', {
			apiTarget: 'wikiforge',
			method: 'POST',
			body: {
				message: 'Contre-proposition',
				offeredCardIds: [202],
				requestedCardIds: [101],
				offeredMoney: 30,
				requestedMoney: 5
			}
		});
	});

	it('rejects non-numeric identifiers before sending a request', async () => {
		await expect(getTradeOffer('trade/1')).rejects.toThrow(
			'Identifiant échange WikiForge invalide'
		);
		expect(apiRequest).not.toHaveBeenCalled();
	});
});
