import type { AuctionDto } from '../auctions';
import { creationFee, validAmount, validAuctionPeriod } from '$lib/auctions/presentation';

/** In-memory only: mirrors transport shapes including omitted empty lists. */
export function createAuctionMocks(cards: AuctionDto['card'][]) {
	const me = { id: 1, name: 'Administrateur' };
	const seller = { id: 2, name: 'Collectionneur' };
	const date = (offset: number) => new Date(Date.now() + offset).toISOString();
	const base = (id: number, patch: Partial<AuctionDto> = {}): AuctionDto => ({
		id,
		seller,
		card: { ...cards[id % cards.length], id: id + 5000 },
		status: 'OPEN',
		startPrice: 100,
		price: 140,
		minBid: 150,
		nbBids: 1,
		leading: false,
		leader: seller,
		startsAt: date(-3_600_000),
		endsAt: date(3_600_000),
		nbExtensions: 0,
		bids: [{ user: seller, amount: 140, auto: false, date: date(-60_000) }],
		...patch
	});
	const records: AuctionDto[] = [
		base(70),
		base(71, {
			seller: me,
			card: { ...cards[0], id: 1 },
			price: undefined,
			leader: undefined,
			nbBids: 0,
			bids: [],
			minBid: 100
		}),
		base(72, {
			seller: me,
			startsAt: date(3_600_000),
			endsAt: date(7_200_000),
			price: undefined,
			leader: undefined,
			nbBids: 0,
			bids: [],
			minBid: 100
		}),
		base(73, { leading: true, leader: me, myMax: 500 }),
		base(74, { bids: [{ user: me, amount: 120, auto: false, date: date(-120_000) }] }),
		base(75, {
			status: 'SOLD',
			leading: true,
			leader: me,
			closedAt: date(-3_600_000),
			endsAt: date(-3_600_000)
		}),
		base(76, { status: 'SOLD', seller: me, closedAt: date(-3_600_000), endsAt: date(-3_600_000) }),
		base(77, {
			status: 'UNSOLD',
			seller: me,
			price: undefined,
			leader: undefined,
			nbBids: 0,
			bids: [],
			closedAt: date(-3_600_000)
		}),
		base(78, { status: 'CANCELLED', seller: me, closedAt: date(-3_600_000) }),
		base(79, { endsAt: date(-1000), leading: true, leader: me }),
		base(80, {
			status: 'SOLD',
			leader: null,
			card: { ...cards[0], id: 5080, image: undefined },
			bids: [{ user: me, amount: 100, auto: false, date: date(-120_000) }]
		}),
		...Array.from({ length: 48 }, (_, index) =>
			base(index + 100, { endsAt: date(7_200_000 + index * 60_000) })
		)
	];
	let nextId = 1000;
	const reportIds = new Set<number>();
	const response = (body?: unknown, status = 200) =>
		body === undefined ? new Response(null, { status }) : Response.json(body, { status });
	const fail = (status: number, code: string) => response({ error: code }, status);
	const transport = (item: AuctionDto, detail = false) => ({
		...item,
		bids: detail && item.bids?.length ? item.bids : undefined,
		myMax: item.leading && item.status === 'OPEN' ? item.myMax : undefined
	});
	const open = (item: AuctionDto) => item.status === 'OPEN' && Date.now() < Date.parse(item.endsAt);
	return {
		records,
		handle(
			path: string,
			method: string,
			payload: unknown,
			params: URLSearchParams
		): Response | undefined {
			const input = (payload ?? {}) as Record<string, unknown>;
			const relevant = /^\/(?:me\/)?(?:auctions|bids|reports)(?:\/|$)/.test(path);
			if (relevant && typeof window !== 'undefined')
				window.dispatchEvent(
					new CustomEvent('wikiforge:mock-auction-request', { detail: { path, method } })
				);
			const scenario =
				relevant && typeof sessionStorage !== 'undefined'
					? sessionStorage.getItem('wikiforge-auction-scenario')
					: null;
			if (scenario === 'read-error' && method === 'GET' && /^\/auctions\/\d+$/.test(path))
				return fail(504, 'TIMEOUT');
			if (scenario === 'conflict' && ['POST', 'PATCH'].includes(method))
				return fail(409, path === '/reports' ? 'REPORT_CONFLICT' : 'AUCTION_CONFLICT');
			if (scenario === 'sanctioned' && ['POST', 'PATCH'].includes(method))
				return fail(403, 'SANCTIONED');
			if (scenario === 'empty' && path === '/auctions' && method === 'GET')
				return response({ nbResults: 0, page: 0 });
			if (path === '/auctions' && method === 'GET') {
				const page = Math.max(0, Number(params.get('page')) || 0);
				const active = records
					.filter(open)
					.sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt));
				return response({
					nbResults: active.length,
					page,
					results: active.slice(page * 48, page * 48 + 48).map((item) => transport(item))
				});
			}
			if (path === '/me/auctions' && method === 'GET')
				return response(
					records.filter((item) => item.seller.id === 1).map((item) => transport(item))
				);
			if (path === '/me/bids' && method === 'GET') {
				const participated = records.filter(
					(item) => item.leading || item.bids?.some((bid) => bid.user?.id === 1)
				);
				return response({
					escrowed: participated
						.filter((item) => item.status === 'OPEN' && item.leading)
						.reduce((sum, item) => sum + (item.myMax ?? item.price ?? 0), 0),
					...(participated.length ? { auctions: participated.map((item) => transport(item)) } : {})
				});
			}
			if (path === '/me/auctions' && method === 'POST') {
				const card = cards.find((item) => item.id === Number(input.cardId));
				const price = Number(input.startPrice);
				const start = input.startsAt
					? Date.parse(
							String(input.startsAt) + (/Z$|[+-]\d\d:\d\d$/.test(String(input.startsAt)) ? '' : 'Z')
						)
					: Date.now();
				const end = Date.parse(
					String(input.endsAt) + (/Z$|[+-]\d\d:\d\d$/.test(String(input.endsAt)) ? '' : 'Z')
				);
				if (
					!card ||
					!validAmount(price) ||
					!validAuctionPeriod(start, end, Date.now(), Boolean(input.startsAt))
				)
					return fail(400, 'INVALID_PARAMETER');
				if (
					records.filter((item) => item.seller.id === 1 && item.status === 'OPEN').length >= 3 ||
					records.some((item) => item.card.id === card.id && item.status === 'OPEN')
				)
					return fail(409, 'AUCTION_CONFLICT');
				if (creationFee(price) > 100_000) return fail(409, 'NOT_ENOUGH_MONEY');
				const item = base(nextId++, {
					seller: me,
					card,
					startPrice: price,
					minBid: price,
					nbBids: 0,
					bids: [],
					price: undefined,
					leader: undefined,
					startsAt: new Date(start).toISOString(),
					endsAt: new Date(end).toISOString()
				});
				records.unshift(item);
				return response(transport(item));
			}
			const match = /^\/(me\/)?auctions\/(\d+)(?:\/(bids|max|watch))?$/.exec(path);
			if (match) {
				const own = Boolean(match[1]);
				const item = records.find((entry) => entry.id === Number(match[2]));
				const action = match[3];
				if (action === 'watch' && method === 'DELETE') return response(undefined, 204);
				if (!item || (own && item.seller.id !== 1)) return fail(404, 'NOT_FOUND');
				if (method === 'GET') return response(transport(item, true));
				if (!open(item)) return fail(409, 'AUCTION_CONFLICT');
				if (action === 'watch' && method === 'PUT')
					return Date.now() < Date.parse(item.startsAt)
						? fail(409, 'AUCTION_CONFLICT')
						: response(undefined, 204);
				if (own && (method === 'PATCH' || method === 'DELETE')) {
					if (item.nbBids) return fail(409, 'AUCTION_CONFLICT');
					if (method === 'DELETE') {
						item.status = 'CANCELLED';
						item.closedAt = date(0);
						return response(undefined, 204);
					}
					const price = Number(input.startPrice);
					if (!validAmount(price)) return fail(400, 'INVALID_PARAMETER');
					item.startPrice = item.minBid = price;
					return response(transport(item));
				}
				if (action === 'max' && method === 'DELETE') {
					if (!item.leading || Date.now() < Date.parse(item.startsAt))
						return fail(409, 'AUCTION_CONFLICT');
					item.myMax = item.price ?? item.startPrice;
					return response(transport(item, true));
				}
				if (action === 'bids' && method === 'POST') {
					const maximum = Number(input.maxAmount);
					if (!validAmount(maximum)) return fail(400, 'INVALID_PARAMETER');
					if (
						item.seller.id === 1 ||
						Date.now() < Date.parse(item.startsAt) ||
						maximum < item.minBid ||
						(item.leading && maximum <= (item.myMax ?? 0))
					)
						return fail(409, 'AUCTION_CONFLICT');
					if (maximum > 100_000) return fail(409, 'NOT_ENOUGH_MONEY');
					if (!item.leading) {
						item.price = item.minBid;
						item.minBid += 10;
						item.nbBids++;
						item.bids = [
							{ user: me, amount: item.price, auto: false, date: date(0) },
							...(item.bids ?? [])
						];
					}
					item.leading = true;
					item.leader = me;
					item.myMax = maximum;
					return response(transport(item, true));
				}
			}
			if (path === '/reports' && method === 'POST') {
				if (input.type !== 'PAGE' || !cards.some((card) => card.pageId === Number(input.id)))
					return fail(404, 'NOT_FOUND');
				if (String(input.comment ?? '').length > 1000 || input.reason !== 'INAPPROPRIATE')
					return fail(400, 'INVALID_PARAMETER');
				if (reportIds.size >= 10 && !reportIds.has(Number(input.id)))
					return fail(409, 'REPORT_CONFLICT');
				reportIds.add(Number(input.id));
				return response(undefined, 204);
			}
			return undefined;
		}
	};
}
