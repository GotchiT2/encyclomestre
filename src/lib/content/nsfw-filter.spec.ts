import { describe, expect, it } from 'vitest';
import { shouldBlurCardIllustration } from './nsfw-filter';

const card = {
	title: 'Biographie sensible',
	shortDescription: 'Une notice encyclopédique.',
	longDescription: 'Contient le mot-clé adulte.'
};

describe('NSFW card filter', () => {
	it('blurs a card when a configured keyword occurs in its title or description', () => {
		expect(shouldBlurCardIllustration(card, { enabled: false, keywords: ['adulte'] })).toBe(true);
		expect(shouldBlurCardIllustration(card, { enabled: false, keywords: ['biographie'] })).toBe(
			true
		);
	});

	it('ignores keyword matches while NSFW display is enabled', () => {
		expect(shouldBlurCardIllustration(card, { enabled: true, keywords: ['adulte'] })).toBe(false);
	});

	it('also applies the built-in NSFW vocabulary', () => {
		expect(
			shouldBlurCardIllustration(
				{ ...card, shortDescription: 'Une page sur la pornographie.' },
				{ enabled: false, keywords: [] }
			)
		).toBe(true);
	});
});
