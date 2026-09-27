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
	results: AuctionDto[];
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
export async function getAuctions(page = 0, options?: RequestOptions): Promise<AuctionPage> {
	const result = await apiRequest<AuctionPageDto>(`/auctions?page=${Math.max(0, page)}`, {
		...options,
		apiTarget: 'wikiforge'
	});
	const variants = await getVariants(options);
	return {
		...result,
		results: (result.results ?? []).map((item) => convertAuction(item, variants))
	};
}
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
export async function getMyAuctions(options?: RequestOptions) {
	const [data, variants] = await Promise.all([
		apiRequest<AuctionDto[]>('/me/auctions', { ...options, apiTarget: 'wikiforge' }),
		getVariants(options)
	]);
	return (data ?? []).map((item) => convertAuction(item, variants));
}
export async function getMyBids(options?: RequestOptions): Promise<MyBids> {
	const [data, variants] = await Promise.all([
		apiRequest<{ escrowed: number; auctions: AuctionDto[] }>('/me/bids', {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return {
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
