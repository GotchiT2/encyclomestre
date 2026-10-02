import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { get } from 'svelte/store';
import '$lib/i18n';
import { mockCards } from '$lib/api/mocks/cards';
import { currentSession, verifiedWikiForgeSession } from '$lib/auth/session';
import { clearPersonalAuctions, personalAuctions } from '$lib/auctions/store';
import type { Auction } from '$lib/types';
import AuctionCreatePanel from './auction-create-panel.svelte';

const { sales, bids, fee, create } = vi.hoisted(() => ({
	sales: vi.fn(),
	bids: vi.fn(),
	fee: vi.fn(),
	create: vi.fn()
}));
vi.mock('$lib/api/public-env', () => ({ env: {} }));
vi.mock('$lib/api/moderation', () => ({ getSanctions: vi.fn().mockResolvedValue([]) }));
vi.mock('$lib/api/auctions', () => ({
	getMyAuctions: sales,
	getMyBids: bids,
	getAuctionFee: fee,
	createAuction: create
}));
const card = { ...mockCards[0], id: '42' };
const session = {
	accessToken: 'mock',
	user: {
		id: '1',
		username: 'Demo',
		displayName: 'Demo',
		role: 'user' as const,
		createdAt: '',
		updatedAt: ''
	}
};

describe('auction creation from a personal card', () => {
	beforeEach(() => {
		clearPersonalAuctions();
		currentSession.set(session);
		verifiedWikiForgeSession.set(false);
		sales.mockReset().mockResolvedValue({ results: [] });
		bids.mockReset().mockResolvedValue({ auctions: [], escrowed: 0 });
		fee.mockReset().mockResolvedValue({ due: 5 });
		create.mockReset();
	});
	afterEach(() => {
		currentSession.set(null);
		clearPersonalAuctions();
	});
	it('loads its prerequisites even when restored-session verification has not completed', async () => {
		render(AuctionCreatePanel, { card });
		await expect.element(page.getByRole('spinbutton', { name: 'Prix de départ' })).toBeVisible();
		expect(sales).toHaveBeenCalledExactlyOnceWith(undefined, { status: 'OPEN' });
		expect(bids).toHaveBeenCalledExactlyOnceWith(undefined, { status: 'OPEN' });
		expect(get(personalAuctions).userId).toBe('1');
	});
	it('retries a failed prerequisite read without creating an auction', async () => {
		sales.mockRejectedValueOnce(new Error('Network unavailable'));
		render(AuctionCreatePanel, { card });
		await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
		await expect.element(page.getByRole('spinbutton', { name: 'Prix de départ' })).toBeVisible();
		expect(sales).toHaveBeenCalledTimes(2);
		expect(create).not.toHaveBeenCalled();
	});
	it('shares concurrent reads and still refuses a protected card', async () => {
		render(AuctionCreatePanel, { card: { ...card, userProtected: true } });
		render(AuctionCreatePanel, { card });
		await expect.element(page.getByRole('spinbutton', { name: 'Prix de départ' })).toBeVisible();
		expect(sales).toHaveBeenCalledTimes(1);
		expect(bids).toHaveBeenCalledTimes(1);
	});
	it('ignores a previous account read that completes after switching accounts', async () => {
		let finish!: (value: { results: Auction[] }) => void;
		sales.mockImplementationOnce(
			() => new Promise<{ results: Auction[] }>((resolve) => (finish = resolve))
		);
		render(AuctionCreatePanel, { card });
		await vi.waitFor(() => expect(sales).toHaveBeenCalledTimes(1));
		currentSession.set({ ...session, user: { ...session.user, id: '2' } });
		await expect.element(page.getByRole('spinbutton', { name: 'Prix de départ' })).toBeVisible();
		finish({ results: [] });
		expect(get(personalAuctions).userId).toBe('2');
		expect(sales).toHaveBeenCalledTimes(2);
	});
	it('quotes the fee, confirms and creates the selected copy exactly once', async () => {
		const auction: Auction = {
			id: '91',
			card: { ...card, pageId: 1, packId: 1 },
			seller: { id: '1', name: 'Demo' },
			status: 'OPEN',
			startPrice: 100,
			price: 100,
			minBid: 101,
			nbBids: 0,
			leading: false,
			startsAt: new Date().toISOString(),
			endsAt: new Date(Date.now() + 3600000).toISOString(),
			nbExtensions: 0
		};
		create.mockResolvedValue(auction);
		render(AuctionCreatePanel, { card });
		await page.getByRole('spinbutton', { name: 'Prix de départ' }).fill('100');
		const end = new Date(Date.now() + 3600000);
		const local = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
			.toISOString()
			.slice(0, 16);
		await page.getByLabelText('Fin', { exact: true }).fill(local);
		await page.getByRole('button', { name: 'Mettre en vente', exact: true }).click();
		expect(fee).toHaveBeenCalledExactlyOnceWith(100);
		expect(create).not.toHaveBeenCalled();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		expect(create).toHaveBeenCalledExactlyOnceWith({
			cardId: 42,
			startPrice: 100,
			endsAt: new Date(local).toISOString()
		});
		await expect
			.element(page.getByRole('link', { name: 'Voir l’enchère', exact: true }))
			.toBeVisible();
	});
});
