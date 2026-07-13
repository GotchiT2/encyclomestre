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

export interface MessageRecord {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	createdAt: string;
	readAt: string | null;
	wishlistShare?: WishlistShareWidget;
}
