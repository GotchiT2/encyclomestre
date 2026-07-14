import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';

vi.mock('$lib/api', () => ({
	applyWikiForgeTag: vi.fn(),
	removeWikiForgeTag: vi.fn(),
	createWikiForgeTag: vi.fn(),
	updateWikiForgeTag: vi.fn(),
	deleteWikiForgeTag: vi.fn()
}));

import CardDetailModal from './card-detail-modal.svelte';
import type { CardRecord } from '$lib/types';

const card: CardRecord = {
	id: 'card-1',
	title: 'Carte de test',
	shortDescription: 'Description courte.',
	longDescription: 'Description complète.',
	rarity: 'Rare',
	rarityInitials: 'R',
	rarityColor: '#5c1dcf',
	viewCount: 10,
	imageUrl: '',
	wikipediaUrl: 'https://fr.wikipedia.org',
	attack: 100,
	defense: 200,
	ownedCount: 0,
	globalSupply: 10,
	friendsWhoOwn: []
};

describe('CardDetailModal', () => {
	it('uses its content height without an internal desktop scrollbar', async () => {
		render(CardDetailModal, {
			card,
			onToggleWishlist: vi.fn(),
			onClose: vi.fn()
		});

		await expect.element(page.getByTestId('card-detail-modal')).toHaveClass(/sm:h-auto/);
		await expect.element(page.getByTestId('card-detail-modal')).toHaveClass(/sm:bottom-auto/);
		await expect.element(page.getByTestId('card-detail-modal')).not.toHaveClass(/lg:h-/);
		await expect
			.element(page.getByTestId('card-detail-tab-panel'))
			.not.toHaveClass(/overflow-y-auto/);
	});
});
