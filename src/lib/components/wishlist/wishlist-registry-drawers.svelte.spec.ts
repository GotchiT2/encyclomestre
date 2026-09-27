import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistRegistryDrawers from './wishlist-registry-drawers.svelte';

describe('WishlistRegistryDrawers', () => {
	it('creates a wishlist with only the fields supported by WikiForge', async () => {
		const onCreate = vi.fn();
		render(WishlistRegistryDrawers, {
			createOpen: true,
			registry: null,
			onCreate,
			onUpdate: vi.fn(),
			onDelete: vi.fn()
		});

		await page.getByPlaceholder('Nom de la wishlist').fill('Liste API');
		await page.getByPlaceholder('Description de la wishlist').fill('Description');
		await page.getByRole('button', { name: 'Enregistrer' }).click();

		expect(onCreate).toHaveBeenCalledWith('Liste API', 'Description', null, false);
		expect(page.getByRole('switch').query()).toBeNull();
	});
});
