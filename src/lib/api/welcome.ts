import type { DashboardData } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toWikiForgeCollectionCard, type WikiForgeCollectionCardDto } from './collection';

export interface WikiForgeWelcomeResponse {
	boostersStatus: {
		available: number;
		max: number;
		nextAvailableAt: string | null;
	};
	collection: {
		nbCards: number;
		rank?: number;
		recent: WikiForgeCollectionCardDto[];
	};
	pendingTrades: number;
	pendingAuction: number;
	money?: number;
}

/** The authenticated home payload supplied by WikiForge. */
export async function getWikiForgeWelcome(options?: RequestOptions): Promise<DashboardData> {
	const response = await apiRequest<WikiForgeWelcomeResponse>('/welcome', {
		...options,
		apiTarget: 'wikiforge'
	});
	return {
		collection: {
			uniqueCards: response.collection.nbCards,
			totalCopies: response.collection.nbCards,
			completionRate: 0
		},
		pendingTrades: response.pendingTrades,
		rank: response.collection.rank,
		money: response.money ?? 0,
		boosterStatus: {
			availableBoosters: response.boostersStatus.available,
			nextBoosterAvailableAt: response.boostersStatus.nextAvailableAt
		},
		recentAcquisitions: response.collection.recent.map(toWikiForgeCollectionCard)
	};
}
