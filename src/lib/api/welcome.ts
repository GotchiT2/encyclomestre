import type { DashboardData } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toWikiForgeCollectionCard, type WikiForgeCollectionCardDto } from './collection';
import { toPackSummary, type PackSummaryDto } from './boosters';
import { getVariants } from './variants';

export interface WikiForgeWelcomeResponse {
	packs: PackSummaryDto[];
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
		rank: response.collection.rank,
		money: response.money ?? 0,
		packs: response.packs.map(toPackSummary),
		recentAcquisitions: response.collection.recent.map((card) =>
			toWikiForgeCollectionCard(card, variants)
		)
	};
}
