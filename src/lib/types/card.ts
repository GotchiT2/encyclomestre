export type CardStyle = 'NORMAL' | 'FULL_ART' | 'CHROME' | (string & {});

export interface VariantDefinition {
	id: number;
	name: string;
	color: string;
	styles: CardStyle[];
	renderKey: string;
}

export interface ImageAttribution {
	sourceUrl: string;
	author?: string;
	license?: string;
	licenseUrl?: string;
}

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
	userId?: string | null;
	userName?: string | null;
}

export type CardSearchSort = 'name' | 'relevance';
export type CollectionSort = 'acquiredDate' | 'name';
export type CollectionBooleanFilter = 'all' | 'yes' | 'no';

export interface Card {
	catalogueId?: string;
	baseCardId?: number;
	variantId: number;
	variant: VariantDefinition;
	packId?: number;
	serialNumber?: number;
	maxCopies?: number;
	title: string;
	shortDescription: string;
	longDescription: string;
	imageUrl: string;
	imageAttribution?: ImageAttribution;
	wikipediaUrl: string;
	attack: number;
	defense: number;
	ownedCount: number;
	globalSupply: number;
	friendsWhoOwn: FriendOwnerInfo[];
	wishlistMemberships?: CardWishlistReference[];
	sharedWishlistMemberships?: CardWishlistReference[];
	category?: string;
	qScore?: number;
	acquiredAt?: string;
	createdAt?: string;
	collectionTags?: import('./tag').CollectionTag[];
	collectionTagIds?: string[];
	duplicate?: boolean;
	userProtected?: boolean;
	pendingTradeId?: string | null;
	nsfw?: boolean;
	activeSale?: import('./sales').ActiveSaleSummary | null;
	activeAuctionId?: string | null;
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

export const cardHasStyle = (card: Pick<Card, 'variant'>, style: CardStyle) =>
	card.variant.styles.includes(style);

export const cardNumberLabel = (
	card: Pick<Card, 'serialNumber' | 'maxCopies'>,
	preview = false
) => {
	if (card.serialNumber == null)
		return preview && card.maxCopies != null ? `X/${card.maxCopies}` : '';
	return card.maxCopies == null
		? `#${card.serialNumber}`
		: `${card.serialNumber}/${card.maxCopies}`;
};
