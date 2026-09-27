import type {
	Leaderboard,
	LastConnection,
	LeaderboardEntry,
	ProfileVisibility,
	SalesResult,
	Showcase,
	ShowcaseLine,
	UserProfile
} from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toCardRecord, type WikiForgeCardDto } from './cards';
import { getVariants } from './variants';
import type { VariantDefinition } from '$lib/types';
import { wikiForgeUtcDate, wikiForgeNumericId } from './wikiforge-contract';
import { convertAuction, type AuctionDto } from './auctions';

export type ShowcaseCardDto = WikiForgeCardDto;

interface ShowcaseLineDto {
	title: string;
	cards?: ShowcaseCardDto[];
}

interface ShowcaseDto {
	slots: number;
	maxSlots: number;
	usedSlots: number;
	slotPrice: number;
	lines?: ShowcaseLineDto[];
}

interface UserProfileDto {
	guild?: { id: number; name: string };
	id: number;
	name: string;
	imagePageId?: number;
	image?: string;
	joinedAt: string;
	lastConnection?: LastConnection;
	full: boolean;
	nbCards: number;
	tags?: Array<{ name: string; color: string }>;
	showcase?: ShowcaseLineDto[];
}

interface SalesDto {
	instantSales?: Array<{ id: number; price: number; card: ShowcaseCardDto }>;
	auctions?: AuctionDto[];
}

interface LeaderboardEntryDto {
	rank: number;
	id: number;
	name: string;
	imagePageId?: number;
	image?: string;
	nbCards: number;
}

interface LeaderboardDto {
	top?: LeaderboardEntryDto[];
	around?: LeaderboardEntryDto[];
	computedAt?: string;
	refreshAt?: string;
}

export type LeaderboardPeriod = 'global' | 'daily' | 'weekly';

function toShowcaseCard(card: ShowcaseCardDto, variants: VariantDefinition[]) {
	return toCardRecord(card, variants);
}

function toShowcaseLine(line: ShowcaseLineDto, variants: VariantDefinition[]): ShowcaseLine {
	return {
		title: line.title,
		cards: (line.cards ?? []).map((card) => toShowcaseCard(card, variants))
	};
}

function toShowcase(dto: ShowcaseDto, variants: VariantDefinition[]): Showcase {
	return {
		slots: dto.slots,
		maxSlots: dto.maxSlots,
		usedSlots: dto.usedSlots,
		slotPrice: dto.slotPrice,
		lines: (dto.lines ?? []).map((line) => toShowcaseLine(line, variants))
	};
}

export async function getUserProfile(id: string, options?: RequestOptions): Promise<UserProfile> {
	const [dto, variants] = await Promise.all([
		apiRequest<UserProfileDto>(`/users/${wikiForgeNumericId(id, 'utilisateur')}`, {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return {
		id: String(dto.id),
		...('guild' in dto ? { guild: dto.guild as { id: number; name: string } | undefined } : {}),
		name: dto.name,
		imagePageId: dto.imagePageId ?? null,
		image: dto.image ?? null,
		joinedAt: dto.joinedAt,
		lastConnection: dto.lastConnection,
		full: dto.full,
		nbCards: dto.nbCards,
		tags: dto.tags ?? [],
		showcase: (dto.showcase ?? []).map((line) => toShowcaseLine(line, variants))
	};
}

export const getMyShowcase = async (options?: RequestOptions) => {
	const [showcase, variants] = await Promise.all([
		apiRequest<ShowcaseDto>('/me/showcase', { ...options, apiTarget: 'wikiforge' }),
		getVariants(options)
	]);
	return toShowcase(showcase, variants);
};

export const replaceMyShowcase = async (
	lines: Array<{ title: string; cardIds: string[] }>,
	options?: RequestOptions
) => {
	const [showcase, variants] = await Promise.all([
		apiRequest<ShowcaseDto>('/me/showcase', {
			...options,
			apiTarget: 'wikiforge',
			method: 'PUT',
			body: {
				lines: lines.map((line) => ({
					title: line.title.trim(),
					cardIds: line.cardIds.map((id) => wikiForgeNumericId(id, 'carte'))
				}))
			}
		}),
		getVariants(options)
	]);
	return toShowcase(showcase, variants);
};

export const buyShowcaseSlot = async (options?: RequestOptions) => {
	const [showcase, variants] = await Promise.all([
		apiRequest<ShowcaseDto>('/me/showcase/slots', {
			...options,
			apiTarget: 'wikiforge',
			method: 'POST'
		}),
		getVariants(options)
	]);
	return toShowcase(showcase, variants);
};

function toSales(dto: SalesDto, variants: VariantDefinition[]): SalesResult {
	return {
		instantSales: (dto.instantSales ?? []).map((sale) => ({
			id: String(sale.id),
			price: sale.price,
			card: toShowcaseCard(sale.card, variants)
		})),
		auctions: (dto.auctions ?? []).map((auction) => convertAuction(auction, variants))
	};
}

export const getUserInstantSales = async (userId: string, options?: RequestOptions) => {
	const [sales, variants] = await Promise.all([
		apiRequest<SalesDto>(`/users/${wikiForgeNumericId(userId, 'utilisateur')}/sales`, {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return toSales(sales, variants);
};

export const createInstantSale = async (
	cardId: string,
	price: number,
	options?: RequestOptions
) => {
	const [sales, variants] = await Promise.all([
		apiRequest<SalesDto>('/me/sales', {
			...options,
			apiTarget: 'wikiforge',
			method: 'POST',
			body: { cardId: wikiForgeNumericId(cardId, 'carte'), price }
		}),
		getVariants(options)
	]);
	return toSales(sales, variants);
};

export const cancelInstantSale = async (saleId: string, options?: RequestOptions) => {
	const [sales, variants] = await Promise.all([
		apiRequest<SalesDto>(`/me/sales/${wikiForgeNumericId(saleId, 'vente')}`, {
			...options,
			apiTarget: 'wikiforge',
			method: 'DELETE'
		}),
		getVariants(options)
	]);
	return toSales(sales, variants);
};

export const buyInstantSale = (saleId: string, options?: RequestOptions) =>
	apiRequest<void>(`/sales/${wikiForgeNumericId(saleId, 'vente')}/buy`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST'
	});

function toLeaderboardEntry(entry: LeaderboardEntryDto): LeaderboardEntry {
	return {
		rank: entry.rank,
		id: String(entry.id),
		name: entry.name,
		imagePageId: entry.imagePageId ?? null,
		image: entry.image ?? null,
		nbCards: entry.nbCards
	};
}

export const getLeaderboard = (period: LeaderboardPeriod, options?: RequestOptions) => {
	return apiRequest<LeaderboardDto>(`/leaderboards/${period}`, {
		...options,
		apiTarget: 'wikiforge'
	}).then((dto): Leaderboard => ({
		top: (dto.top ?? []).map(toLeaderboardEntry),
		around: (dto.around ?? []).map(toLeaderboardEntry),
		computedAt: dto.computedAt ? wikiForgeUtcDate(dto.computedAt).toISOString() : null,
		refreshAt: dto.refreshAt ? wikiForgeUtcDate(dto.refreshAt).toISOString() : null
	}));
};

export interface CompleteMeUpdate {
	name: string;
	imagePageId: number | null;
	nsfw: boolean;
	safeWords: string[];
	visibility: ProfileVisibility;
}
