import { describe, expect, it } from 'vitest';
import { cardRarityOptions, compareCardsByRarityDesc } from './rarities';

describe('card rarities', () => {
	it('keeps the same complete canonical filter order', () => {
		expect(cardRarityOptions.map((rarity) => rarity.initials)).toEqual([
			'C',
			'PC',
			'R',
			'SR',
			'UR',
			'L'
		]);
	});

	it('sorts cards by descending rarity and then by title', () => {
		const cards = [
			{ rarity: 'Commune' as const, title: 'Z' },
			{ rarity: 'Légendaire' as const, title: 'B' },
			{ rarity: 'Légendaire' as const, title: 'A' }
		];
		expect(cards.toSorted(compareCardsByRarityDesc).map((card) => card.title)).toEqual([
			'A',
			'B',
			'Z'
		]);
	});
});
