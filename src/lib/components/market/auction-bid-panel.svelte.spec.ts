import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import type { Auction } from '$lib/types';
import { mockCards } from '$lib/api/mocks/cards';
import AuctionBidPanel from './auction-bid-panel.svelte';
const { bid } = vi.hoisted(() => ({ bid: vi.fn() }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$lib/api/auctions', () => ({ bidAuction: bid, retractAuctionMax: vi.fn() }));
const auction = {
	id: '1',
	seller: { id: '2', name: 'Vendeur' },
	card: { ...mockCards[0], pageId: 1, packId: 1 },
	status: 'OPEN',
	startPrice: 100,
	price: 140,
	minBid: 150,
	nbBids: 1,
	leading: false,
	startsAt: '2026-09-27T11:00:00Z',
	endsAt: '2026-09-27T13:00:00Z',
	nbExtensions: 0
} satisfies Auction;
describe('Auction bid form', () => {
	it('keeps the draft when a live update raises the minimum', async () => {
		const props = {
			auction,
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated: vi.fn(),
			onConflict: vi.fn().mockResolvedValue(undefined)
		};
		const view = render(AuctionBidPanel, props);
		await page.getByRole('spinbutton', { name: 'Votre maximum' }).fill('200');
		await view.rerender({ ...props, auction: { ...auction, minBid: 250, nbBids: 2 } });
		await expect.element(page.getByRole('spinbutton', { name: 'Votre maximum' })).toHaveValue(200);
		await expect
			.element(page.getByRole('button', { name: 'Confirmer mon maximum' }))
			.toBeDisabled();
	});
	it('requires confirmation and sends exactly the submitted maximum once', async () => {
		bid.mockReset().mockResolvedValue({ ...auction, leading: true, myMax: 300 });
		const onUpdated = vi.fn();
		render(AuctionBidPanel, {
			auction,
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated,
			onConflict: vi.fn().mockResolvedValue(undefined)
		});
		await page.getByRole('spinbutton', { name: 'Votre maximum' }).fill('300');
		await page.getByRole('button', { name: 'Confirmer mon maximum' }).click();
		expect(bid).not.toHaveBeenCalled();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		expect(bid).toHaveBeenCalledExactlyOnceWith('1', 300);
		expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ leading: true, myMax: 300 }));
	});
});
