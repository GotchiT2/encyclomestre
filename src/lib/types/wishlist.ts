export type WishlistPriority = 'low' | 'medium' | 'high';

export interface WishlistEntry {
	cardId: string;
	priority: WishlistPriority;
	note: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface WishlistAlert {
	id: string;
	cardId: string;
	type: 'auction' | 'friend-owner';
	context: string;
	createdAt: string;
}

export interface WishlistQuery {
	page?: number;
	pageSize?: number;
	query?: string;
	priority?: WishlistPriority;
	hasAlert?: boolean;
}

export interface WishlistRegistry {
	id: string;
	userId: string;
	title: string;
	description: string;
	cardIds: string[];
	createdAt: string;
	updatedAt: string;
}

export interface WishlistRegistrySummary extends WishlistRegistry {
	opportunityCount: number;
}

export interface GuildWishlistShare {
	id: string;
	registryId: string;
	title: string;
	description: string;
	cardCount: number;
	createdAt: string;
}
