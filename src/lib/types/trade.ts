export type TradeOfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface TradeOffer {
	id: string;
	initiatorId: string;
	recipientId: string;
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
