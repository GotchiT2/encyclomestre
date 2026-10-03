import { describe, expect, it } from 'vitest';
import { boosterArtwork, boosterVisual, type BoosterVisual } from './booster-visuals';

describe('local booster presentation', () => {
	it.each([
		['standard', 'PREMIUM_PLUS', 'signal'],
		['chrome', 'NORMAL', 'circuit'],
		['neon', 'NORMAL', 'prism'],
		['unknown', 'PREMIUM', 'circuit'],
		[undefined, 'PREMIUM_PLUS', 'prism'],
		['unknown', 'unknown', 'signal']
	])('selects %s by key before falling back to %s', (key, family, expected) => {
		expect(boosterVisual(key, family)).toBe(expected);
	});
	it('keeps catalogue data as text in the vector master', () => {
		const svg = boosterArtwork({
			visual: 'signal',
			name: '<script> & "X"',
			brand: '<img>',
			cardsLabel: '</text>'
		});
		expect(svg).not.toContain('<script>');
		expect(svg).not.toContain('<img>');
		expect(svg).toContain('&lt;SCRIPT&gt;');
		expect(svg).not.toContain('<image');
	});
	it('supplies distinct covers and symmetric backs without external images', () => {
		const visuals: BoosterVisual[] = ['signal', 'circuit', 'prism'];
		const covers = visuals.map((visual) => boosterArtwork({ visual }));
		expect(new Set(covers).size).toBe(3);
		const back = boosterArtwork({ visual: 'signal', back: true });
		expect(back).toContain('rotate(180 256 368)');
		expect(back).not.toContain('<image');
	});
});
