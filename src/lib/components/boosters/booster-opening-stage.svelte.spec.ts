import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import BoosterOpeningStage from './booster-opening-stage.svelte';
import type { CardRecord } from '$lib/types';

const cards: CardRecord[] = [
	{
		id: 'first',
		title: 'Première carte',
		shortDescription: 'Première révélation.',
		longDescription: 'Première révélation.',
		rarity: 'Commune',
		rarityInitials: 'C',
		rarityColor: '#d3e4f8',
		viewCount: 1,
		imageUrl: '',
		wikipediaUrl: '',
		attack: 100,
		defense: 200,
		ownedCount: 0,
		globalSupply: 1,
		friendsWhoOwn: []
	},
	{
		id: 'second',
		title: 'Carte légendaire',
		shortDescription: 'Dernière révélation.',
		longDescription: 'Dernière révélation.',
		rarity: 'Légendaire',
		rarityInitials: 'L',
		rarityColor: '#cf1d1d',
		viewCount: 1,
		imageUrl: '',
		wikipediaUrl: '',
		attack: 900,
		defense: 800,
		ownedCount: 0,
		globalSupply: 1,
		friendsWhoOwn: []
	}
];

describe('BoosterOpeningStage', () => {
	it('prevents another opening while the request is active', async () => {
		const onOpen = vi.fn();
		render(BoosterOpeningStage, {
			available: 1,
			maximum: 1,
			opening: true,
			cards: null,
			onOpen,
			onReset: vi.fn()
		});

		const openButton = page.getByRole('button', { name: 'Ouverture en cours…' });
		await expect.element(openButton).toBeDisabled();
		expect(onOpen).not.toHaveBeenCalled();
	});

	it('guides navigation through every revealed card', async () => {
		render(BoosterOpeningStage, {
			available: 0,
			maximum: 1,
			opening: false,
			cards,
			onOpen: vi.fn(),
			onReset: vi.fn()
		});

		await expect.element(page.getByText('Première carte')).toBeVisible();
		await page.getByRole('button', { name: 'Découvrir la suivante' }).click();
		await expect.element(page.getByText('Carte légendaire')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Quitter' })).toBeVisible();
	});
});
