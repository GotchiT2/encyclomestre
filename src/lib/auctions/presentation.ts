import type { Auction } from '$lib/types';

export type AuctionPhase =
	'upcoming' | 'open' | 'settling' | 'sold' | 'unsold' | 'cancelled' | 'unknown';
export function auctionPhase(auction: Auction, now = Date.now()): AuctionPhase {
	if (auction.status !== 'OPEN') {
		return (
			({ SOLD: 'sold', UNSOLD: 'unsold', CANCELLED: 'cancelled' } as const)[
				auction.status as 'SOLD'
			] ?? 'unknown'
		);
	}
	if (now < Date.parse(auction.startsAt)) return 'upcoming';
	return now < Date.parse(auction.endsAt) ? 'open' : 'settling';
}
export const canEditAuction = (auction: Auction, now = Date.now()) =>
	auction.status === 'OPEN' && auction.nbBids === 0 && now < Date.parse(auction.endsAt);
export const creationFee = (price: number) => (price <= 10 ? 0 : Math.ceil(price / 100));
export const validAmount = (value: number) =>
	Number.isSafeInteger(value) && value > 0 && value <= 1_000_000_000_000;
export function validAuctionPeriod(start: number, end: number, now = Date.now(), scheduled = true) {
	return (
		Number.isFinite(start) &&
		Number.isFinite(end) &&
		(!scheduled || (start >= now && start <= now + 86_400_000)) &&
		end - start >= 600_000 &&
		end - start <= 86_400_000
	);
}
export const auctionTabs = ['explore', 'sales', 'bids', 'history'] as const;
export type AuctionTab = (typeof auctionTabs)[number];
export function marketQuery(params: URLSearchParams) {
	const tab = params.get('tab') as AuctionTab;
	const rawPage = Number(params.get('page'));
	return {
		tab: auctionTabs.includes(tab) ? tab : ('explore' as AuctionTab),
		page: Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0,
		q: params.get('q') ?? '',
		variant: params.get('variant') ?? '',
		seller: params.get('seller') ?? '',
		min: params.get('min') ?? '',
		max: params.get('max') ?? '',
		phase: params.get('phase') ?? '',
		history: params.get('history') ?? ''
	};
}
export type MarketQuery = ReturnType<typeof marketQuery>;
const fold = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLocaleLowerCase('fr');
export function filterAuctions(items: Auction[], query: MarketQuery, now = Date.now()) {
	return items.filter((item) => {
		const price = item.price ?? item.startPrice;
		return (
			(!query.q || fold(item.card.title).includes(fold(query.q))) &&
			(!query.seller || fold(item.seller.name).includes(fold(query.seller))) &&
			(!query.variant || String(item.card.variantId) === query.variant) &&
			(!query.min || price >= Number(query.min)) &&
			(!query.max || price <= Number(query.max)) &&
			(!query.phase || auctionPhase(item, now) === query.phase)
		);
	});
}
export function historyKind(auction: Auction, userId: string) {
	if (auction.status === 'OPEN') return null;
	if (auction.status === 'CANCELLED') return 'cancelled';
	if (auction.seller.id === userId)
		return auction.status === 'SOLD' ? 'sold' : auction.status === 'UNSOLD' ? 'unsold' : 'unknown';
	if (auction.status === 'SOLD')
		return auction.leading || auction.leader?.id === userId
			? 'won'
			: auction.leader
				? 'lost'
				: 'unknown';
	return 'unknown';
}
export function marketBackTarget(raw: string | null) {
	return raw && /^\/(?:market|collection|boosters|profile|users\/\d+)(?:\?[^#]*)?$/.test(raw)
		? raw
		: '/market';
}
