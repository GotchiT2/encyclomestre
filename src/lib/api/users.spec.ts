import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import {
	blockUser,
	createFriendRequest,
	getFriendCollectionPage,
	getFriendTags,
	getFriends,
	getOwnedCollectionCards,
	getTradePartners,
	getUserBlocks,
	getUserCollection,
	getUserCollectionCopies,
	getUserCollectionCounts,
	getUserCollectionPage,
	searchUsers,
	updateWikiForgeMe,
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

describe('getUserCollection', () => {
	beforeEach(() => apiRequest.mockReset());

	it('loads every page and keeps the user-card UUID as the rendered card identity', async () => {
		const card = (userCardId: string, cardId: string, title: string) => ({
			userCardId,
			cardId,
			acquiredAt: '2026-07-16T12:00:00Z',
			tags: [],
			card: {
				id: cardId,
				variant: 'NORMAL',
				wikipediaTitle: title,
				imageUrl: '/card-placeholder.svg',
				rarity: 'C',
				isFullArt: false
			}
		});
		apiRequest
			.mockResolvedValueOnce({
				results: [card('user-card-1', 'variant-1', 'Première carte')],
				page: 0,
				nbResults: 101,
				size: 100
			})
			.mockResolvedValueOnce({
				results: [card('user-card-2', 'variant-2', 'Dernière carte')],
				page: 1,
				nbResults: 101,
				size: 100
			});

		const collection = await getUserCollection('user-2');

		expect(apiRequest).toHaveBeenNthCalledWith(
			1,
			'/api/users/user-2/collection?page=0&size=100',
			undefined
		);
		expect(apiRequest).toHaveBeenNthCalledWith(
			2,
			'/api/users/user-2/collection?page=1&size=100',
			undefined
		);
		expect(collection).toEqual([
			expect.objectContaining({ id: 'user-card-1', catalogueId: 'variant-1' }),
			expect.objectContaining({ id: 'user-card-2', catalogueId: 'variant-2' })
		]);
	});

	it('loads one filtered page without preloading the remaining collection', async () => {
		apiRequest.mockResolvedValueOnce({ results: [], page: 1, nbResults: 42, size: 12 });

		const result = await getUserCollectionPage('user-2', {
			query: 'winter',
			rarities: ['Rare'],
			variant: 'alternative',
			sortBy: 'name',
			page: 1,
			pageSize: 12
		});

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith(
			'/api/users/user-2/collection?page=1&size=12&sortBy=NAME&sortDirection=ASC&variant=FULL_ART&q=winter&rarity=R',
			undefined
		);
		expect(result.meta).toEqual({ page: 2, pageSize: 12, total: 42, totalPages: 4 });
	});

	it('maps an empty filtered collection response without throwing', async () => {
		apiRequest.mockResolvedValueOnce({ results: null, page: 0, nbResults: 0, size: 12 });

		await expect(getUserCollectionPage('user-2', { query: 'absente' })).resolves.toEqual({
			items: [],
			meta: { page: 1, pageSize: 12, total: 0, totalPages: 1 }
		});
	});

	it('forwards relevance and the collection cursor for the next search page', async () => {
		apiRequest.mockResolvedValueOnce({
			results: [],
			page: 2,
			nbResults: 80,
			size: 12,
			nextCursor: 'cursor-after-page-2'
		});

		const result = await getUserCollectionPage('user-2', {
			query: 'Rose',
			page: 2,
			pageSize: 12,
			cursor: 'cursor-for-page-2'
		});

		expect(apiRequest).toHaveBeenCalledWith(
			'/api/users/user-2/collection?page=2&size=12&sortBy=RELEVANCE&sortDirection=DESC&variant=ALL&q=Rose&cursor=cursor-for-page-2',
			undefined
		);
		expect(result.meta.nextCursor).toBe('cursor-after-page-2');
	});

	it('resolves prefilled cards with one batch request per owner', async () => {
		apiRequest.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce({});

		await getOwnedCollectionCards(['copy-1', 'copy-2']);
		await getUserCollectionCopies('user-2', ['variant-1', 'variant-2']);
		await getUserCollectionCounts('user-2', ['variant-1', 'variant-2']);

		expect(apiRequest).toHaveBeenNthCalledWith(
			1,
			'/api/collection/copies?userCardId=copy-1&userCardId=copy-2',
			undefined
		);
		expect(apiRequest).toHaveBeenNthCalledWith(
			2,
			'/api/users/user-2/collection/copies?variantId=variant-1&variantId=variant-2',
			undefined
		);
		expect(apiRequest).toHaveBeenNthCalledWith(
			3,
			'/api/users/user-2/collection/counts?variantId=variant-1&variantId=variant-2',
			undefined
		);
	});
});

describe('getTradePartners', () => {
	beforeEach(() => apiRequest.mockReset());

	it('uses the friendship registry instead of preloading the public user directory', async () => {
		apiRequest.mockResolvedValueOnce({
			friends: [{ id: 2, name: 'Alice' }],
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
			friends: [{ id: 2, name: 'Alice' }],
			received: [{ id: 3, name: 'Bob' }],
			sent: [{ id: 4, name: 'Chloé' }]
		});
		const friendships = await getFriends();
		await createFriendRequest('ignored', '4');

		expect(friendships).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: '4',
					status: 'sent',
					user: expect.objectContaining({ id: '4', username: 'Chloé' })
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
			updateWikiForgeMe({ name: 'Camille', imagePageId: 12, nsfw: false, safeWords: ['adulte'] })
		).resolves.toMatchObject({ username: 'Camille', imagePageId: 12, safeWords: ['adulte'] });
		expect(apiRequest).toHaveBeenCalledWith('/me', {
			apiTarget: 'wikiforge',
			method: 'PATCH',
			body: { name: 'Camille', imagePageId: 12, nsfw: false, safeWords: ['adulte'] }
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
				results: [{ id: 81, pageId: 42, title: 'Rose', rarity: 'R' }],
				nextCursor: null,
				hasNext: false,
				rarityResults: null
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
