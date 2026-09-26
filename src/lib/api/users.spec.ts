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
	blockUser,
	createFriendRequest,
	getFriendCollectionPage,
	getFriendTags,
	getFriends,
	getTradePartners,
	getUserBlocks,
	searchUsers,
	updateWikiForgeMe,
	updateWikiForgeImage,
	unblockUser
} from './users';

describe('searchUsers', () => {
	beforeEach(() => apiRequest.mockReset());

	it('forwards the debounced text query without loading the full directory', async () => {
		apiRequest.mockResolvedValueOnce([]);

		await searchUsers('marie');

		expect(apiRequest).toHaveBeenCalledWith('/users?q=marie', { apiTarget: 'wikiforge' });
	});

	it('does not call the API below the three-character server threshold', async () => {
		await expect(searchUsers('ab')).resolves.toEqual([]);
		expect(apiRequest).not.toHaveBeenCalled();
	});

	it('treats an empty social payload as empty friend registers', async () => {
		apiRequest.mockResolvedValueOnce({});
		await expect(getFriends()).resolves.toEqual([]);
	});
});

describe('getTradePartners', () => {
	beforeEach(() => apiRequest.mockReset());

	it('uses the friendship registry instead of preloading the public user directory', async () => {
		apiRequest.mockResolvedValueOnce({
			friends: [{ id: 2, name: 'Alice', lastConnection: 'TODAY', sharesWishlist: true }],
			received: [],
			sent: [{ id: 3, name: 'Bob' }]
		});

		const partners = await getTradePartners('user-1');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/friends', { apiTarget: 'wikiforge' });
		expect(partners).toEqual([expect.objectContaining({ id: '2', username: 'Alice' })]);
	});
});

describe('user blocks', () => {
	beforeEach(() => apiRequest.mockReset());

	it('uses the canonical social endpoints', async () => {
		apiRequest.mockResolvedValueOnce([]).mockResolvedValue(undefined);

		await getUserBlocks();
		await blockUser('2');
		await unblockUser('2');

		expect(apiRequest).toHaveBeenNthCalledWith(1, '/blocks', { apiTarget: 'wikiforge' });
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/blocks/2', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/blocks/2', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
	});

	it('treats an empty blocked-user payload as an empty registry', async () => {
		apiRequest.mockResolvedValueOnce({});
		await expect(getUserBlocks()).resolves.toEqual([]);
		expect(apiRequest).toHaveBeenCalledWith('/blocks', { apiTarget: 'wikiforge' });
	});

	it('maps the three friend lists and uses user identifiers in social mutations', async () => {
		apiRequest.mockResolvedValueOnce({
			friends: [{ id: 2, name: 'Alice', lastConnection: 'TODAY', sharesWishlist: true }],
			received: [{ id: 3, name: 'Bob' }],
			sent: [{ id: 4, name: 'Chloé' }]
		});
		const friendships = await getFriends();
		await createFriendRequest('ignored', '4');

		expect(friendships).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: '2',
					status: 'accepted',
					user: expect.objectContaining({
						id: '2',
						username: 'Alice',
						lastConnection: 'TODAY',
						sharesWishlist: true
					})
				})
			])
		);

		expect(apiRequest).toHaveBeenNthCalledWith(1, '/friends', { apiTarget: 'wikiforge' });
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/friends/4', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
	});
});

describe('current user settings', () => {
	beforeEach(() => apiRequest.mockReset());

	it('updates only the fields accepted by PATCH /me', async () => {
		apiRequest.mockResolvedValueOnce({
			id: 1,
			name: 'Camille',
			email: 'camille@example.test',
			roles: ['USER'],
			imagePageId: 12,
			nsfw: false,
			safeWords: ['adulte'],
			createdAt: '2026-08-26T00:00:00Z'
		});

		await expect(
			updateWikiForgeMe({
				name: 'Camille',
				imagePageId: 12,
				nsfw: false,
				safeWords: ['adulte'],
				visibility: 'FRIENDS',
				mutedNotifications: ['SALE']
			})
		).resolves.toMatchObject({ username: 'Camille', imagePageId: 12, safeWords: ['adulte'] });
		expect(apiRequest).toHaveBeenCalledWith('/me', {
			apiTarget: 'wikiforge',
			method: 'PATCH',
			body: {
				name: 'Camille',
				imagePageId: 12,
				nsfw: false,
				safeWords: ['adulte'],
				visibility: 'FRIENDS',
				mutedNotifications: ['SALE']
			}
		});
	});

	it('updates the avatar through the dedicated endpoint', async () => {
		apiRequest.mockResolvedValueOnce({
			id: 1,
			name: 'Camille',
			email: 'camille@example.test',
			roles: ['USER'],
			imagePageId: 12,
			createdAt: '2026-08-26T00:00:00Z'
		});
		await updateWikiForgeImage(12);
		expect(apiRequest).toHaveBeenCalledWith('/me/image', {
			apiTarget: 'wikiforge',
			method: 'PATCH',
			body: { imagePageId: 12 }
		});
	});
});

describe('friend collection', () => {
	beforeEach(() => apiRequest.mockReset());

	it('uses the canonical read-only friend collection and tag endpoints', async () => {
		apiRequest
			.mockResolvedValueOnce({
				nbResults: 1,
				page: 0,
				results: [{ id: 81, pageId: 42, title: 'Rose', variantId: 1, packId: 1 }],
				nextCursor: null,
				hasNext: false
			})
			.mockResolvedValueOnce([{ id: 3, name: 'Échange', color: '#abc' }]);

		await expect(getFriendCollectionPage('7', { wishlistOwnerId: '1' })).resolves.toMatchObject({
			items: [expect.objectContaining({ id: '81', catalogueId: '42' })]
		});
		await expect(getFriendTags('7')).resolves.toEqual([
			{ id: '3', name: 'Échange', color: '#abc' }
		]);
		expect(apiRequest).toHaveBeenNthCalledWith(
			1,
			'/friends/7/collection?sortBy=ACQUIRED_DATE&wishlist=1',
			{ apiTarget: 'wikiforge' }
		);
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/friends/7/tags', {
			apiTarget: 'wikiforge'
		});
	});
});
