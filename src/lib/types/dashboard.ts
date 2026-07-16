import type { CardRecord } from './card';

export interface DashboardData {
	collection: {
		uniqueCards: number;
		totalCopies: number;
		completionRate: number;
	};
	pendingTrades: number;
	activeMarketListings: number;
	rank: string;
	boosterStatus: {
		availableBoosters: number;
		nextBoosterAvailableAt: string | null;
	};
	recentAcquisitions: CardRecord[];
}

export interface GuildSummary {
	id: string;
	name: string;
	description: string;
}

export interface GuildMember {
	userId: string;
	username: string;
	displayName: string;
	role: string;
}

export interface GuildObjective {
	guildId: string;
	title: string;
	progress: number;
	memberCount: number;
}
