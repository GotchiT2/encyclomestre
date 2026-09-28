import { derived, get, writable } from 'svelte/store';
import type { Auction } from '$lib/types';

export const personalAuctions = writable<{
	userId: string | null;
	sales: Auction[];
	bids: Auction[];
	loaded: boolean;
	error: boolean;
}>({ userId: null, sales: [], bids: [], loaded: false, error: false });
export const activeAuctionByCard = writable<Map<string, string>>(new Map());
export const activeAuctionCardIds = derived(
	activeAuctionByCard,
	(entries) => new Set(entries.keys())
);
export const auctionEscrowed = writable(0);
let pending: Promise<void> | null = null;
let generation = 0;

export function clearPersonalAuctions(userId: string | null = null) {
	generation++;
	pending = null;
	personalAuctions.set({ userId, sales: [], bids: [], loaded: false, error: false });
	activeAuctionByCard.set(new Map());
	auctionEscrowed.set(0);
}
export function recordOwnAuction(auction: Auction) {
	// A mutation response is newer than any personal read already in flight.
	generation++;
	pending = null;
	personalAuctions.update((state) => ({
		...state,
		sales: [auction, ...state.sales.filter((item) => item.id !== auction.id)]
	}));
	activeAuctionByCard.update((entries) => {
		const next = new Map(entries);
		if (auction.status === 'OPEN') next.set(auction.card.id, auction.id);
		else next.delete(auction.card.id);
		return next;
	});
}
export function refreshPersonalAuctions(userId: string): Promise<void> {
	if (get(personalAuctions).userId !== userId) clearPersonalAuctions(userId);
	if (pending) return pending;
	const own = generation;
	pending = import('$lib/api/auctions')
		.then(({ getMyAuctions, getMyBids }) =>
			Promise.all([
				getMyAuctions(undefined, { status: 'OPEN' }),
				getMyBids(undefined, { status: 'OPEN' })
			])
		)
		.then(([sales, bids]) => {
			if (own !== generation) return;
			personalAuctions.set({
				userId,
				sales: sales.results,
				bids: bids.auctions,
				loaded: true,
				error: false
			});
			activeAuctionByCard.set(
				new Map(
					sales.results
						.filter((auction) => auction.status === 'OPEN')
						.map((auction) => [auction.card.id, auction.id])
				)
			);
			auctionEscrowed.set(bids.escrowed);
		})
		.catch((error: unknown) => {
			if (own === generation) personalAuctions.update((state) => ({ ...state, error: true }));
			throw error;
		})
		.finally(() => {
			if (own === generation) pending = null;
		});
	return pending;
}
