export type TradeOfferStatus =
	'pending' | 'countered' | 'accepted' | 'declined' | 'cancelled' | 'expired';

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
	offeredMoney?: number;
	requestedMoney?: number;
	originalOfferedMoney?: number;
	originalRequestedMoney?: number;
	cards?: TradeCardDetail[];
	message?: string;
	status: TradeOfferStatus;
	expiresAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export type TradeCardSide = 'offered' | 'requested';

export interface TradeCardDetail {
	userCardId: string;
	side: TradeCardSide;
	status: 'unchanged' | 'added' | 'removed';
	card: import('./card').CardRecord;
}

export interface CreateTradeOfferInput {
	initiatorId: string;
	recipientId: string;
	offeredCardIds: string[];
	requestedCardIds: string[];
	offeredMoney?: number;
	requestedMoney?: number;
	message?: string;
}

export interface TradeCardSearchQuery {
	query?: string;
	rarities?: import('./card').CardRarity[];
	variant?: import('./card').CardVariant;
	sortBy?: import('./card').CardSearchSort;
	page?: number;
	pageSize?: number;
	cursor?: string;
}
