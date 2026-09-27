import { it, expect } from 'vitest';
import { createMockApiResponse } from './mock';
it('returns unique catalogue cards with all their styles available', async () => {
	const result = await createMockApiResponse({ path: '/pages?page=0&sortBy=NAME' }).json();
	const ids = result.results.map((card: { id: number }) => card.id);
	expect(new Set(ids).size).toBe(ids.length);
	expect(result.nbResults).toBe(ids.length);
	expect(result.results[0].variantIds).toEqual([1, 2, 3, 4]);
});
