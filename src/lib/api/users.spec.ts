import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import { getUserCollection, searchUsers } from './users';

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
});
