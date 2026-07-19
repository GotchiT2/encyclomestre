import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import {
	blockUser,
	getOwnedCollectionCards,
	getTradePartners,
	getUserBlocks,
	getUserCollection,
	getUserCollectionCopies,
	getUserCollectionCounts,
	getUserCollectionPage,
	searchUsers,
	unblockUser
} from './users';

describe('searchUsers', () => {
	beforeEach(() => apiRequest.mockReset());

	it('forwards the debounced text query without loading the full directory', async () => {
		apiRequest.mockResolvedValueOnce({ results: [], page: 0, nbResults: 0, size: 20 });

		await searchUsers('marie');

		expect(apiRequest).toHaveBeenCalledWith(
			'/api/users?excludeCurrent=true&page=0&size=20&q=marie',
			undefined
		);
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
			'/api/users/user-2/collection?page=1&size=12&sortBy=name&sortDirection=ASC&variant=FULL_ART&q=winter&rarity=R',
			undefined
		);
		expect(result.meta).toEqual({ page: 2, pageSize: 12, total: 42, totalPages: 4 });
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
		apiRequest.mockResolvedValueOnce([
			{ id: 'friendship-1', status: 'accepted', user: { id: 'user-2' } },
			{ id: 'friendship-2', status: 'sent', user: { id: 'user-3' } }
		]);

		const partners = await getTradePartners('user-1');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/api/friends', undefined);
		expect(partners).toEqual([{ id: 'user-2' }]);
	});
});

describe('user blocks', () => {
	beforeEach(() => apiRequest.mockReset());

	it('uses the authenticated block registry endpoints', async () => {
		apiRequest.mockResolvedValueOnce([]).mockResolvedValueOnce({
			user: { id: 'friend-1' },
			createdAt: '2026-07-17T00:00:00Z'
		});

		await getUserBlocks();
		await blockUser('friend-1');
		await unblockUser('friend-1');

		expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/users/me/blocks', undefined);
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/users/friend-1/block', {
			method: 'PUT'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/api/users/friend-1/block', {
			method: 'DELETE'
		});
	});
});
