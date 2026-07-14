export interface FriendOwnerInfo {
	friendId: string;
	username: string;
	avatarUrl: string;
	ownedCount: number;
}

export type CardRarity =
	'Légendaire' | 'Ultra-Rare' | 'Super-Rare' | 'Rare' | 'Peu Commune' | 'Commune';

export interface Card {
	title: string;
	shortDescription: string;
	longDescription: string;
	rarity: CardRarity;
	rarityInitials: 'L' | 'UR' | 'SR' | 'R' | 'PC' | 'C';
	rarityColor: string;
	viewCount: number;
	imageUrl: string;
	wikipediaUrl: string;
	attack: number;
	defense: number;
	ownedCount: number;
	globalSupply: number;
	friendsWhoOwn: FriendOwnerInfo[];
	isFullArt?: boolean;
	category?: string;
	qScore?: number;
	acquiredAt?: string;
	collectionTags?: import('./tag').CollectionTag[];
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
