import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import type { Auction } from '$lib/types';
import { mockCards } from '$lib/api/mocks/cards';
import AuctionBidPanel from './auction-bid-panel.svelte';
import { ApiError } from '$lib/api/client';
const { bid, retract } = vi.hoisted(() => ({ bid: vi.fn(), retract: vi.fn() }));
vi.mock('$lib/api/public-env', () => ({ env: {} }));
vi.mock('$lib/api/auctions', () => ({ bidAuction: bid, retractAuctionMax: retract }));
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
	it('refreshes a conflicting bid once and retains the draft without resubmission', async () => {
		bid.mockReset().mockRejectedValue(new ApiError(409, { error: 'AUCTION_CONFLICT' }));
		const onConflict = vi.fn().mockResolvedValue(undefined);
		const props = {
			auction,
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated: vi.fn(),
			onConflict
		};
		const view = render(AuctionBidPanel, props);
		await page.getByRole('spinbutton').fill('200');
		await page.getByRole('button', { name: /Mise rapide.*150/ }).click();
		await vi.waitFor(() => expect(onConflict).toHaveBeenCalledOnce());
		await view.rerender({ ...props, auction: { ...auction, minBid: 250 } });
		await expect.element(page.getByRole('spinbutton')).toHaveValue(200);
		await expect
			.element(page.getByText(/Le prochain maximum doit être d’au moins 250/))
			.toBeVisible();
		expect(bid).toHaveBeenCalledExactlyOnceWith('1', 150);
		await page.getByRole('spinbutton').fill('300');
		await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Confirmer mon maximum' })).toBeEnabled();
	});
	it('quick bids exceed the current personal maximum and disable when bidding closes', async () => {
		bid.mockReset().mockResolvedValue({ ...auction, leading: true, myMax: 501 });
		const props = {
			auction: { ...auction, leading: true, myMax: 500 },
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated: vi.fn(),
			onConflict: vi.fn()
		};
		const view = render(AuctionBidPanel, props);
		await page.getByRole('button', { name: /Mise rapide.*501/ }).click();
		expect(bid).toHaveBeenCalledExactlyOnceWith('1', 501);
		await view.rerender({ ...props, now: Date.parse(auction.endsAt) });
		await expect.element(page.getByRole('button', { name: /Mise rapide/ })).toBeDisabled();
	});
	it('still confirms surplus recovery before sending a single request', async () => {
		retract.mockReset().mockResolvedValue({ ...auction, leading: true, myMax: 140 });
		render(AuctionBidPanel, {
			auction: { ...auction, leading: true, myMax: 500 },
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated: vi.fn(),
			onConflict: vi.fn()
		});
		await page.getByRole('button', { name: 'Récupérer le surplus' }).click();
		expect(retract).not.toHaveBeenCalled();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		expect(retract).toHaveBeenCalledExactlyOnceWith('1');
	});
	it('clears a successful bid before the new personal minimum invalidates it', async () => {
		const next = { ...auction, leading: true, myMax: 300 };
		bid.mockReset().mockResolvedValue(next);
		const props = {
			auction,
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated: vi.fn(),
			onConflict: vi.fn()
		};
		const view = render(AuctionBidPanel, props);
		await page.getByRole('spinbutton', { name: 'Votre maximum' }).fill('300');
		await page.getByRole('button', { name: 'Confirmer mon maximum' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		await view.rerender({ ...props, auction: next });
		expect(page.getByRole('spinbutton').element()).toHaveProperty('value', '');
		await expect.element(page.getByText(/Saisissez un entier positif/)).not.toBeInTheDocument();
	});
	it('quick bids send the current minimum without confirmation or double submission', async () => {
		let complete!: (value: Auction) => void;
		bid.mockReset().mockImplementation(
			() =>
				new Promise<Auction>((resolve) => {
					complete = resolve;
				})
		);
		const onUpdated = vi.fn();
		render(AuctionBidPanel, {
			auction,
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated,
			onConflict: vi.fn()
		});
		const quick = page.getByRole('button', { name: /Mise rapide.*150/ });
		const button = quick.element();
		if (!(button instanceof HTMLButtonElement)) throw new Error('Expected a bid button');
		button.click();
		button.click();
		expect(bid).toHaveBeenCalledExactlyOnceWith('1', 150);
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		complete({ ...auction, leading: true, myMax: 150 });
		await vi.waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
	});
	it('clears a server error on editing and preserves the rejected draft', async () => {
		bid.mockReset().mockRejectedValue(new ApiError(400, { error: 'NOT_ENOUGH_MONEY' }));
		render(AuctionBidPanel, {
			auction,
			now: Date.parse('2026-09-27T12:00:00Z'),
			onUpdated: vi.fn(),
			onConflict: vi.fn()
		});
		await page.getByRole('spinbutton').fill('300');
		await page.getByRole('button', { name: 'Confirmer mon maximum' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		await expect.element(page.getByRole('alert')).toBeVisible();
		await expect.element(page.getByRole('spinbutton')).toHaveValue(300);
		await page.getByRole('spinbutton').fill('200');
		await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
	});
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
