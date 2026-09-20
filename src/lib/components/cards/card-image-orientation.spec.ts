import { describe, expect, it } from 'vitest';
import {
	CARD_PLACEHOLDER_URL,
	hasUsableCardImage,
	isLandscapeCardImage
} from './card-image-orientation';

describe('card image orientation', () => {
	it('keeps missing and placeholder illustrations in portrait mode', () => {
		expect(hasUsableCardImage('')).toBe(false);
		expect(hasUsableCardImage(CARD_PLACEHOLDER_URL)).toBe(false);
	});

	it('only classifies sufficiently wide loaded images as landscape', () => {
		expect(isLandscapeCardImage(1200, 800)).toBe(true);
		expect(isLandscapeCardImage(800, 1200)).toBe(false);
		expect(isLandscapeCardImage(0, 0)).toBe(false);
	});
});
