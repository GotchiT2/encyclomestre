import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
vi.mock('$lib/api/public-env', () => ({ env: {} }));
import WishlistActionMenu from './wishlist-action-menu.svelte';

const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));

vi.mock('svelte-sonner', () => ({
	toast: { success: toastSuccess, error: vi.fn() }
}));

describe('WishlistActionMenu', () => {
	it('lets the user choose the named wishlist receiving the card', async () => {
		const onToggle = vi.fn().mockResolvedValue(undefined);
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
			cardTitle: 'Carte distante',
			onToggle
		});

		await page.getByRole('button', { name: 'Ajouter à une wishlist' }).click();
		const destination = page.getByRole('menuitem', { name: 'Cartes recherchées' });
		expect(
			Number(
				getComputedStyle(destination.element().closest('[data-slot="dropdown-menu-content"]')!)
					.zIndex
			)
		).toBeGreaterThan(50);
		await destination.click();
		await vi.waitFor(() => expect(onToggle).toHaveBeenCalledWith('wishlist-1', true));
		expect(toastSuccess).toHaveBeenCalledWith(
			'« Carte distante » a été ajoutée à « Cartes recherchées ».'
		);
	});
});
