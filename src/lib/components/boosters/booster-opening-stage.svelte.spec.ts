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
});
