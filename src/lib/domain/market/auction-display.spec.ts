import { describe, expect, it } from 'vitest';
import { auctionCountdown, auctionPrice, minimumAuctionBid } from './auction-display';

describe('auction display', () => {
	it('keeps the starting price until a bid updates the current price', () => {
		expect(auctionPrice(40)).toBe(40);
		expect(auctionPrice(40, 55)).toBe(55);
		expect(minimumAuctionBid(40, 55)).toBe(61);
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
