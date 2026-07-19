export function auctionPrice(price: number, currentPrice?: number) {
	return currentPrice ?? price;
}

export function minimumAuctionBid(price: number, currentPrice?: number, minimumBid?: number) {
	return minimumBid ?? Math.ceil(auctionPrice(price, currentPrice) * 1.1);
}

export function auctionCountdown(endsAt: string | null | undefined, now = Date.now()) {
	if (!endsAt) return { state: 'none' as const, relative: null, exact: null };
	const end = new Date(endsAt).getTime();
	if (!Number.isFinite(end) || end <= now)
		return { state: 'expired' as const, relative: null, exact: endsAt };
	const seconds = Math.ceil((end - now) / 1_000);
	if (seconds < 60) return { state: 'imminent' as const, relative: `${seconds}s`, exact: endsAt };
	const minutes = Math.ceil(seconds / 60);
	if (minutes < 60) return { state: 'active' as const, relative: `${minutes}min`, exact: endsAt };
	const hours = Math.floor(minutes / 60);
	return { state: 'active' as const, relative: `${hours}h ${minutes % 60}min`, exact: endsAt };
}

export type MarketSort = 'ending' | 'bid_desc' | 'bid_asc';

export function isSaleOpen(sale: SaleListing, now = Date.now()) {
	return (
		(sale.status ?? 'active') === 'active' &&
		sale.type === 'auction' &&
		(!sale.endsAt || new Date(sale.endsAt).getTime() > now)
	);
}

export function salePricePresentation(sale: SaleListing) {
	if (sale.status === 'sold' && sale.buyerId) {
		return { label: 'market.sale_price', amount: auctionPrice(sale.price, sale.currentPrice) };
	}
	if ((sale.status ?? 'active') === 'active' && (sale.bidCount ?? 0) > 0) {
		return { label: 'market.current_bid', amount: auctionPrice(sale.price, sale.currentPrice) };
	}
	return { label: 'market.starting_bid', amount: sale.price };
}

export function sortMarketListings(listings: SaleListing[], sort: MarketSort) {
	return listings.toSorted((left, right) => {
		if (sort === 'ending') {
			const leftEnd = left.endsAt ? new Date(left.endsAt).getTime() : Number.POSITIVE_INFINITY;
			const rightEnd = right.endsAt ? new Date(right.endsAt).getTime() : Number.POSITIVE_INFINITY;
			return leftEnd - rightEnd;
		}
		const difference =
			auctionPrice(left.price, left.currentPrice) - auctionPrice(right.price, right.currentPrice);
		return sort === 'bid_desc' ? -difference : difference;
	});
}
import type { SaleListing } from '$lib/types';
