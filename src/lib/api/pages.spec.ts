import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_MOCK_ENABLED: 'false',
		PUBLIC_WIKIFORGE_API_BASE_URL: 'https://api.wikiforge.fr'
	}
}));

import { getWikiForgePublicPage, getWikiForgePublicPages, toPublicPage } from './pages';

afterEach(() => vi.unstubAllGlobals());

describe('WikiForge public pages API', () => {
	it('uses the canonical catalogue contract', async () => {
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
			'https://api.wikiforge.fr/pages?page=2&sortBy=NAME&sortDirection=DESC&q=Paris&rarity=L',
			expect.objectContaining({ credentials: 'include' })
		);
	});

	it('uses relevance by default for a textual search', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				nbResults: 0,
				page: 0,
				rarityResults: {},
				results: [],
				sortBy: 'RELEVANCE',
				sortDirection: 'DESC'
			})
		);

		await getWikiForgePublicPages({ q: 'Rose' }, { fetch: fetcher as typeof fetch });

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/pages?page=0&sortBy=RELEVANCE&sortDirection=DESC&q=Rose',
			expect.any(Object)
		);
	});

	it('loads one public card from its dedicated endpoint', async () => {
		const fetcher = vi.fn(async () =>
			Response.json({
				id: 42,
				title: 'Paris',
				atk: 120,
				length: 50,
				viewCount: 1000,
				rarity: 'L',
				createdAt: '2026-08-18T12:00:00Z',
				globalCount: 3,
				ownedCount: 2
			})
		);

		await getWikiForgePublicPage('42', { fetch: fetcher as typeof fetch });

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/pages/42',
			expect.objectContaining({ credentials: 'include' })
		);
	});

	it('forwards the current OAuth access token to WikiForge', async () => {
		vi.stubGlobal('localStorage', {
			length: 1,
			clear: vi.fn(),
			getItem: () => JSON.stringify({ accessToken: 'cards-access-token', user: { id: '1' } }),
			key: () => null,
			setItem: vi.fn(),
			removeItem: vi.fn()
		} satisfies Storage);
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

		await getWikiForgePublicPages({}, { fetch: fetcher as typeof fetch });

		expect(fetcher).toHaveBeenCalledWith(
			'https://api.wikiforge.fr/pages?page=0&sortBy=RARITY&sortDirection=ASC',
			expect.objectContaining({
				headers: expect.objectContaining({ authorization: 'Bearer cards-access-token' })
			})
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
					image: 'https://images.wikiforge.test/Paris.jpg',
					atk: 120,
					length: 50,
					viewCount: 1000,
					rarity: 'L',
					createdAt: '2026-08-18T12:00:00Z',
					globalCount: 3,
					ownedCount: 2
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
			ownedCount: 2,
			wikipediaUrl: 'https://fr.wikipedia.org/?curid=42'
		});
		expect(page.items[0].imageUrl).toBe('https://images.wikiforge.test/Paris.jpg');
	});

	it('maps a successful zero-result payload without treating it as an error', () => {
		expect(
			toPublicPage({
				nbResults: 0,
				page: 0,
				results: null,
				rarityResults: null,
				sortBy: 'RELEVANCE',
				sortDirection: 'DESC'
			})
		).toEqual({
			items: [],
			rarityResults: { L: 0, UR: 0, SR: 0, R: 0, PC: 0, C: 0 },
			meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 }
		});
	});
});
