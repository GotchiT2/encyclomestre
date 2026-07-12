import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistSocialGrid from './wishlist-social-grid.svelte';
import type { CardRecord } from '$lib/types';

const girlsGeneration: CardRecord = {
	id: 'girls-generation-1',
	title: "Girls' Generation",
	shortDescription: 'Notice encyclopédique.',
	longDescription: 'Notice encyclopédique complète.',
	rarity: 'Légendaire',
	rarityInitials: 'L',
	rarityColor: '#E5A93C',
	viewCount: 100,
	imageUrl: '',
	wikipediaUrl: 'https://fr.wikipedia.org',
	attack: 9500,
	defense: 9800,
	ownedCount: 0,
	globalSupply: 100,
	friendsWhoOwn: [{ friendId: 'friend-0', username: 'SoneS9', avatarUrl: '', ownedCount: 2 }]
};

describe('WishlistSocialGrid', () => {
	it('signals a trade opportunity and starts the selected friend trade flow', async () => {
		const onInitiateTrade = vi.fn();
		render(WishlistSocialGrid, {
			cards: [girlsGeneration],
			onRemove: vi.fn(),
			onInitiateTrade
		});

		await expect.element(page.getByText('Opportunité d’échange')).toBeInTheDocument();
		await page.getByRole('button', { name: '@SoneS9 (×2)' }).click();
		expect(onInitiateTrade).toHaveBeenCalledWith(girlsGeneration, girlsGeneration.friendsWhoOwn[0]);
	});
});
