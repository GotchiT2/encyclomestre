import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { currentSession } from '$lib/auth/session';
import type { User } from '$lib/types';
const user: User = {
	id: '1',
	username: 'Demo',
	displayName: 'Demo',
	role: 'user',
	createdAt: '',
	updatedAt: ''
};
const { read, readLists, readWishlist } = vi.hoisted(() => ({
	read: vi.fn(),
	readLists: vi.fn(),
	readWishlist: vi.fn()
}));
vi.mock('$lib/api/pages', () => ({ getWikiForgePublicPage: read }));
vi.mock('$lib/api/wishlist', () => ({ getWishlists: readLists, getWishlistPage: readWishlist }));
import {
	articleContexts,
	requestArticleContext,
	invalidateArticleContexts
} from './article-context';
describe('visible article enrichment', () => {
	it('limits reads to three, caches each article and discards former account results', async () => {
		currentSession.set({ accessToken: 'mock', user });
		invalidateArticleContexts();
		let running = 0,
			peak = 0;
		read.mockImplementation(async (id: string) => {
			running++;
			peak = Math.max(peak, running);
			await new Promise((resolve) => setTimeout(resolve, 5));
			running--;
			return { id: Number(id), ownedCount: 2, friends: [] };
		});
		for (let id = 1; id <= 9; id++) requestArticleContext(String(id));
		await vi.waitFor(() => expect(Object.keys(get(articleContexts))).toHaveLength(9));
		expect(peak).toBe(3);
		expect(read).toHaveBeenCalledTimes(9);
		requestArticleContext('1');
		expect(read).toHaveBeenCalledTimes(9);
		requestArticleContext('10');
		currentSession.set(null);
		await new Promise((resolve) => setTimeout(resolve, 15));
		expect(get(articleContexts)).toEqual({});
	});
	it('finds an exact article beyond the first page of its own wishlists', async () => {
		currentSession.set({ accessToken: 'mock', user });
		invalidateArticleContexts();
		read.mockResolvedValue({
			id: 42,
			title: 'Un article',
			ownedCount: undefined,
			friends: undefined
		});
		readLists.mockResolvedValue([
			{ id: '7', title: 'Mes recherches', cardCount: 21 },
			{ id: '8', title: 'Vide', cardCount: 0 }
		]);
		readWishlist.mockImplementation(async (_id, query) => ({
			items: [{ card: { baseCardId: query.page === 2 ? 42 : 41 } }],
			meta: { totalPages: 2 }
		}));
		requestArticleContext('42');
		await vi.waitFor(() =>
			expect(get(articleContexts)['42']?.wishlists).toEqual([
				{ id: '7', title: 'Mes recherches', defaultList: false }
			])
		);
		expect(readWishlist.mock.calls.map((call) => call[1].page)).toEqual([1, 2]);
		expect(get(articleContexts)['42'].owned).toBeUndefined();
		expect(get(articleContexts)['42'].friends).toBeUndefined();
	});
	it('preserves known ownership and leaves membership unknown when a wishlist read fails', async () => {
		invalidateArticleContexts();
		read.mockResolvedValue({ id: 43, title: 'Autre article', ownedCount: 2 });
		readLists.mockResolvedValue([{ id: '7', title: 'Mes recherches', cardCount: 21 }]);
		readWishlist.mockRejectedValue(new Error('Network'));
		requestArticleContext('43');
		await vi.waitFor(() => expect(get(articleContexts)['43']?.failed).toBe(true));
		expect(get(articleContexts)['43'].owned).toBe(2);
		expect(get(articleContexts)['43'].wishlists).toBeUndefined();
		currentSession.set(null);
	});
});
