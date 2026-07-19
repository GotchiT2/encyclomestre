import { describe, expect, it } from 'vitest';
import {
	auctionCountdown,
	auctionPrice,
	isSaleOpen,
	minimumAuctionBid,
	salePricePresentation,
	sortMarketListings
} from './auction-display';

describe('auction display', () => {
	it('keeps the starting price until a bid updates the current price', () => {
		expect(auctionPrice(40)).toBe(40);
		expect(auctionPrice(40, 55)).toBe(55);
		expect(minimumAuctionBid(40, 55)).toBe(61);
	});

	it('distinguishes active bids, completed sales and unsold auctions', () => {
		const base = {
			id: 'sale',
			sellerId: 'seller',
			cardId: 'card',
			price: 40,
			currency: 'KTD',
			type: 'auction' as const
		};
		expect(
			salePricePresentation({ ...base, status: 'sold', buyerId: 'buyer', currentPrice: 55 })
		).toEqual({ label: 'market.sale_price', amount: 55 });
		expect(salePricePresentation({ ...base, status: 'expired', currentPrice: 40 })).toEqual({
			label: 'market.starting_bid',
			amount: 40
		});
		expect(isSaleOpen({ ...base, status: 'cancelled' })).toBe(false);
	});

	it('sorts auctions by nearest end and current bid', () => {
		const sales = [
			{
				id: 'late',
				sellerId: 's',
				cardId: 'c',
				price: 90,
				currency: 'KTD',
				type: 'auction' as const,
				endsAt: '2026-07-20T00:00:00Z'
			},
			{
				id: 'near',
				sellerId: 's',
				cardId: 'c',
				price: 10,
				currentPrice: 20,
				currency: 'KTD',
				type: 'auction' as const,
				endsAt: '2026-07-19T00:00:00Z'
			}
		];
		expect(sortMarketListings(sales, 'ending').map((sale) => sale.id)).toEqual(['near', 'late']);
		expect(sortMarketListings(sales, 'bid_desc').map((sale) => sale.id)).toEqual(['late', 'near']);
	});

	it('describes active, imminent and expired auctions', () => {
		const now = Date.UTC(2026, 6, 19, 10, 0, 0);
		expect(auctionCountdown('2026-07-19T11:30:00.000Z', now)).toMatchObject({
			state: 'active',
			relative: '1h 30min'
		});
		expect(auctionCountdown('2026-07-19T10:00:20.000Z', now)).toMatchObject({
			state: 'imminent',
			relative: '20s'
		});
		expect(auctionCountdown('2026-07-19T09:59:59.000Z', now)).toMatchObject({ state: 'expired' });
	});
});
