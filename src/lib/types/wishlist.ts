export type WishlistPriority = 'low' | 'medium' | 'high';

export interface WishlistEntry {
	cardId: string;
	card: import('./card').CardRecord;
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
	rarities?: import('./card').CardRarity[];
	variant?: import('./card').CardVariant;
	sortBy?: 'name' | 'rarity';
	sortDirection?: 'ASC' | 'DESC';
}

export interface WishlistRegistry {
	id: string;
	userId: string;
	title: string;
	description: string;
	isPublic: boolean;
	cardIds: string[];
	cards: import('./card').CardRecord[];
	createdAt: string;
	updatedAt: string;
}

export interface WishlistRegistrySummary extends WishlistRegistry {
	opportunityCount: number;
}

export interface PublicWishlistCard {
	card: import('./card').CardRecord;
	viewerOwnedCount: number;
	viewerUserCardIds: string[];
}

export interface PublicWishlist {
	id: string;
	userId: string;
	title: string;
	description: string;
	cards: PublicWishlistCard[];
	updatedAt: string;
}

export interface GuildWishlistShare {
	id: string;
	registryId: string;
	title: string;
	description: string;
	cardCount: number;
	createdAt: string;
}
