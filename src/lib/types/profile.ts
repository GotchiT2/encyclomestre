import type { CollectionTag } from './tag';

export interface ProfileRegistrySummary {
	ownedCards: number;
	totalCopies: number;
	rareCards: number;
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
}
