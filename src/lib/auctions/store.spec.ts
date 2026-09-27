import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Auction } from '$lib/types';
const { sales, bids } = vi.hoisted(() => ({ sales: vi.fn(), bids: vi.fn() }));
vi.mock('$lib/api/auctions', () => ({ getMyAuctions: sales, getMyBids: bids }));
import {
	activeAuctionByCard,
	auctionEscrowed,
	clearPersonalAuctions,
	personalAuctions,
	recordOwnAuction,
	refreshPersonalAuctions
} from './store';
describe('personal auction state', () => {
	beforeEach(() => {
		clearPersonalAuctions();
		sales.mockReset();
		bids.mockReset().mockResolvedValue({ escrowed: 0, auctions: [] });
	});
	it('shares concurrent loads and clears account-specific associations on logout', async () => {
		sales.mockResolvedValue([{ id: '7', status: 'OPEN', card: { id: '12' } }]);
		await Promise.all([refreshPersonalAuctions('1'), refreshPersonalAuctions('1')]);
		expect(sales).toHaveBeenCalledTimes(1);
		expect(get(activeAuctionByCard).get('12')).toBe('7');
		clearPersonalAuctions();
		expect(get(activeAuctionByCard).size).toBe(0);
		expect(get(auctionEscrowed)).toBe(0);
	});
	it('does not let a read started before a mutation overwrite its result', async () => {
		let finish!: (value: Auction[]) => void;
		sales.mockImplementationOnce(() => new Promise<Auction[]>((resolve) => (finish = resolve)));
		const pending = refreshPersonalAuctions('1');
		await vi.waitFor(() => expect(sales).toHaveBeenCalledTimes(1));
		recordOwnAuction({ id: '8', status: 'OPEN', card: { id: '12' } } as Auction);
		finish([]);
		await pending;
		expect(get(activeAuctionByCard).get('12')).toBe('8');
		expect(get(personalAuctions).sales.map((item) => item.id)).toEqual(['8']);
	});
});
