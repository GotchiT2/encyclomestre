import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import CardGrid from './card-grid.svelte';
import type { CardRecord } from '$lib/types';

const card: CardRecord = {
	id: 'selected-card',
	title: 'Carte sélectionnée',
	shortDescription: 'Description.',
	longDescription: 'Description.',
	rarity: 'Rare',
	rarityInitials: 'R',
	rarityColor: '#5c1dcf',
	viewCount: 1,
	imageUrl: '',
	wikipediaUrl: '',
	attack: 100,
	defense: 200,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: []
};

describe('CardGrid selection', () => {
	it('keeps the selection control above the card frame', async () => {
		render(CardGrid, {
			cards: [card],
			tags: [],
			assignments: {},
			isSelectionMode: true,
			selectedCardIds: [card.id],
			onToggleCard: vi.fn()
		});

		const selection = page.getByRole('button', { name: 'Retirer cette carte de la sélection' });
		await expect.element(selection).toHaveClass('inset-0', 'h-full', 'w-full', 'z-50');
		await expect.element(selection).toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByTestId('card-selection-checkbox'))
			.toHaveClass('size-6', 'sm:size-7');
	});

	it('keeps two cards per row without page overflow on compact phones', async () => {
		render(CardGrid, {
			cards: [card, { ...card, id: 'second-card', title: 'Seconde carte' }],
			tags: [],
			assignments: {},
			isSelectionMode: false,
			selectedCardIds: [],
			onToggleCard: vi.fn()
		});

		const grid = document.querySelector<HTMLElement>('.wikiforge-card-grid');
		for (const [width, height] of [
			[320, 568],
			[360, 800],
			[390, 844],
			[430, 932]
		]) {
			await page.viewport(width, height);
			expect(getComputedStyle(grid!).gridTemplateColumns.split(' ')).toHaveLength(2);
			expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
				document.documentElement.clientWidth
			);
		}
	});
});
