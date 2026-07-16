import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import { getMarketListings } from './sales';

describe('market sales', () => {
	beforeEach(() => apiRequest.mockReset());

	it('uses the variant card embedded in each sale', async () => {
		apiRequest.mockResolvedValueOnce({
			results: [
				{
					id: 'sale-uuid',
					sellerId: 'seller-uuid',
					sellerName: 'Vendeur',
					cardId: 'variant-uuid',
					card: {
						id: 'variant-uuid',
						baseCardId: 42,
						variant: 'FULL_ART',
						isFullArt: true,
						wikipediaTitle: 'Carte Full Art',
						imageUrl: '/card-placeholder.svg',
						rarity: 'L'
					},
					price: 50,
					currency: 'EUR',
					type: 'direct',
					bidCount: 0,
					status: 'active'
				}
			],
			page: 0,
			nbResults: 1,
			size: 20
		});

		const listings = await getMarketListings();

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(listings[0]).toMatchObject({
			cardId: 'variant-uuid',
			card: { id: 'variant-uuid', variant: 'FULL_ART', isFullArt: true }
		});
	});
});
