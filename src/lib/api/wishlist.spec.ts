import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import {
	acceptWishlistInvitation,
	addWishlistRegistryCard,
	createWishlistRegistry,
	deleteWishlistRegistry,
	getWishlistFollowers,
	getWishlistGroups,
	getWishlistPage,
	inviteWishlistFollower,
	leaveWishlist,
	removeWishlistRegistryCard,
	revokeWishlistFollower,
	updateWishlistRegistry
} from './wishlist';

const mockedRequest = vi.mocked(apiRequest);

beforeEach(() => mockedRequest.mockReset());

describe('WikiForge wishlist API', () => {
	it('maps owned, shared and pending lists from the canonical API', async () => {
		mockedRequest.mockResolvedValue({
			owned: [{ id: 1, name: 'Priorités', description: '', nbCards: 3, image: 'Priorités.jpg' }],
			shared: [{ id: 2, name: 'Partagée', nbCards: 2, ownerName: 'SoneS9' }],
			pending: [{ id: 3, name: 'Invitation', ownerName: 'OnMyGhost' }]
		});

		const groups = await getWishlistGroups();

		expect(mockedRequest).toHaveBeenCalledWith('/wishlists', { apiTarget: 'wikiforge' });
		expect(groups.owned[0]).toMatchObject({
			id: '1',
			cardCount: 3,
			access: 'owned',
			imageUrl: 'https://fr.wikipedia.org/wiki/Special:FilePath/Priorit%C3%A9s.jpg?width=250'
		});
		expect(groups.shared[0]).toMatchObject({ ownerName: 'SoneS9', access: 'shared' });
		expect(groups.pending[0]).toMatchObject({ access: 'pending' });
	});

	it('searches and maps one paginated wishlist page', async () => {
		mockedRequest.mockResolvedValue({
			nbResults: 51,
			page: 0,
			sortBy: 'RARITY',
			sortDirection: 'DESC',
			results: [
				{
					addedAt: '2026-08-20T12:00:00Z',
					page: {
						id: 42,
						title: 'Paris',
						description: 'Capitale',
						image: 'Paris.jpg',
						atk: 120,
						viewCount: 1000,
						rarity: 'L',
						createdAt: '2026-08-18T12:00:00Z',
						globalCount: 3
					}
				}
			]
		});

		const result = await getWishlistPage('1', {
			query: 'Paris',
			rarities: ['Légendaire', 'Rare'],
			sortBy: 'rarity',
			sortDirection: 'DESC'
		});

		expect(mockedRequest).toHaveBeenCalledWith(
			'/wishlists/1?page=0&sortBy=RARITY&sortDirection=DESC&q=Paris&rarity=L&rarity=R',
			{ apiTarget: 'wikiforge' }
		);
		expect(result.meta).toEqual({ page: 1, pageSize: 1, total: 51, totalPages: 51 });
		expect(result.items[0]).toMatchObject({ card: { id: '42', title: 'Paris' } });
	});

	it.each([
		['an empty payload', undefined],
		[
			'a null results collection',
			{ nbResults: 0, page: 0, sortBy: 'ADDED_AT', sortDirection: 'DESC', results: null }
		]
	])('maps %s to an empty wishlist page', async (_label, response) => {
		mockedRequest.mockResolvedValue(response);

		await expect(getWishlistPage('12')).resolves.toEqual({
			items: [],
			meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 }
		});
	});

	it('creates, updates and deletes lists with the Swagger payload', async () => {
		mockedRequest
			.mockResolvedValueOnce({ id: 4, name: 'Nouvelle', description: 'Test', nbCards: 0 })
			.mockResolvedValueOnce({ id: 4, name: 'Modifiée', description: '', nbCards: 0 })
			.mockResolvedValueOnce(undefined);

		await createWishlistRegistry('', { title: 'Nouvelle', description: 'Test' });
		await updateWishlistRegistry('4', { title: 'Modifiée', description: '' });
		await deleteWishlistRegistry('4');

		expect(mockedRequest).toHaveBeenNthCalledWith(1, '/wishlists', {
			apiTarget: 'wikiforge',
			method: 'POST',
			body: { name: 'Nouvelle', description: 'Test' }
		});
		expect(mockedRequest).toHaveBeenNthCalledWith(2, '/wishlists/4', {
			apiTarget: 'wikiforge',
			method: 'PATCH',
			body: { name: 'Modifiée', description: '', imagePageId: null }
		});
		expect(mockedRequest).toHaveBeenNthCalledWith(3, '/wishlists/4', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
	});

	it('adds and removes pages with idempotent endpoints', async () => {
		mockedRequest.mockResolvedValue(undefined);
		await addWishlistRegistryCard('1', '', '42');
		await removeWishlistRegistryCard('1', '', '42');
		expect(mockedRequest).toHaveBeenNthCalledWith(1, '/wishlists/1/pages/42', {
			apiTarget: 'wikiforge',
			method: 'PUT'
		});
		expect(mockedRequest).toHaveBeenNthCalledWith(2, '/wishlists/1/pages/42', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
	});

	it('supports invitations, followers, acceptance, leaving and revocation', async () => {
		mockedRequest
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce([{ id: 7, name: 'Ariane', accepted: false }])
			.mockResolvedValue(undefined);

		await inviteWishlistFollower('1', '7');
		await expect(getWishlistFollowers('1')).resolves.toEqual([
			{ id: '7', name: 'Ariane', accepted: false, imagePageId: null, imageUrl: null }
		]);
		await acceptWishlistInvitation('1');
		await leaveWishlist('1');
		await revokeWishlistFollower('1', '7');

		expect(mockedRequest).toHaveBeenNthCalledWith(1, '/wishlists/1/shares/7', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
		expect(mockedRequest).toHaveBeenNthCalledWith(3, '/wishlists/1/shares/accept', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
		expect(mockedRequest).toHaveBeenNthCalledWith(4, '/wishlists/1/shares', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
		expect(mockedRequest).toHaveBeenNthCalledWith(5, '/wishlists/1/shares/7', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
	});
});
