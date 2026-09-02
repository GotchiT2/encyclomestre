import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import CollectionVitrine from './collection-vitrine.svelte';
import type { CardRecord } from '$lib/types';

const cards: CardRecord[] = ['Rose', 'Jade'].map((title, index) => ({
	id: String(12 + index),
	title,
	shortDescription: '',
	longDescription: '',
	rarity: 'Commune',
	rarityInitials: 'C',
	rarityColor: '#ffffff',
	viewCount: 0,
	imageUrl: '/card-placeholder.svg',
	wikipediaUrl: '',
	attack: 0,
	defense: 0,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: []
}));

describe('CollectionVitrine', () => {
	it('keeps the historical shelf composition and exposes card actions through its menu', async () => {
		const onMove = vi.fn();
		const onRemove = vi.fn();
		render(CollectionVitrine, {
			title: 'Préférées',
			cards,
			perRow: 5,
			maxPerRow: 5,
			onMove,
			onRemove
		});

		await expect.element(page.getByText('Préférées')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Rose' })).toBeVisible();
		await page.getByRole('button', { name: 'Rose' }).click({ button: 'right' });
		await page.getByRole('menuitem', { name: 'Déplacer à droite' }).click();
		expect(onMove).toHaveBeenCalledWith('12', 1);
	});
});
