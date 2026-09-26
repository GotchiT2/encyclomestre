import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import BoosterOpeningStage from './booster-opening-stage.svelte';
import type { CardRecord } from '$lib/types';

const variant = {
	id: 1,
	name: 'Standard',
	color: '#b8f2d5',
	styles: ['NORMAL'],
	renderKey: 'standard'
};
const cards: CardRecord[] = Array.from({ length: 5 }, (_, index) => ({
	id: String(index + 1),
	variantId: 1,
	variant,
	title: `Carte ${index + 1}`,
	shortDescription: 'Description',
	longDescription: 'Description',
	imageUrl: '/card-placeholder.svg',
	wikipediaUrl: '',
	attack: 0,
	defense: 0,
	ownedCount: 1,
	globalSupply: 0,
	friendsWhoOwn: []
}));

describe('BoosterOpeningStage', () => {
	beforeEach(() => localStorage.setItem('wikiforge.booster.quick-opening', 'true'));

	it('keeps the received cards when the request flag is still clearing', async () => {
		render(BoosterOpeningStage, {
			available: 1,
			maximum: 10,
			opening: true,
			openingId: 1,
			packName: 'Pack quotidien',
			packImage: '/images/booster.png',
			cards,
			onOpen: vi.fn(),
			onReset: vi.fn()
		});

		await expect.element(page.getByText('Toutes les cartes ont été affichées')).toBeVisible();
		expect(document.querySelectorAll('[data-revealed="true"]')).toHaveLength(5);
	});

	it('expands the slot of a revealed landscape Full Art card', async () => {
		const landscapeCard: CardRecord = {
			...cards[0],
			variant: {
				id: 9,
				name: 'Full art',
				color: '#b69aff',
				styles: ['FULL_ART'],
				renderKey: 'nebula'
			},
			variantId: 9,
			imageUrl:
				'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"%3E%3C/svg%3E'
		};

		const result = render(BoosterOpeningStage, {
			available: 1,
			maximum: 10,
			opening: false,
			openingId: 2,
			packName: 'Pack quotidien',
			packImage: '/images/booster.png',
			cards: [landscapeCard, ...cards.slice(1)],
			onOpen: vi.fn(),
			onReset: vi.fn()
		});

		await expect
			.poll(() =>
				result.container
					.querySelector('[data-slot-index="0"] [data-front-orientation]')
					?.getAttribute('data-front-orientation')
			)
			.toBe('landscape');
		const revealButton = result.container.querySelector(
			'[data-slot-index="0"] button'
		) as HTMLButtonElement;
		await expect.poll(() => revealButton.disabled).toBe(false);
		revealButton.click();
		await expect
			.poll(() =>
				result.container
					.querySelector('[data-slot-index="0"]')
					?.classList.contains('landscape')
			)
			.toBe(true);
	});
});
