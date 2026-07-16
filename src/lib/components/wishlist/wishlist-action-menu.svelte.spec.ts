import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistActionMenu from './wishlist-action-menu.svelte';

describe('WishlistActionMenu', () => {
	it('lets the user choose the named wishlist receiving the card', async () => {
		const onToggle = vi.fn();
		render(WishlistActionMenu, {
			cardId: '42',
			wishlists: [
				{
					id: 'wishlist-1',
					userId: 'user-1',
					title: 'Cartes recherchées',
					description: '',
					cardIds: [],
					cards: [],
					createdAt: '',
					updatedAt: '',
					opportunityCount: 0
				}
			],
			onToggle
		});

		await page.getByRole('button', { name: 'Ajouter à une wishlist' }).click();
		await page.getByRole('menuitemcheckbox', { name: 'Cartes recherchées' }).click();
		expect(onToggle).toHaveBeenCalledWith('wishlist-1', true);
	});
});
