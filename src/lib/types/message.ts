export type ConversationKind = 'direct' | 'guild';

export interface Conversation {
	id: string;
	kind: ConversationKind;
	title: string;
	participantIds: string[];
	preview: string;
	unreadCount: number;
	updatedAt: string;
}

export interface WishlistShareWidget {
	registryId: string;
	title: string;
	description: string;
	cardCount: number;
}

export interface TradeOfferWidget {
	offerId: string;
	offeredCardIds: string[];
	requestedCardIds: string[];
	offeredCredits: number;
	requestedCredits: number;
	status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

export interface MessageReaction {
	emoji: string;
	userIds: string[];
}

export interface MessageRecord {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	createdAt: string;
	readAt: string | null;
	replyToMessageId?: string | null;
	reactions: MessageReaction[];
	wishlistShare?: WishlistShareWidget;
	tradeOffer?: TradeOfferWidget;
}
