import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import PublicWishlistList from './public-wishlist-list.svelte';
import type { CardRecord, PublicWishlist } from '$lib/types';

const card: CardRecord = {
	id: 'variant-1',
	title: 'Carte proposée',
	shortDescription: '',
	longDescription: '',
	rarity: 'Rare',
	rarityInitials: 'R',
	rarityColor: '#5c1dcf',
	viewCount: 1,
	imageUrl: '',
	wikipediaUrl: '',
	attack: 1,
	defense: 1,
	ownedCount: 0,
	globalSupply: 1,
	friendsWhoOwn: []
};

const wishlists: PublicWishlist[] = [
	{
		id: 'wishlist-1',
		userId: 'friend-1',
		title: 'Liste publique',
		description: '',
		updatedAt: '',
		cards: [{ card, viewerOwnedCount: 2, viewerUserCardIds: ['copy-1', 'copy-2'] }]
	}
];

describe('PublicWishlistList', () => {
	it('offers the exact owned copy without opening card details', async () => {
		const onTrade = vi.fn();
		render(PublicWishlistList, { wishlists, onTrade });

		await expect.element(page.getByText('Vous possédez 2 exemplaire(s)')).toBeVisible();
		await page.getByRole('button', { name: 'Proposer cette carte' }).click();
		expect(onTrade).toHaveBeenCalledWith('copy-1');
	});
});
