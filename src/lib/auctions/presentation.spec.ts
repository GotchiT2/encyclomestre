import { describe, expect, it } from 'vitest';
import {
	auctionPhase,
	creationFee,
	historyKind,
	marketBackTarget,
	marketQuery,
	filterAuctions,
	validAmount,
	validAuctionPeriod
} from './presentation';
import type { Auction } from '$lib/types';
const now = Date.parse('2026-09-27T12:00:00Z');
const item = {
	id: '1',
	seller: { id: '2', name: 'Émilie' },
	card: { title: 'Nébuleuse', variantId: 4 },
	status: 'OPEN',
	startsAt: '2026-09-27T11:00:00Z',
	endsAt: '2026-09-27T13:00:00Z',
	price: 150
} as Auction;
describe('auction views and constraints', () => {
	it('distinguishes scheduled, ongoing, pending settlement and cancelled', () => {
		expect(auctionPhase(item, now)).toBe('open');
		expect(auctionPhase(item, now - 7_200_000)).toBe('upcoming');
		expect(auctionPhase(item, now + 3_600_000)).toBe('settling');
		expect(auctionPhase({ ...item, status: 'CANCELLED' }, now)).toBe('cancelled');
	});
	it('does not guess a winner when the leader is hidden', () => {
		expect(historyKind({ ...item, status: 'SOLD', leading: false, leader: null }, '1')).toBe(
			'unknown'
		);
		expect(historyKind({ ...item, status: 'SOLD', leading: true }, '1')).toBe('won');
		expect(historyKind({ ...item, status: 'SOLD' }, '2')).toBe('sold');
	});
	it('combines filters over only the supplied page and safely restores navigation', () => {
		const query = marketQuery(
			new URLSearchParams('q=nebuleuse&seller=emilie&variant=4&min=100&max=200&phase=open&page=2')
		);
		expect(filterAuctions([item], query, now)).toEqual([item]);
		expect(filterAuctions([item], { ...query, min: '200' }, now)).toEqual([]);
		expect(marketBackTarget('https://evil.test')).toBe('/market');
		expect(marketBackTarget('/market?tab=bids')).toBe('/market?tab=bids');
		expect(marketQuery(new URLSearchParams('page=-4&tab=invalid')).page).toBe(0);
	});
	it('enforces amounts, fees and scheduling limits', () => {
		expect([creationFee(10), creationFee(11), creationFee(101)]).toEqual([0, 1, 2]);
		expect(validAmount(NaN)).toBe(false);
		expect(validAmount(1e12 + 1)).toBe(false);
		expect(validAuctionPeriod(now, now + 600_000, now)).toBe(true);
		expect(validAuctionPeriod(now, NaN, now)).toBe(false);
		expect(validAuctionPeriod(now + 86_400_001, now + 87_000_001, now)).toBe(false);
	});
});
