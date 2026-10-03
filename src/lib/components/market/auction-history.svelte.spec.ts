import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
import AuctionHistory from './auction-history.svelte';
import type { Auction } from '$lib/types';
import { mockCards } from '$lib/api/mocks/cards';

describe('auction history identities', () => {
	it('uses cropped avatars beside each player and preserves masked bids without a profile link', async () => {
		const user = { id: '2', name: 'Émilie' };
		const auction: Auction = {
			id: '70',
			seller: user,
			card: { ...mockCards[0], pageId: 1, packId: 1 },
			status: 'OPEN',
			startPrice: 100,
			minBid: 150,
			leading: false,
			nbBids: 3,
			nbExtensions: 0,
			startsAt: '2026-10-03T12:00:00Z',
			endsAt: '2026-10-03T18:00:00Z',
			bids: [
				{ user, amount: 140, auto: false, date: '2026-10-03T14:00:00Z' },
				{ user, amount: 130, auto: true, date: '2026-10-03T13:00:00Z' },
				{ user: null, amount: 120, auto: false, date: 'invalid' }
			]
		};
		const image =
			'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3C/svg%3E';
		const view = render(AuctionHistory, {
			auction,
			players: { '2': { ...user, image, imageCrop: { x: 70, y: 30, zoom: 1.5 } } }
		});
		await expect
			.element(page.getByRole('link', { name: 'Émilie', exact: true }))
			.toHaveAttribute('href', '/users/2');
		const avatars = view.container.querySelectorAll('[data-bid-player] img');
		expect(avatars.length).toBe(2);
		for (const avatar of avatars)
			expect(avatar.getAttribute('style')).toMatch(/object-position:\s*70% 30%/);
		await expect.element(page.getByText('Joueur masqué')).toBeVisible();
		expect(view.container.querySelectorAll('a')).toHaveLength(2);
		await view.rerender({ auction, players: { '2': null } });
		expect(view.container.querySelector('[data-bid-player] img')).toBeNull();
		expect(view.container.querySelector('[data-bid-player]')?.textContent).toContain('É');
	});
});
