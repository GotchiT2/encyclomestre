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

import { arcadePreferences } from '$lib/arcade/preferences';

describe('BoosterOpeningStage', () => {
	beforeEach(() =>
		arcadePreferences.set({ density: 'grid', motion: 'reduce', opening: 'express' })
	);
	const base = {
		available: 1,
		maximum: 10,
		opening: false,
		openingId: 1,
		packName: 'Pack quotidien',
		packImage: '/images/booster.png',
		onOpen: vi.fn(),
		onReset: vi.fn()
	};
	it('keeps a received result while the request flag is clearing', async () => {
		render(BoosterOpeningStage, { ...base, opening: true, cards });
		await expect.element(page.getByText('Les cartes sont dans votre collection')).toBeVisible();
		expect(document.querySelectorAll('[data-testid="card-tile"]')).toHaveLength(5);
	});
	it('supports skip, server order and immediate access to the batch summary', async () => {
		arcadePreferences.set({ density: 'grid', motion: 'reduce', opening: 'immersive' });
		const progress = vi.fn();
		render(BoosterOpeningStage, { ...base, cards, onProgress: progress });
		await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		await expect.element(page.getByText('Les cartes sont dans votre collection')).toBeVisible();
		expect(
			[...document.querySelectorAll('[data-testid="card-tile"] button.card-inspect')].map(
				(button) => button.getAttribute('aria-label')
			)
		).toEqual(cards.map((card) => card.title));
		expect(progress).toHaveBeenLastCalledWith(5, 0);
	});
	it('resumes after the last revealed card without replaying an opening', async () => {
		arcadePreferences.set({ density: 'grid', motion: 'reduce', opening: 'immersive' });
		const onOpen = vi.fn(),
			progress = vi.fn();
		render(BoosterOpeningStage, {
			...base,
			cards,
			resume: { revealed: 2, index: 1 },
			onOpen,
			onProgress: progress
		});
		await page.getByRole('button', { name: 'Carte suivante', exact: true }).click();
		expect(progress).toHaveBeenLastCalledWith(3, 2);
		expect(onOpen).not.toHaveBeenCalled();
	});
});
