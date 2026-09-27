import type { CardRecord } from './card';

export interface DashboardData {
	guild?: { id: number; name: string };
	collection: {
		uniqueCards?: number;
		totalCopies: number;
		completionRate?: number;
	};
	pendingTrades: number;
	pendingAuction?: number;
	pendingFriendRequests?: number;
	pendingGuildInvitations?: number;
	unreadNotifications?: number;
	unreadMessages?: number;
	activeMarketListings?: number;
	rank?: number;
	money: number;
	packs: import('./booster').PackSummary[];
	recentAcquisitions: CardRecord[];
}

export interface GuildSummary {
	id: string;
	name: string;
	description?: string;
	imageUrl?: string | null;
	joinPolicy?: 'PUBLIC' | 'INVITE';
	maxMembers?: number;
	memberCount?: number;
	member?: boolean;
	owned?: boolean;
	permissions?: string[];
}

export interface GuildMember {
	userId: string;
	username: string;
	displayName: string;
	role: string;
	avatarUrl?: string | null;
	permissions?: string[];
	joinedAt?: string;
}

export interface GuildObjective {
	guildId: string;
	title: string;
	progress: number;
	memberCount: number;
}
