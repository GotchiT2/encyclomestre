import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistSocialGrid from './wishlist-social-grid.svelte';
import type { WishlistPageEntry } from '$lib/types';

const entry: WishlistPageEntry = {
	addedAt: '2026-08-20T12:00:00Z',
	card: {
		id: '42',
		baseCardId: 42,
		title: 'Paris',
		shortDescription: '',
		longDescription: '',
		rarity: 'Légendaire',
		rarityInitials: 'L',
		rarityColor: '#E5A93C',
		viewCount: 100,
		imageUrl: '',
		wikipediaUrl: '',
		attack: 10,
		defense: 0,
		ownedCount: 0,
		globalSupply: 3,
		friendsWhoOwn: []
	}
};

describe('WishlistSocialGrid', () => {
	it('allows removal only for an owned wishlist', async () => {
		const onRemove = vi.fn();
		const onOpen = vi.fn();
		const view = render(WishlistSocialGrid, {
			entries: [entry],
			editable: true,
			onOpen,
			onRemove
		});
		const cardWrapper = document.querySelector('[data-testid="card-tile"]')?.parentElement;
		expect(cardWrapper).toHaveClass('wikiforge-card-size', 'relative', 'isolate');
		await page.getByRole('button', { name: 'Retirer de la wishlist' }).click();
		expect(onRemove).toHaveBeenCalledWith('42');
		await page.getByRole('button', { name: 'Paris' }).click();
		expect(onOpen).toHaveBeenCalledWith(entry);

		await view.rerender({ entries: [entry], editable: false, onOpen: vi.fn(), onRemove });
		expect(page.getByRole('button', { name: 'Retirer de la wishlist' }).query()).toBeNull();
	});
});
