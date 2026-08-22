import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistActionMenu from './wishlist-action-menu.svelte';

describe('WishlistActionMenu', () => {
	it('lets the user choose the named wishlist receiving the card', async () => {
		const onToggle = vi.fn();
		render(WishlistActionMenu, {
			wishlists: [
				{
					id: 'wishlist-1',
					title: 'Cartes recherchées',
					description: '',
					cardCount: 0,
					ownerName: null,
					invitedAt: null,
					access: 'owned'
				}
			],
			onToggle
		});

		await page.getByRole('button', { name: 'Ajouter à une wishlist' }).click();
		const destination = page.getByRole('menuitem', { name: 'Cartes recherchées' });
		expect(destination.element().closest('[data-slot="dropdown-menu-content"]')).toHaveStyle({
			zIndex: '120'
		});
		await destination.click();
		expect(onToggle).toHaveBeenCalledWith('wishlist-1', true);
	});
});
