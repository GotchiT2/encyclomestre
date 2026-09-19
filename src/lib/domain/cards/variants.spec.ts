import { describe, expect, it } from 'vitest';
import { filterCardPageByVariant, matchesCardVariant } from './variants';
import type { CardRecord } from '$lib/types';

const card = { id: '1', variantId: 1 } as CardRecord;
const alternative = { id: '2', variantId: 2 } as CardRecord;

describe('card variants', () => {
	it('matches dynamic variant identifiers', () => {
		expect(matchesCardVariant(card, [])).toBe(true);
		expect(matchesCardVariant(card, [1])).toBe(true);
		expect(matchesCardVariant(card, [2])).toBe(false);
		expect(matchesCardVariant(alternative, [2])).toBe(true);
	});

	it('filters a card page without changing its pagination contract', () => {
		const page = {
			items: [card, alternative],
			meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 }
		};
		expect(filterCardPageByVariant(page, [2]).items).toEqual([alternative]);
		expect(filterCardPageByVariant(page, [2]).meta).toEqual(page.meta);
	});
});
