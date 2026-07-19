import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import { createSale, getMarketListings } from './sales';

describe('market sales', () => {
	beforeEach(() => apiRequest.mockReset());

	it('uses the variant card embedded in each sale', async () => {
		apiRequest
			.mockResolvedValueOnce({
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
			})
			.mockResolvedValueOnce([
				{
					cardId: 'variant-uuid',
					ownedCount: 2,
					wishlists: [{ id: 'wishlist-1', title: 'Priorités', defaultList: false }],
					owners: []
				}
			]);

		const listings = await getMarketListings();

		expect(apiRequest).toHaveBeenCalledTimes(2);
		expect(listings[0]).toMatchObject({
			cardId: 'variant-uuid',
			card: {
				id: 'variant-uuid',
				variant: 'FULL_ART',
				isFullArt: true,
				ownedCount: 2,
				wishlistMemberships: [{ id: 'wishlist-1' }]
			}
		});
	});

	it('does not send obsolete type or maximum-price filters', async () => {
		apiRequest.mockResolvedValueOnce({ results: [] });
		await getMarketListings({ query: 'card' });
		expect(apiRequest).toHaveBeenCalledWith('/api/sales?page=0&size=100&q=card', undefined);
	});

	it('creates a sale for one owned card with the exact API payload', async () => {
		apiRequest.mockResolvedValueOnce({
			id: 'sale-created',
			sellerId: 'demo-user',
			cardId: 'variant-uuid',
			userCardId: 'user-card-uuid',
			card: {
				id: 'variant-uuid',
				variant: 'NORMAL',
				isFullArt: false,
				wikipediaTitle: 'Carte',
				imageUrl: '',
				rarity: 'R'
			},
			price: 10,
			currentPrice: 10,
			minimumBid: 11,
			currency: 'CREDITS',
			type: 'auction',
			status: 'active'
		});

		const input = {
			userCardId: 'user-card-uuid',
			type: 'auction' as const,
			price: 10,
			durationMinutes: 60 as const
		};
		const sale = await createSale(input);

		expect(apiRequest).toHaveBeenCalledWith('/api/sales', {
			method: 'POST',
			body: input
		});
		expect(sale).toMatchObject({ userCardId: input.userCardId, minimumBid: 11 });
	});
});
