import { describe, expect, it, vi } from 'vitest';
import { getWikiForgePublicPages, toPublicPage } from './pages';

describe('WikiForge public pages API', () => {
	it('uses the public catalogue contract without local authentication', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				nbResults: 0,
				page: 0,
				rarityResults: {},
				results: [],
				sortBy: 'RARITY',
				sortDirection: 'ASC'
			})
		);

		await getWikiForgePublicPages(
			{ q: 'Paris', page: 2, rarity: 'L', sortBy: 'name', sortDirection: 'DESC' },
			{ fetch: fetcher as typeof fetch }
		);

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/pages?page=2&sortBy=name&sortDirection=DESC&q=Paris&rarity=L',
			expect.objectContaining({ credentials: 'omit' })
		);
	});

	it('maps the new public payload to a display card and its pagination', () => {
		const page = toPublicPage({
			nbResults: 51,
			page: 0,
			rarityResults: { L: 1, UR: 0, SR: 0, R: 0, PC: 0, C: 50 },
			results: [
				{
					id: 42,
					title: 'Paris',
					description: 'Capitale française',
					image: 'Paris.jpg',
					atk: 120,
					length: 50,
					viewCount: 1000,
					rarity: 'L',
					createdAt: '2026-08-18T12:00:00Z',
					globalCount: 3
				}
			],
			sortBy: 'RARITY',
			sortDirection: 'ASC'
		});

		expect(page.meta).toEqual({ page: 1, pageSize: 50, total: 51, totalPages: 2 });
		expect(page.rarityResults).toEqual({ L: 1, UR: 0, SR: 0, R: 0, PC: 0, C: 50 });
		expect(page.items[0]).toMatchObject({
			id: '42',
			title: 'Paris',
			rarityInitials: 'L',
			attack: 120,
			globalSupply: 3,
			wikipediaUrl: 'https://fr.wikipedia.org/?curid=42'
		});
		expect(page.items[0].imageUrl).toContain('Paris.jpg');
	});
});
