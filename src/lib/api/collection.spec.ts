import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import {
	addWikiForgeCardTag,
	collectionPath,
	getWikiForgeCollectionPage,
	nextCollectionPosition,
	protectWikiForgeCard,
	removeWikiForgeCardTag,
	toWikiForgeCollectionCard,
	unprotectWikiForgeCard
} from './collection';

const request = vi.mocked(apiRequest);

beforeEach(() => request.mockReset());

describe('WikiForge collection API', () => {
	it('serializes only the supported filters and never mixes page with cursor', () => {
		expect(
			collectionPath({
				query: '  Rose  ',
				sortBy: 'rarity',
				rarities: ['L', 'SR'],
				tagIds: ['2', '7'],
				duplicate: 'yes',
				protected: 'no',
				page: 4,
				cursor: 'opaque-cursor'
			})
		).toBe(
			'/collection?sortBy=RARITY&q=Rose&rarity=L&rarity=SR&tags=2&tags=7&duplicate=true&protected=false&cursor=opaque-cursor'
		);
		expect(collectionPath({ query: 'ab', page: 2 })).toBe(
			'/collection?sortBy=ACQUIRED_DATE&page=2'
		);
	});

	it('follows hasNext, cursor and page as the only continuation rule', () => {
		expect(nextCollectionPosition({ hasNext: false, nextCursor: 'ignored', page: 3 })).toBeNull();
		expect(nextCollectionPosition({ hasNext: true, nextCursor: 'next', page: 0 })).toEqual({
			page: 0,
			cursor: 'next'
		});
		expect(nextCollectionPosition({ hasNext: true, nextCursor: null, page: 6 })).toEqual({
			page: 7,
			cursor: null
		});
	});

	it('maps the flat CardDTO and preserves unknown totals and nullable facets', async () => {
		request.mockResolvedValue({
			nbResults: -1,
			page: 0,
			sortBy: 'ACQUIRED_DATE',
			sortDirection: 'DESC',
			results: [
				{
					id: 81,
					pageId: 42,
					title: 'Rose',
					description: 'Une carte',
					image: 'Rose.jpg',
					rarity: 'L',
					atk: 90,
					alt: true,
					duplicate: true,
					protected: true,
					tagIds: [2, 7],
					pendingTradeId: 12
				}
			],
			nextCursor: 'next',
			hasNext: true,
			rarityResults: null,
			q: null
		});

		const result = await getWikiForgeCollectionPage();

		expect(request).toHaveBeenCalledWith('/collection?sortBy=ACQUIRED_DATE', {
			apiTarget: 'wikiforge'
		});
		expect(result).toMatchObject({
			total: -1,
			hasNext: true,
			nextCursor: 'next',
			rarityResults: null
		});
		expect(result.items[0]).toMatchObject({
			id: '81',
			catalogueId: '42',
			variant: 'FULL_ART',
			duplicate: true,
			userProtected: true,
			collectionTagIds: ['2', '7'],
			pendingTradeId: '12'
		});
		expect(result.items[0].imageUrl).toBe(
			'https://fr.wikipedia.org/wiki/Special:FilePath/Rose.jpg?width=250'
		);
	});

	it('returns an empty page for a successful response with zero cards', async () => {
		request.mockResolvedValue({
			nbResults: 0,
			page: 0,
			sortBy: 'ACQUIRED_DATE',
			sortDirection: 'DESC',
			results: null,
			nextCursor: null,
			hasNext: false,
			rarityResults: null,
			q: 'introuvable'
		});

		await expect(getWikiForgeCollectionPage({ query: 'introuvable' })).resolves.toMatchObject({
			items: [],
			total: 0,
			hasNext: false
		});
	});

	it('normalizes omitted rarity counters from filtered responses', async () => {
		request.mockResolvedValue({
			nbResults: 1,
			page: 0,
			sortBy: 'ACQUIRED_DATE',
			sortDirection: 'DESC',
			results: [{ id: 1, pageId: 2, title: 'Taguée', rarity: 'C', tagIds: [7] }],
			nextCursor: null,
			hasNext: false,
			q: null
		});

		await expect(getWikiForgeCollectionPage({ tagIds: ['7'] })).resolves.toMatchObject({
			items: [expect.objectContaining({ id: '1', collectionTagIds: ['7'] })],
			rarityResults: null
		});
	});

	it('uses the exact protection and single-tag endpoints', async () => {
		request.mockResolvedValue(undefined);
		await protectWikiForgeCard('81');
		await unprotectWikiForgeCard('81');
		await addWikiForgeCardTag('81', '2');
		await removeWikiForgeCardTag('81', '2');

		expect(request).toHaveBeenNthCalledWith(1, '/collection/81/protect', {
			apiTarget: 'wikiforge',
			method: 'PUT'
		});
		expect(request).toHaveBeenNthCalledWith(2, '/collection/81/unprotect', {
			apiTarget: 'wikiforge',
			method: 'PUT'
		});
		expect(request).toHaveBeenNthCalledWith(3, '/collection/81/tags/2', {
			apiTarget: 'wikiforge',
			method: 'PUT'
		});
		expect(request).toHaveBeenNthCalledWith(4, '/collection/81/tags/2', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
	});

	it('builds the shared card mapping deterministically', () => {
		expect(
			toWikiForgeCollectionCard({ id: 1, pageId: 2, title: 'Test', rarity: 'C' })
		).toMatchObject({ id: '1', baseCardId: 2, rarityInitials: 'C' });
	});
});
