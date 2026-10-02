import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import BoosterRevealCard from './booster-reveal-card.svelte';
import type { CardRecord } from '$lib/types';

const fullArt = {
	id: 9,
	name: 'Full art',
	color: '#b69aff',
	styles: ['FULL_ART'],
	renderKey: 'nebula'
};

function card(imageUrl: string): CardRecord {
	return {
		id: '1',
		variantId: 9,
		variant: fullArt,
		title: 'Paysage',
		shortDescription: '',
		longDescription: '',
		imageUrl,
		wikipediaUrl: '',
		attack: 0,
		defense: 0,
		ownedCount: 1,
		globalSupply: 0,
		friendsWhoOwn: []
	};
}

describe('BoosterRevealCard', () => {
	it('combines the real finish hints and does not infer rarity from a render key', () => {
		const both = card('/card-placeholder.svg');
		both.variant = { ...fullArt, styles: ['FULL_ART', 'CHROME'] };
		const combined = render(BoosterRevealCard, {
			card: both,
			revealed: false,
			onReveal: vi.fn(),
			onOpenDetail: vi.fn()
		});
		const slot = combined.container.querySelector('.booster-reveal-card');
		expect(slot?.classList.contains('chrome')).toBe(true);
		expect(slot?.classList.contains('full-art')).toBe(true);
		combined.unmount();
		const unknown = card('/card-placeholder.svg');
		unknown.variant = { ...fullArt, styles: [], renderKey: 'chrome' };
		const ordinary = render(BoosterRevealCard, {
			card: unknown,
			revealed: false,
			onReveal: vi.fn(),
			onOpenDetail: vi.fn()
		});
		expect(
			ordinary.container.querySelector('.booster-reveal-card')?.classList.contains('chrome')
		).toBe(false);
	});
	it('keeps a landscape Full Art back portrait until it is revealed', async () => {
		const image =
			'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"%3E%3C/svg%3E';
		const result = render(BoosterRevealCard, {
			card: card(image),
			revealed: false,
			onReveal: vi.fn(),
			onOpenDetail: vi.fn()
		});
		await expect
			.poll(() =>
				result.container
					.querySelector('[data-front-orientation]')
					?.getAttribute('data-front-orientation')
			)
			.toBe('landscape');
		expect(
			result.container.querySelector('.booster-reveal-card')?.classList.contains('is-landscape')
		).toBe(false);
		result.unmount();
	});

	it('keeps a missing Full Art illustration in portrait mode', async () => {
		const result = render(BoosterRevealCard, {
			card: card('/card-placeholder.svg'),
			revealed: true,
			onReveal: vi.fn(),
			onOpenDetail: vi.fn()
		});
		expect(
			result.container
				.querySelector('[data-front-orientation]')
				?.getAttribute('data-front-orientation')
		).toBe('portrait');
		expect(
			result.container.querySelector('.booster-reveal-card')?.classList.contains('is-landscape')
		).toBe(false);
	});
});
