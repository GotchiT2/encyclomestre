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
import { cardRarityByCode, type CardRarityCode } from '$lib/domain/cards/rarities';
import { apiRequest, type RequestOptions } from './client';
import { toWikiForgeCollectionCard, type WikiForgeCollectionCardDto } from './collection';
import { wikiForgeNumericId } from './wikiforge-contract';

export interface ShowcaseCardDto {
	id: number;
	pageId: number;
	title: string;
	image?: string;
	nsfw?: boolean;
	rarity: CardRarityCode;
	atk?: number;
	alt?: boolean;
}

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
	id: number;
	name: string;
	imagePageId?: number;
	image?: string;
	joinedAt: string;
	lastConnection?: LastConnection;
	full: boolean;
	nbCards: number;
	nbCardsByRarity?: Partial<Record<CardRarityCode, number>>;
	tags?: Array<{ name: string; color: string }>;
	showcase?: ShowcaseLineDto[];
}

interface SalesDto {
	instantSales?: Array<{ id: number; price: number; card: ShowcaseCardDto }>;
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
}

export type LeaderboardPeriod = 'global' | 'daily' | 'weekly';

function toShowcaseCard(card: ShowcaseCardDto) {
	return toWikiForgeCollectionCard({
		id: card.id,
		pageId: card.pageId,
		title: card.title,
		image: card.image,
		nsfw: card.nsfw,
		rarity: card.rarity,
		atk: card.atk,
		alt: card.alt
	} satisfies WikiForgeCollectionCardDto);
}

function toShowcaseLine(line: ShowcaseLineDto): ShowcaseLine {
	return { title: line.title, cards: (line.cards ?? []).map(toShowcaseCard) };
}

function toShowcase(dto: ShowcaseDto): Showcase {
	return {
		slots: dto.slots,
		maxSlots: dto.maxSlots,
		usedSlots: dto.usedSlots,
		slotPrice: dto.slotPrice,
		lines: (dto.lines ?? []).map(toShowcaseLine)
	};
}

export async function getUserProfile(id: string, options?: RequestOptions): Promise<UserProfile> {
	const dto = await apiRequest<UserProfileDto>(`/users/${wikiForgeNumericId(id, 'utilisateur')}`, {
		...options,
		apiTarget: 'wikiforge'
	});
	return {
		id: String(dto.id),
		name: dto.name,
		imagePageId: dto.imagePageId ?? null,
		image: dto.image ?? null,
		joinedAt: dto.joinedAt,
		lastConnection: dto.lastConnection,
		full: dto.full,
		nbCards: dto.nbCards,
		nbCardsByRarity: Object.fromEntries(
			Object.entries(dto.nbCardsByRarity ?? {}).map(([code, count]) => [
				cardRarityByCode[code as CardRarityCode].name,
				count
			])
		),
		tags: dto.tags ?? [],
		showcase: (dto.showcase ?? []).map(toShowcaseLine)
	};
}

export const getMyShowcase = (options?: RequestOptions) =>
	apiRequest<ShowcaseDto>('/me/showcase', { ...options, apiTarget: 'wikiforge' }).then(toShowcase);

export const replaceMyShowcase = (
	lines: Array<{ title: string; cardIds: string[] }>,
	options?: RequestOptions
) =>
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
	}).then(toShowcase);

export const buyShowcaseSlot = (options?: RequestOptions) =>
	apiRequest<ShowcaseDto>('/me/showcase/slots', {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST'
	}).then(toShowcase);

function toSales(dto: SalesDto): SalesResult {
	return {
		instantSales: (dto.instantSales ?? []).map((sale) => ({
			id: String(sale.id),
			price: sale.price,
			card: toShowcaseCard(sale.card)
		}))
	};
}

export const getUserInstantSales = (userId: string, options?: RequestOptions) =>
	apiRequest<SalesDto>(`/users/${wikiForgeNumericId(userId, 'utilisateur')}/sales`, {
		...options,
		apiTarget: 'wikiforge'
	}).then(toSales);

export const createInstantSale = (cardId: string, price: number, options?: RequestOptions) =>
	apiRequest<SalesDto>('/me/sales', {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST',
		body: { cardId: wikiForgeNumericId(cardId, 'carte'), price }
	}).then(toSales);

export const cancelInstantSale = (saleId: string, options?: RequestOptions) =>
	apiRequest<SalesDto>(`/me/sales/${wikiForgeNumericId(saleId, 'vente')}`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'DELETE'
	}).then(toSales);

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

export const getLeaderboard = (period: LeaderboardPeriod, options?: RequestOptions) =>
	apiRequest<LeaderboardDto>(`/leaderboards/${period}`, {
		...options,
		apiTarget: 'wikiforge'
	}).then((dto): Leaderboard => ({
		top: (dto.top ?? []).map(toLeaderboardEntry),
		around: (dto.around ?? []).map(toLeaderboardEntry)
	}));

export interface CompleteMeUpdate {
	name: string;
	imagePageId: number | null;
	nsfw: boolean;
	safeWords: string[];
	visibility: ProfileVisibility;
}
