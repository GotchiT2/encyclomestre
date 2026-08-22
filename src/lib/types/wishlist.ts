export type WishlistAccess = 'owned' | 'shared' | 'pending';
export type WishlistSort = 'date' | 'name' | 'rarity';

export interface WishlistRegistrySummary {
	id: string;
	title: string;
	description: string;
	cardCount: number;
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
	rarities?: import('./card').CardRarity[];
	sortBy?: WishlistSort;
	sortDirection?: 'ASC' | 'DESC';
}

export interface WishlistFollower {
	id: string;
	name: string;
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
