import type { DashboardData } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toWikiForgeCollectionCard, type WikiForgeCollectionCardDto } from './collection';
import { toPackSummaries, type BoostersDto } from './boosters';
import { getVariants } from './variants';

export interface WikiForgeWelcomeResponse {
	boosters: BoostersDto;
	collection: {
		nbCards: number;
		rank?: number;
		recent: WikiForgeCollectionCardDto[];
	};
	pendingTrades: number;
	pendingFriendRequests?: number;
	pendingGuildInvitations?: number;
	unreadNotifications?: number;
	unreadMessages?: number;
	pendingAuction: number;
	money?: number;
}

/** The authenticated home payload supplied by WikiForge. */
export async function getWikiForgeWelcome(options?: RequestOptions): Promise<DashboardData> {
	const [response, variants] = await Promise.all([
		apiRequest<WikiForgeWelcomeResponse>('/welcome', {
			...options,
			apiTarget: 'wikiforge'
		}),
		getVariants(options)
	]);
	return {
		collection: {
			uniqueCards: response.collection.nbCards,
			totalCopies: response.collection.nbCards,
			completionRate: 0
		},
		pendingTrades: response.pendingTrades,
		pendingFriendRequests: response.pendingFriendRequests ?? 0,
		pendingGuildInvitations: response.pendingGuildInvitations ?? 0,
		unreadNotifications: response.unreadNotifications ?? 0,
		unreadMessages: response.unreadMessages ?? 0,
		rank: response.collection.rank,
		money: response.money ?? 0,
		packs: toPackSummaries(response.boosters),
		recentAcquisitions: response.collection.recent.map((card) =>
			toWikiForgeCollectionCard(card, variants)
		)
	};
}
