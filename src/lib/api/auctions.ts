import type {
	Auction,
	AuctionBid,
	AuctionCard,
	AuctionPage,
	AuctionUser,
	MyBids
} from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toCardRecord, type WikiForgeCardDto } from './cards';
import { getVariants } from './variants';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

export interface AuctionDto extends Omit<
	Auction,
	'id' | 'seller' | 'card' | 'leader' | 'bids' | 'startsAt' | 'endsAt' | 'closedAt'
> {
	id: number;
	seller: { id: number; name: string };
	card: WikiForgeCardDto & {
		pageId: number;
		packId: number;
		serialNumber?: number;
		maxCopies?: number;
	};
	leader?: { id: number; name: string } | null;
	leaderId?: number;
	startsAt: string;
	endsAt: string;
	closedAt?: string;
	bids?: Array<{
		user?: { id: number; name: string } | null;
		amount: number;
		auto: boolean;
		date: string;
	}>;
}
interface AuctionPageDto {
	nbResults: number;
	page: number;
	results?: AuctionDto[];
	pageSize: number;
	hasNext: boolean;
}
const user = (value?: { id: number; name: string } | null): AuctionUser | null =>
	value ? { id: String(value.id), name: value.name } : null;
export function convertAuction(
	dto: AuctionDto,
	variants: Awaited<ReturnType<typeof getVariants>>
): Auction {
	const card = toCardRecord(dto.card, variants) as AuctionCard;
	Object.assign(card, {
		pageId: dto.card.pageId,
		packId: dto.card.packId,
		serialNumber: dto.card.serialNumber,
		maxCopies: dto.card.maxCopies
	});
	return {
		...dto,
		id: String(dto.id),
		seller: user(dto.seller)!,
		card,
		leader: user(dto.leader),
		startsAt: wikiForgeUtcDate(dto.startsAt).toISOString(),
		endsAt: wikiForgeUtcDate(dto.endsAt).toISOString(),
		...(dto.closedAt ? { closedAt: wikiForgeUtcDate(dto.closedAt).toISOString() } : {}),
		bids: dto.bids?.map((bid): AuctionBid => ({
			...bid,
			user: user(bid.user),
			date: wikiForgeUtcDate(bid.date).toISOString()
		}))
	};
}
export interface AuctionSearch {
	page?: number;
	q?: string;
	pageId?: string;
	variant?: string[];
	sellerId?: string;
	wishlist?: string;
	phase?: string;
	minPrice?: string;
	maxPrice?: string;
	sortBy?: string;
	sortDirection?: string;
	status?: string;
}
export function auctionSearchParams(input: AuctionSearch) {
	const params = new URLSearchParams({ page: String(Math.max(0, input.page ?? 0)) });
	for (const [key, value] of Object.entries(input)) {
		if (key === 'page' || value === undefined || value === '') continue;
		if (Array.isArray(value)) for (const item of value) params.append(key, item);
		else params.set(key, String(value));
	}
	return params.toString();
}
async function auctionPage(path: string, options?: RequestOptions): Promise<AuctionPage> {
	const [result, variants] = await Promise.all([
		apiRequest<AuctionPageDto>(path, { ...options, apiTarget: 'wikiforge' }),
		getVariants(options)
	]);
	return {
		...result,
		results: (result.results ?? []).map((item) => convertAuction(item, variants))
	};
}
export const getAuctions = (search: number | AuctionSearch = 0, options?: RequestOptions) =>
	auctionPage(
		'/auctions?' + auctionSearchParams(typeof search === 'number' ? { page: search } : search),
		options
	);
export const getAuctionFavorites = (page = 0, options?: RequestOptions) =>
	auctionPage('/me/auction-favorites?' + auctionSearchParams({ page }), options);
export const setAuctionFavorite = (id: string, favorite: boolean, options?: RequestOptions) =>
	apiRequest<void>(`/me/auction-favorites/${wikiForgeNumericId(id, 'auction')}`, {
		...options,
		method: favorite ? 'PUT' : 'DELETE'
	});
export interface AuctionFee {
	startPrice: number;
	feePercent: number;
	fee: number;
	alreadyPaid: number;
	due: number;
}
export const getAuctionFee = (startPrice: number, auctionId?: string, options?: RequestOptions) =>
	apiRequest<AuctionFee>(
		`/me/auctions/fee?startPrice=${startPrice}${auctionId ? '&auctionId=' + wikiForgeNumericId(auctionId, 'auction') : ''}`,
		options
	);
export async function getAuction(id: string | number, options?: RequestOptions) {
	const [dto, variants] = await Promise.all([
		apiRequest<AuctionDto>(`/auctions/${wikiForgeNumericId(id, 'enchère')}`, {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return convertAuction(dto, variants);
}
export async function bidAuction(id: string | number, maxAmount: number, options?: RequestOptions) {
	const [dto, variants] = await Promise.all([
		apiRequest<AuctionDto>(`/auctions/${wikiForgeNumericId(id, 'enchère')}/bids`, {
			...options,
			method: 'POST',
			body: { maxAmount },
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return convertAuction(dto, variants);
}
export async function retractAuctionMax(id: string | number, options?: RequestOptions) {
	const [dto, variants] = await Promise.all([
		apiRequest<AuctionDto>(`/auctions/${wikiForgeNumericId(id, 'enchère')}/max`, {
			...options,
			method: 'DELETE',
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return convertAuction(dto, variants);
}
export const watchAuction = (id: string | number, options?: RequestOptions) =>
	apiRequest<void>(`/auctions/${wikiForgeNumericId(id, 'enchère')}/watch`, {
		...options,
		method: 'PUT',
		apiTarget: 'wikiforge'
	});
export const unwatchAuction = (id: string | number, options?: RequestOptions) =>
	apiRequest<void>(`/auctions/${wikiForgeNumericId(id, 'enchère')}/watch`, {
		...options,
		method: 'DELETE',
		apiTarget: 'wikiforge'
	});
export const getMyAuctions = (
	options?: RequestOptions,
	search: Pick<AuctionSearch, 'page' | 'status'> = {}
) => auctionPage('/me/auctions?' + auctionSearchParams(search), options);
export async function getMyBids(
	options?: RequestOptions,
	search: Pick<AuctionSearch, 'page' | 'status'> = {}
): Promise<MyBids> {
	const [data, variants] = await Promise.all([
		apiRequest<Omit<MyBids, 'auctions'> & { auctions?: AuctionDto[] }>(
			'/me/bids?' + auctionSearchParams(search),
			options
		),
		getVariants(options)
	]);
	return {
		...data,
		escrowed: data.escrowed ?? 0,
		auctions: (data.auctions ?? []).map((item) => convertAuction(item, variants))
	};
}
export async function createAuction(
	input: { cardId: number; startPrice: number; startsAt?: string; endsAt: string },
	options?: RequestOptions
) {
	const [dto, variants] = await Promise.all([
		apiRequest<AuctionDto>('/me/auctions', {
			...options,
			method: 'POST',
			body: input,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return convertAuction(dto, variants);
}
export async function updateAuction(
	id: string | number,
	startPrice: number,
	options?: RequestOptions
) {
	const [dto, variants] = await Promise.all([
		apiRequest<AuctionDto>(`/me/auctions/${wikiForgeNumericId(id, 'enchère')}`, {
			...options,
			method: 'PATCH',
			body: { startPrice },
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return convertAuction(dto, variants);
}
export const cancelMyAuction = (id: string | number, options?: RequestOptions) =>
	apiRequest<void>(`/me/auctions/${wikiForgeNumericId(id, 'enchère')}`, {
		...options,
		method: 'DELETE',
		apiTarget: 'wikiforge'
	});
