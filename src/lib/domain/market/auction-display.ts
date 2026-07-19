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
