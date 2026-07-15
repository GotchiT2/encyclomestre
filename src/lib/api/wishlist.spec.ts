import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import {
	deleteWishlistRegistry,
	removeWishlistEntry,
	removeWishlistRegistryCard
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
});
