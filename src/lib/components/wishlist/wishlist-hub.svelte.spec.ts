import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistHub from './wishlist-hub.svelte';
import type { WishlistGroups } from '$lib/types';

const groups: WishlistGroups = {
	owned: [
		{
			id: '1',
			title: 'Ma liste',
			description: '',
			cardCount: 3,
			ownerName: null,
			invitedAt: null,
			access: 'owned'
		}
	],
	shared: [
		{
			id: '2',
			title: 'Liste partagée',
			description: '',
			cardCount: 2,
			ownerName: 'SoneS9',
			invitedAt: '',
			access: 'shared'
		}
	],
	pending: [
		{
			id: '3',
			title: 'Invitation',
			description: '',
			cardCount: 1,
			ownerName: 'Ariane',
			invitedAt: '',
			access: 'pending'
		}
	]
};

describe('WishlistHub', () => {
	it('separates owned, shared and pending lists with their permitted actions', async () => {
		const onSelect = vi.fn();
		const onAccept = vi.fn();
		const onLeave = vi.fn();
		render(WishlistHub, {
			groups,
			activeId: '1',
			onSelect,
			onCreate: vi.fn(),
			onEdit: vi.fn(),
			onDelete: vi.fn(),
			onAccept,
			onDecline: vi.fn(),
			onLeave
		});

		await expect.element(page.getByText('Partagées avec moi')).toBeVisible();
		await expect.element(page.getByText('Invitations en attente')).toBeVisible();
		await page.getByRole('button', { name: 'Ma liste' }).click();
		expect(onSelect).toHaveBeenCalledWith(groups.owned[0]);
		await page.getByRole('button', { name: 'Accepter l’invitation' }).click();
		expect(onAccept).toHaveBeenCalledWith(groups.pending[0]);
		await page.getByRole('button', { name: 'Quitter' }).click();
		expect(onLeave).toHaveBeenCalledWith(groups.shared[0]);
	});

	it('renders the illustration supplied for a wishlist', async () => {
		const illustratedGroups: WishlistGroups = {
			...groups,
			owned: [{ ...groups.owned[0], imageUrl: 'https://images.example.test/wishlist.jpg' }]
		};
		render(WishlistHub, {
			groups: illustratedGroups,
			activeId: '1',
			onSelect: vi.fn(),
			onCreate: vi.fn(),
			onEdit: vi.fn(),
			onDelete: vi.fn(),
			onAccept: vi.fn(),
			onDecline: vi.fn(),
			onLeave: vi.fn()
		});

		expect(
			document.querySelector('img[src="https://images.example.test/wishlist.jpg"]')
		).not.toBeNull();
	});
});
