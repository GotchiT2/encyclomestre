import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request, variants } = vi.hoisted(() => ({
	request: vi.fn(),
	variants: [
		{ id: 8, name: 'Normale', color: '#b8f2d5', styles: ['NORMAL'], renderKey: 'standard' },
		{ id: 9, name: 'Full art', color: '#ffe144', styles: ['FULL_ART'], renderKey: 'full-art' }
	]
}));
vi.mock('./client', () => ({ apiRequest: request }));
vi.mock('./variants', async (importOriginal) => ({
	...(await importOriginal<typeof import('./variants')>()),
	getVariants: vi.fn().mockResolvedValue(variants)
}));

import { getWikiForgePublicPage, getWikiForgePublicPages, toPublicPageCardRecord } from './pages';

describe('public pages variants', () => {
	beforeEach(() => request.mockReset());

	it('loads the variant catalogue with catalogue and detail responses', async () => {
		request.mockResolvedValueOnce({
			nbResults: 0,
			page: 0,
			results: [],
			sortBy: 'NAME',
			sortDirection: 'ASC'
		});
		await expect(getWikiForgePublicPages()).resolves.toMatchObject({ _variants: variants });

		request.mockResolvedValueOnce({
			id: 42,
			title: 'Article',
			atk: 1,
			globalCount: 0,
			defaultVariantId: 9
		});
		await expect(getWikiForgePublicPage(42)).resolves.toMatchObject({ _variants: variants });
	});

	it('uses the declared default, then the first NORMAL variant', () => {
		const page = { id: 42, title: 'Article', atk: 1, globalCount: 0 };
		expect(toPublicPageCardRecord({ ...page, defaultVariantId: 9 }, variants).variantId).toBe(9);
		expect(toPublicPageCardRecord(page, variants).variantId).toBe(8);
	});
});
