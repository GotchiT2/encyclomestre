import { describe, expect, it } from 'vitest';
import { mockCards } from './cards';

describe('mock card variants', () => {
	it('provides every configured finish for each subject', () => {
		const subjects = new Set(mockCards.map((card) => card.baseCardId));
		for (const subject of subjects) {
			const cards = mockCards.filter((card) => card.baseCardId === subject);
			expect(cards.map((card) => card.variantId)).toEqual([1, 2, 3, 4]);
			expect(cards.filter((card) => card.variant.styles.includes('FULL_ART'))).toHaveLength(2);
		}
	});
});
