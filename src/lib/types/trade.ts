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
	offeredCredits: number;
	requestedCredits: number;
	status: TradeOfferStatus;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTradeOfferInput {
	initiatorId: string;
	recipientId: string;
	offeredCardIds: string[];
	requestedCardIds: string[];
	offeredCredits?: number;
	requestedCredits?: number;
}
