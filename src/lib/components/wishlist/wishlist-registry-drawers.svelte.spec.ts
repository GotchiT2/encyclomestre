import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistRegistryDrawers from './wishlist-registry-drawers.svelte';
import type { WishlistRegistrySummary } from '$lib/types';

const registry: WishlistRegistrySummary = {
	id: 'wishlist-1',
	userId: 'user-1',
	title: 'Wishlist existante',
	description: 'Description',
	isPublic: true,
	cardIds: [],
	cards: [],
	opportunityCount: 0,
	createdAt: '',
	updatedAt: ''
};

describe('WishlistRegistryDrawers', () => {
	it('creates a public wishlist from the centered modal', async () => {
		const onCreate = vi.fn();
		render(WishlistRegistryDrawers, {
			createOpen: true,
			editOpen: false,
			deleteOpen: false,
			registry: null,
			onCreate,
			onUpdate: vi.fn(),
			onDelete: vi.fn()
		});

		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toHaveClass('left-1/2', '-translate-x-1/2');
		const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
		await page.elementLocator(inputs[0]).fill('Liste publique');
		await page.getByRole('switch').click();
		await page.getByRole('button', { name: 'Enregistrer' }).click();

		expect(onCreate).toHaveBeenCalledWith('Liste publique', '', true);
	});

	it('edits the visibility of an existing wishlist', async () => {
		const onUpdate = vi.fn();
		render(WishlistRegistryDrawers, {
			createOpen: false,
			editOpen: true,
			deleteOpen: false,
			registry,
			onCreate: vi.fn(),
			onUpdate,
			onDelete: vi.fn()
		});

		await expect.element(page.getByRole('switch')).toBeChecked();
		await page.getByRole('switch').click();
		await page.getByRole('button', { name: 'Enregistrer' }).click();

		expect(onUpdate).toHaveBeenCalledWith(registry.title, registry.description, false);
	});
});
