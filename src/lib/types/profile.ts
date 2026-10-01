import type { CollectionTag } from './tag';
import type { CardRecord } from './card';

export interface ProfileRegistrySummary {
	ownedCards: number;
	totalCopies: number;
	distinctCards: number;
	publicTags: CollectionTag[];
}

export interface ProfileGallery {
	id: string;
	title: string;
	cardIds: string[];
}
export interface ProfileSettings {
	username: string;
	avatarCardId: string | null;
	accentColor: string;
	bioTags: string[];
	showcases: ProfileGallery[];
	wantedCardIds: string[];
	nsfwEnabled: boolean;
	censoredKeywords: string[];
	visibility: import('./user').ProfileVisibility;
	mutedNotifications: import('./user').MutedNotificationCategory[];
}

export interface ShowcaseLine {
	title: string;
	cards: CardRecord[];
}

export interface Showcase {
	slots: number;
	maxSlots: number;
	usedSlots: number;
	slotPrice: number;
	lines: ShowcaseLine[];
}

export interface UserProfile {
	guild?: { id: number; name: string };
	id: string;
	name: string;
	imagePageId: number | null;
	imageCrop?: import('$lib/types/user').ImageCrop;
	image: string | null;
	joinedAt: string;
	lastConnection?: import('./user').LastConnection;
	full: boolean;
	nbCards: number;
	tags: Array<Pick<CollectionTag, 'name' | 'color'>>;
	showcase: ShowcaseLine[];
}

export interface InstantSale {
	id: string;
	price: number;
	card: CardRecord;
}

export interface SalesResult {
	instantSales: InstantSale[];
	auctions?: import('./auction').Auction[];
}

export interface LeaderboardEntry {
	rank: number;
	id: string;
	name: string;
	imagePageId: number | null;
	imageCrop?: import('$lib/types/user').ImageCrop;
	image: string | null;
	nbCards: number;
}

export interface Leaderboard {
	top: LeaderboardEntry[];
	around: LeaderboardEntry[];
	computedAt?: string | null;
	refreshAt?: string | null;
}
