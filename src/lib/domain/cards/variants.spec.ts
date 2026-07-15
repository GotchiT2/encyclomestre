import { describe, expect, it } from 'vitest';
import { filterCardPageByVariant, matchesCardVariant } from './variants';
import type { CardRecord } from '$lib/types';

const card = { id: '1', isFullArt: false } as CardRecord;
const alternative = { id: '2', isFullArt: true } as CardRecord;

describe('card variants', () => {
	it('matches normal and alternative cards explicitly', () => {
		expect(matchesCardVariant(card, 'all')).toBe(true);
		expect(matchesCardVariant(card, 'normal')).toBe(true);
		expect(matchesCardVariant(card, 'alternative')).toBe(false);
		expect(matchesCardVariant(alternative, 'alternative')).toBe(true);
	});

	it('filters a card page without changing its pagination contract', () => {
		const page = {
			items: [card, alternative],
			meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 }
		};
		expect(filterCardPageByVariant(page, 'alternative').items).toEqual([alternative]);
		expect(filterCardPageByVariant(page, 'alternative').meta).toEqual(page.meta);
	});
});
