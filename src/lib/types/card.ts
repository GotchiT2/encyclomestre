export interface FriendOwnerInfo {
	friendId: string;
	username: string;
	avatarUrl: string;
	ownedCount: number;
}

export interface CardWishlistReference {
	id: string | null;
	title: string | null;
	defaultList: boolean;
}

export type CardRarity =
	'Légendaire' | 'Ultra-Rare' | 'Super-Rare' | 'Rare' | 'Peu Commune' | 'Commune';
export type CardRarityInitials = 'L' | 'UR' | 'SR' | 'R' | 'PC' | 'C';
export type CardVariant = 'all' | 'normal' | 'alternative';
export type CardVariantCode = 'NORMAL' | 'FULL_ART';

export interface Card {
	catalogueId?: string;
	baseCardId?: number;
	variant?: CardVariantCode;
	title: string;
	shortDescription: string;
	longDescription: string;
	rarity: CardRarity;
	rarityInitials: CardRarityInitials;
	rarityColor: string;
	viewCount: number;
	imageUrl: string;
	wikipediaUrl: string;
	attack: number;
	defense: number;
	ownedCount: number;
	globalSupply: number;
	friendsWhoOwn: FriendOwnerInfo[];
	wishlistMemberships?: CardWishlistReference[];
	isFullArt?: boolean;
	category?: string;
	qScore?: number;
	acquiredAt?: string;
	collectionTags?: import('./tag').CollectionTag[];
	activeSale?: import('./sales').ActiveSaleSummary | null;
}

export interface CardRecord extends Card {
	id: string;
}

export interface CardPricePoint {
	date: string;
	price: number;
	currency: string;
	salesVolume?: number;
}

export interface CardPriceHistory {
	cardId: string;
	points: CardPricePoint[];
}
