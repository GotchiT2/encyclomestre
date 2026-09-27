export type WishlistAccess = 'owned' | 'shared' | 'pending';
export type WishlistSort = 'date' | 'name';

export interface WishlistRegistrySummary {
	sharedWithGuild?: boolean;
	id: string;
	title: string;
	description: string;
	cardCount: number | null;
	imagePageId?: string | null;
	imageUrl?: string | null;
	ownerName: string | null;
	invitedAt: string | null;
	access: WishlistAccess;
}

export interface WishlistGroups {
	owned: WishlistRegistrySummary[];
	shared: WishlistRegistrySummary[];
	pending: WishlistRegistrySummary[];
}

export interface WishlistPageEntry {
	card: import('./card').CardRecord;
	addedAt: string;
}

export interface WishlistQuery {
	page?: number;
	query?: string;
	sortBy?: WishlistSort;
	sortDirection?: 'ASC' | 'DESC';
}

export interface WishlistFollower {
	id: string;
	name: string;
	imagePageId?: string | null;
	imageUrl?: string | null;
	accepted: boolean;
}

export interface GuildWishlistShare {
	id: string;
	registryId: string;
	title: string;
	description: string;
	cardCount: number;
	createdAt: string;
}
