import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
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
		await expect.element(selection).toHaveClass('z-30');
		await expect.element(selection).toHaveAttribute('aria-pressed', 'true');
	});
});
