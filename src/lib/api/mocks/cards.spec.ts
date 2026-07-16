import { describe, expect, it } from 'vitest';
import { mockCards } from './cards';

describe('mock card variants', () => {
	it('provides exactly one full-art variant for every legendary normal card', () => {
		const normalLegendaries = mockCards.filter(
			(card) => card.rarity === 'Légendaire' && card.variant === 'NORMAL'
		);
		const fullArts = mockCards.filter((card) => card.variant === 'FULL_ART');

		expect(fullArts).toHaveLength(normalLegendaries.length);
		for (const card of normalLegendaries) {
			expect(fullArts.filter((fullArt) => fullArt.baseCardId === card.baseCardId)).toHaveLength(1);
		}
		expect(fullArts.every((card) => card.rarity === 'Légendaire' && card.isFullArt)).toBe(true);
	});
});
