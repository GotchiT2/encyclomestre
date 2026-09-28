import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest, variants } = vi.hoisted(() => ({
	apiRequest: vi.fn(),
	variants: [{ id: 4, name: 'Chromée', color: '#d1b25a', styles: ['CHROME'], renderKey: 'chrome' }]
}));
vi.mock('./client', () => ({ apiRequest }));
vi.mock('./variants', async (importOriginal) => ({
	...(await importOriginal<typeof import('./variants')>()),
	getVariants: vi.fn().mockResolvedValue(variants)
}));

import {
	bidAuction,
	cancelMyAuction,
	createAuction,
	getAuctions,
	getAuctionFee,
	getAuctionFavorites,
	setAuctionFavorite,
	getMyAuctions,
	getMyBids,
	retractAuctionMax,
	unwatchAuction,
	updateAuction,
	watchAuction
} from './auctions';
import { reportPage } from './reports';

const dto = {
	id: 7,
	seller: { id: 2, name: 'Vendeur' },
	card: {
		id: 44,
		pageId: 1234,
		title: 'Nébuleuse',
		image: undefined,
		variantId: 4,
		packId: 2,
		atk: 8
	},
	status: 'OPEN',
	startPrice: 100,
	price: 120,
	minBid: 130,
	nbBids: 2,
	leading: false,
	startsAt: '2026-09-26T18:00:00',
	endsAt: '2026-09-26T19:00:00',
	nbExtensions: 1,
	bids: [{ user: null, amount: 120, auto: true, date: '2026-09-26T18:12:00' }]
};

describe('WikiForge auction and report contracts', () => {
	beforeEach(() => apiRequest.mockReset());
	it('requests public pages and converts UTC dates and hidden bidders without breaking image fallback', async () => {
		apiRequest.mockResolvedValue({ nbResults: 1, page: 0, results: [dto] });
		const result = await getAuctions();
		expect(apiRequest).toHaveBeenCalledWith('/auctions?page=0', { apiTarget: 'wikiforge' });
		expect(result.results[0]).toMatchObject({
			id: '7',
			startsAt: '2026-09-26T18:00:00.000Z',
			card: { variant: { name: 'Chromée' }, imageUrl: '/card-placeholder.svg' },
			bids: [{ user: null }]
		});
	});
	it('sends max bids, watch lifecycle and max retraction to their exact methods', async () => {
		apiRequest.mockResolvedValue(dto);
		await bidAuction(7, 500);
		await watchAuction(7);
		await unwatchAuction(7);
		await retractAuctionMax(7);
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/auctions/7/bids', {
			method: 'POST',
			body: { maxAmount: 500 },
			apiTarget: 'wikiforge'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/auctions/7/watch', {
			method: 'PUT',
			apiTarget: 'wikiforge'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/auctions/7/watch', {
			method: 'DELETE',
			apiTarget: 'wikiforge'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(4, '/auctions/7/max', {
			method: 'DELETE',
			apiTarget: 'wikiforge'
		});
	});
	it('creates, edits, cancels and reads player auctions and escrow without changing DTO bodies', async () => {
		apiRequest
			.mockResolvedValueOnce(dto)
			.mockResolvedValueOnce(dto)
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce({
				nbResults: 1,
				page: 0,
				pageSize: 48,
				hasNext: false,
				results: [dto]
			})
			.mockResolvedValueOnce({ escrowed: 500, auctions: [dto] });
		const input = {
			cardId: 44,
			startPrice: 200,
			startsAt: '2026-09-26T18:00:00',
			endsAt: '2026-09-26T19:00:00'
		};
		await createAuction(input);
		await updateAuction(7, 250);
		await cancelMyAuction(7);
		await getMyAuctions();
		await getMyBids();
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/me/auctions', {
			method: 'POST',
			body: input,
			apiTarget: 'wikiforge'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/me/auctions/7', {
			method: 'PATCH',
			body: { startPrice: 250 },
			apiTarget: 'wikiforge'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(3, '/me/auctions/7', {
			method: 'DELETE',
			apiTarget: 'wikiforge'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(4, '/me/auctions?page=0', {
			apiTarget: 'wikiforge'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(5, '/me/bids?page=0', undefined);
	});
	it('reports article content with an optional trimmed comment', async () => {
		apiRequest.mockResolvedValue(undefined);
		await reportPage(1234, 'INAPPROPRIATE', '  image masquée  ');
		expect(apiRequest).toHaveBeenCalledWith('/reports', {
			apiTarget: 'wikiforge',
			method: 'POST',
			body: { type: 'PAGE', id: 1234, reason: 'INAPPROPRIATE', comment: 'image masquée' }
		});
	});
	it('accepts omitted empty lists in public results and player bids', async () => {
		apiRequest
			.mockResolvedValueOnce({ nbResults: 0, page: 0 })
			.mockResolvedValueOnce({ escrowed: 0 });
		expect((await getAuctions()).results).toEqual([]);
		expect(await getMyBids()).toEqual({ escrowed: 0, auctions: [] });
	});
});

describe('updated auction contracts', () => {
	it('sends every global filter including repeated variants and preserves paging metadata', async () => {
		apiRequest.mockResolvedValue({ page: 2, pageSize: 48, hasNext: false, nbResults: 98 });
		const result = await getAuctions({
			page: 2,
			q: 'étoile',
			pageId: '12',
			variant: ['4', '5'],
			sellerId: '8',
			wishlist: '9',
			phase: 'RUNNING',
			minPrice: '0',
			maxPrice: '800',
			sortBy: 'PRICE',
			sortDirection: 'DESC'
		});
		expect(apiRequest).toHaveBeenLastCalledWith(
			'/auctions?page=2&q=%C3%A9toile&pageId=12&variant=4&variant=5&sellerId=8&wishlist=9&phase=RUNNING&minPrice=0&maxPrice=800&sortBy=PRICE&sortDirection=DESC',
			{ apiTarget: 'wikiforge' }
		);
		expect(result).toMatchObject({ hasNext: false, pageSize: 48, results: [] });
	});
	it('keeps favorites separate from temporary watches and reads a fee quote', async () => {
		apiRequest.mockResolvedValue({ nbResults: 0, page: 0, pageSize: 48, hasNext: false });
		await getAuctionFavorites(3);
		expect(apiRequest).toHaveBeenLastCalledWith('/me/auction-favorites?page=3', {
			apiTarget: 'wikiforge'
		});
		await setAuctionFavorite('7', true);
		expect(apiRequest).toHaveBeenLastCalledWith('/me/auction-favorites/7', { method: 'PUT' });
		await setAuctionFavorite('7', false);
		expect(apiRequest).toHaveBeenLastCalledWith('/me/auction-favorites/7', { method: 'DELETE' });
		apiRequest.mockResolvedValue({
			startPrice: 1000,
			feePercent: 1,
			fee: 10,
			alreadyPaid: 8,
			due: 2
		});
		expect((await getAuctionFee(1000, '7')).due).toBe(2);
		expect(apiRequest).toHaveBeenLastCalledWith(
			'/me/auctions/fee?startPrice=1000&auctionId=7',
			undefined
		);
	});
	it('uses status and pagination independently for sales and bids', async () => {
		apiRequest.mockResolvedValue({
			page: 2,
			pageSize: 48,
			hasNext: true,
			nbResults: 160,
			escrowed: 1500
		});
		expect((await getMyAuctions(undefined, { page: 2, status: 'SOLD' })).results).toEqual([]);
		expect(apiRequest).toHaveBeenLastCalledWith('/me/auctions?page=2&status=SOLD', {
			apiTarget: 'wikiforge'
		});
		expect(await getMyBids(undefined, { page: 2, status: 'OPEN' })).toMatchObject({
			escrowed: 1500,
			hasNext: true,
			auctions: []
		});
	});
});
