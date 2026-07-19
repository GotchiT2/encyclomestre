import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import {
	deleteWishlistRegistry,
	getWishlist,
	getWishlistRegistryCards,
	getPublicWishlists,
	getPublicWishlistsState,
	getWishlists,
	removeWishlistEntry,
	removeWishlistRegistryCard,
	updateWishlistRegistry
} from './wishlist';

describe('wishlist deletions', () => {
	beforeEach(() => {
		apiRequest.mockReset();
		apiRequest.mockResolvedValue(undefined);
	});

	it('removes a card from the simple wishlist through its DELETE endpoint', async () => {
		await removeWishlistEntry('user-1', '42');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/api/wishlist/42', { method: 'DELETE' });
	});

	it('removes a card from a named wishlist without a follow-up reload', async () => {
		await removeWishlistRegistryCard('list/1', 'user-1', '42');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/api/wishlists/list%2F1/cards/42', {
			method: 'DELETE'
		});
	});

	it('deletes the selected named wishlist through its own endpoint', async () => {
		await deleteWishlistRegistry('list/2', 'user-1');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/api/wishlists/list%2F2', { method: 'DELETE' });
	});

	it('uses the hydrated variant cards returned by the paginated wishlist', async () => {
		apiRequest.mockResolvedValueOnce({
			results: [
				{
					cardId: 'variant-uuid',
					priority: 'high',
					note: null,
					createdAt: '2026-07-16T08:00:00Z',
					updatedAt: '2026-07-16T08:00:00Z',
					card: {
						id: 'variant-uuid',
						baseCardId: 42,
						variant: 'FULL_ART',
						isFullArt: true,
						wikipediaTitle: 'Carte légendaire',
						imageUrl: '/card-placeholder.svg',
						rarity: 'L'
					}
				}
			],
			page: 0,
			nbResults: 1,
			size: 20
		});

		const wishlist = await getWishlist('user-1', {
			page: 1,
			pageSize: 20,
			variant: 'alternative'
		});

		expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('variant=FULL_ART'), undefined);
		expect(wishlist.items[0]).toMatchObject({
			cardId: 'variant-uuid',
			card: { id: 'variant-uuid', isFullArt: true, variant: 'FULL_ART' }
		});
	});

	it('hydrates named wishlists without requesting each card separately', async () => {
		apiRequest.mockResolvedValueOnce([
			{
				id: 'wishlist-uuid',
				userId: 'user-1',
				title: 'Priorités',
				description: '',
				cardIds: ['variant-uuid'],
				cards: [
					{
						id: 'variant-uuid',
						baseCardId: 42,
						variant: 'NORMAL',
						isFullArt: false,
						wikipediaTitle: 'Carte normale',
						imageUrl: '/card-placeholder.svg',
						rarity: 'L'
					}
				],
				opportunityCount: 0,
				createdAt: '',
				updatedAt: ''
			}
		]);

		const lists = await getWishlists('user-1');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(lists[0]).toMatchObject({
			cardIds: ['variant-uuid'],
			cards: [{ id: 'variant-uuid', variant: 'NORMAL' }]
		});
	});

	it('loads every detailed card of a named wishlist in one request', async () => {
		apiRequest.mockResolvedValueOnce([
			{
				id: 'variant-full-art',
				baseCardId: 42,
				variant: 'FULL_ART',
				isFullArt: true,
				wikipediaTitle: 'Carte légendaire',
				imageUrl: '/card-placeholder.svg',
				rarity: 'L',
				category: 'Histoire',
				atk: 90,
				def: 80
			}
		]);

		const cards = await getWishlistRegistryCards('list/1');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/api/wishlists/list%2F1/cards', undefined);
		expect(cards[0]).toMatchObject({
			id: 'variant-full-art',
			variant: 'FULL_ART',
			isFullArt: true,
			title: 'Carte légendaire',
			attack: 90,
			defense: 80
		});
	});

	it('updates visibility and hydrates public wishlist ownership', async () => {
		apiRequest
			.mockResolvedValueOnce({
				id: 'wishlist-uuid',
				userId: 'user-1',
				title: 'Publique',
				description: '',
				isPublic: true,
				cardIds: [],
				cards: [],
				opportunityCount: 0,
				createdAt: '',
				updatedAt: ''
			})
			.mockResolvedValueOnce([
				{
					id: 'wishlist-uuid',
					userId: 'friend-1',
					title: 'Publique',
					description: '',
					updatedAt: '',
					cards: [
						{
							card: {
								id: 'variant-1',
								variant: 'NORMAL',
								isFullArt: false,
								wikipediaTitle: 'Carte',
								imageUrl: '',
								rarity: 'R'
							},
							viewerOwnedCount: 1,
							viewerUserCardIds: ['user-card-1']
						}
					]
				}
			]);

		await updateWishlistRegistry('wishlist-uuid', {
			title: 'Publique',
			description: '',
			isPublic: true
		});
		const publicLists = await getPublicWishlists('friend-1');

		expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/wishlists/wishlist-uuid', {
			method: 'PATCH',
			body: { title: 'Publique', description: '', isPublic: true }
		});
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/users/friend-1/wishlists', undefined);
		expect(publicLists[0].cards[0]).toMatchObject({
			viewerOwnedCount: 1,
			viewerUserCardIds: ['user-card-1'],
			card: { id: 'variant-1' }
		});
	});

	it('keeps the public profile available when public wishlists fail', async () => {
		apiRequest.mockRejectedValueOnce(new Error('API 500'));

		await expect(getPublicWishlistsState('friend-1')).resolves.toEqual({
			items: [],
			unavailable: true
		});
	});
});
