export type TradeOfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface TradeParticipant {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string | null;
}

export interface TradeOffer {
	id: string;
	initiatorId: string;
	recipientId: string;
	initiator: TradeParticipant;
	recipient: TradeParticipant;
	offeredCardIds: string[];
	requestedCardIds: string[];
	cards?: TradeCardDetail[];
	offeredCredits: number;
	requestedCredits: number;
	status: TradeOfferStatus;
	createdAt: string;
	updatedAt: string;
}

export type TradeCardSide = 'offered' | 'requested';

export interface TradeCardDetail {
	userCardId: string;
	side: TradeCardSide;
	card: import('./card').CardRecord;
}

export interface CreateTradeOfferInput {
	initiatorId: string;
	recipientId: string;
	offeredCardIds: string[];
	requestedCardIds: string[];
	offeredCredits?: number;
	requestedCredits?: number;
}

export interface TradeCardSearchQuery {
	query?: string;
	rarities?: import('./card').CardRarity[];
	variant?: import('./card').CardVariant;
	sortBy?: 'rarity' | 'name';
	page?: number;
	pageSize?: number;
}
