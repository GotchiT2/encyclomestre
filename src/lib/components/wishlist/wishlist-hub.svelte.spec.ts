import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistHub from './wishlist-hub.svelte';
import type { WishlistRegistrySummary } from '$lib/types';

const registries: WishlistRegistrySummary[] = [
	{
		id: 'wishlist-1',
		userId: 'user-1',
		title: 'Première liste',
		description: '',
		cardIds: [],
		createdAt: '',
		updatedAt: '',
		opportunityCount: 0
	},
	{
		id: 'wishlist-2',
		userId: 'user-1',
		title: 'Deuxième liste',
		description: '',
		cardIds: ['42'],
		createdAt: '',
		updatedAt: '',
		opportunityCount: 0
	}
];

describe('WishlistHub', () => {
	it('deletes the wishlist selected by its own action', async () => {
		const onDelete = vi.fn();
		render(WishlistHub, {
			registries,
			activeId: registries[0].id,
			onSelect: vi.fn(),
			onCreate: vi.fn(),
			onDelete
		});

		const deleteButtons = page.getByRole('button', { name: 'Supprimer la wishlist' });
		await deleteButtons.nth(1).click();

		expect(onDelete).toHaveBeenCalledWith(registries[1]);
	});
});
