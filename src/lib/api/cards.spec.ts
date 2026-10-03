import { describe, expect, it } from 'vitest';
import { cardNumberLabel } from '$lib/types';
import { toCardRecord } from './cards';

const variant = {
	id: 4,
	name: 'Chrome',
	color: '#b1cff2',
	styles: ['FULL_ART', 'CHROME'],
	renderKey: 'chrome'
};
const dto = { id: 1, pageId: 2, title: 'Carte', variantId: 4, packId: 9 };

describe('card mapping', () => {
	it('separates variant, pack and numbered copy', () => {
		const card = toCardRecord({ ...dto, serialNumber: 7, maxCopies: 99 }, [variant]);
		expect(card).toMatchObject({
			variantId: 4,
			variant,
			packId: 9,
			serialNumber: 7,
			maxCopies: 99
		});
	});

	it('ignores missing and invalid dates without breaking card details', () => {
		const card = toCardRecord({ ...dto, acquiredDate: 'invalid-date' }, [variant]);
		expect(card.acquiredAt).toBeUndefined();
		expect(card.createdAt).toBeUndefined();
	});

	it('formats all three serial states', () => {
		expect(cardNumberLabel({ serialNumber: 7, maxCopies: 99 })).toBe('7/99');
		expect(cardNumberLabel({ serialNumber: 12 })).toBe('#12');
		expect(cardNumberLabel({})).toBe('');
		expect(cardNumberLabel({ maxCopies: 10 }, true)).toBe('X/10');
	});
});
