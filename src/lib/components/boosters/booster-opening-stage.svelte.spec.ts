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
		sceneOpen: true,
		opening: false,
		openingId: 1,
		packName: 'Pack quotidien',
		packRenderKey: 'standard',
		onOpen: vi.fn(),
		onReset: vi.fn()
	};
	it('keeps a received result while the request flag is clearing', async () => {
		render(BoosterOpeningStage, { ...base, opening: true, cards });
		await expect.element(page.getByText('Les cartes sont dans votre collection')).toBeVisible();
		expect(document.querySelectorAll('.booster-reveal-card')).toHaveLength(5);
	});
	it('supports skip, server order and immediate access to the batch summary', async () => {
		arcadePreferences.set({ density: 'grid', motion: 'reduce', opening: 'immersive' });
		const progress = vi.fn();
		render(BoosterOpeningStage, { ...base, cards, onProgress: progress });
		await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		await expect.element(page.getByText('Les cartes sont dans votre collection')).toBeVisible();
		expect(
			[...document.querySelectorAll('.booster-card-button')].map((button) =>
				button.getAttribute('aria-label')
			)
		).toEqual(cards.map((card) => `Afficher les détails de ${card.title}`));
		expect(progress).toHaveBeenLastCalledWith(
			cards.map((card) => card.id),
			0
		);
	});
	it('resumes arbitrary revealed cards without replaying an opening', async () => {
		arcadePreferences.set({ density: 'grid', motion: 'reduce', opening: 'immersive' });
		const onOpen = vi.fn(),
			progress = vi.fn();
		render(BoosterOpeningStage, {
			...base,
			cards,
			resume: { revealedIds: ['1', '3'], page: 0 },
			onOpen,
			onProgress: progress
		});
		await page
			.getByRole('button', { name: 'Retourner la carte Standard', exact: true })
			.nth(2)
			.click();
		expect(progress).toHaveBeenLastCalledWith(['1', '3', '5'], 0);
		expect(onOpen).not.toHaveBeenCalled();
	});
	it('keeps free discovery across pages and reveals the whole batch', async () => {
		arcadePreferences.set({ density: 'grid', motion: 'reduce', opening: 'immersive' });
		const progress = vi.fn();
		const batch = Array.from({ length: 25 }, (_, index) => ({
			...cards[0],
			id: String(index + 1),
			title: `Carte ${index + 1}`
		}));
		render(BoosterOpeningStage, {
			...base,
			cards: batch,
			resume: { revealedIds: ['3'], page: 1 },
			onProgress: progress
		});
		await page
			.getByRole('button', { name: 'Retourner la carte Standard', exact: true })
			.nth(2)
			.click();
		expect(progress).toHaveBeenLastCalledWith(['3', '15'], 1);
		await page.getByRole('button', { name: 'Page précédente', exact: true }).click();
		expect(document.querySelectorAll('[data-revealed=true]')).toHaveLength(1);
		await page.getByRole('button', { name: 'Tout révéler', exact: true }).click();
		expect(progress).toHaveBeenLastCalledWith(
			batch.map((card) => card.id),
			0
		);
		await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
		expect(document.querySelectorAll('[data-revealed=true]')).toHaveLength(12);
	});
});
