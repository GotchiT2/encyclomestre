export type MessageKind = 'text' | 'trade' | 'unknown';

export interface TradeMessageEvent {
	tradeId: string;
	status: string;
}

export interface Conversation {
	id: string;
	userId?: string;
	title: string;
	avatarUrl?: string | null;
	lastConnection?: import('./user').LastConnection;
	preview: string;
	previewType?: MessageKind | null;
	unreadCount: number;
	updatedAt: string;
	/** @deprecated Ancien contrat local, conservé uniquement pour les mocks historiques. */
	kind: 'direct' | 'guild';
	/** @deprecated */
	participantIds: string[];
}

export interface MessageRecord {
	id: string;
	conversationId: string;
	senderId: string;
	type?: MessageKind;
	content: string;
	createdAt: string;
	tradeEvent?: TradeMessageEvent;
	/** @deprecated Fonctionnalités non exposées par WikiForge. */
	readAt: string | null;
	replyToMessageId?: string | null;
	reactions: Array<{ emoji: string; userIds: string[] }>;
	wishlistShare?: { registryId: string; title: string; description: string; cardCount: number };
	tradeOffer?: unknown;
}

export interface CursorPage<T> {
	items: T[];
	nextCursor: string | null;
	hasNext: boolean;
}
