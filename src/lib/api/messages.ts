import { apiRequest, type RequestOptions } from './client';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';
import type { Conversation, CursorPage, MessageRecord, TradeMessageEvent } from '$lib/types';

interface WikiForgeSimpleUserDto {
	id: number;
	name: string;
	image?: string | null;
}

interface WikiForgeMessageDto {
	id: number;
	conversationId: number;
	fromUserId: number;
	type: 'TEXT' | 'TRADE';
	content?: string | null;
	meta?: string | null;
	creationDate: string;
}

interface WikiForgeConversationDto {
	id: number;
	user: WikiForgeSimpleUserDto;
	lastMessage?: WikiForgeMessageDto | null;
	unread?: number;
}

interface WikiForgeCursorResult<T> {
	results?: T[];
	nextCursor?: string | null;
	hasNext?: boolean;
}

function parseTradeEvent(meta?: string | null): TradeMessageEvent | undefined {
	if (!meta) return undefined;
	try {
		const value: unknown = JSON.parse(meta);
		if (!value || typeof value !== 'object') return undefined;
		const tradeId = Reflect.get(value, 'tradeId');
		const status = Reflect.get(value, 'status');
		if (
			(typeof tradeId !== 'number' && typeof tradeId !== 'string') ||
			typeof status !== 'string'
		) {
			return undefined;
		}
		return { tradeId: String(tradeId), status };
	} catch {
		return undefined;
	}
}

export function toWikiForgeMessage(message: WikiForgeMessageDto): MessageRecord {
	return {
		id: String(message.id),
		conversationId: String(message.conversationId),
		senderId: String(message.fromUserId),
		type: message.type === 'TRADE' ? 'trade' : 'text',
		content: message.content ?? '',
		createdAt: wikiForgeUtcDate(message.creationDate).toISOString(),
		readAt: null,
		reactions: [],
		...(message.type === 'TRADE' ? { tradeEvent: parseTradeEvent(message.meta) } : {})
	};
}

function toWikiForgeConversation(conversation: WikiForgeConversationDto): Conversation {
	const lastMessage = conversation.lastMessage;
	return {
		id: String(conversation.id),
		userId: String(conversation.user.id),
		kind: 'direct',
		participantIds: [String(conversation.user.id)],
		title: conversation.user.name,
		avatarUrl: conversation.user.image?.trim() || null,
		preview: lastMessage?.type === 'TRADE' ? '' : (lastMessage?.content ?? ''),
		previewType: lastMessage?.type === 'TRADE' ? 'trade' : lastMessage ? 'text' : null,
		unreadCount: conversation.unread ?? 0,
		updatedAt: lastMessage
			? wikiForgeUtcDate(lastMessage.creationDate).toISOString()
			: new Date(0).toISOString()
	};
}

function cursorPath(path: string, cursor?: string | null): string {
	return cursor ? `${path}?${new URLSearchParams({ cursor })}` : path;
}

export const getConversations = async (
	cursor?: string | null,
	options?: RequestOptions
): Promise<CursorPage<Conversation>> => {
	const response = await apiRequest<WikiForgeCursorResult<WikiForgeConversationDto>>(
		cursorPath('/conversations', cursor),
		{ ...options, apiTarget: 'wikiforge' }
	);
	return {
		items: (response.results ?? []).map(toWikiForgeConversation),
		nextCursor: response.nextCursor ?? null,
		hasNext: response.hasNext ?? false
	};
};

export const getConversationMessages = async (
	userId: string,
	cursor?: string | null,
	options?: RequestOptions
): Promise<CursorPage<MessageRecord>> => {
	const path = `/conversations/${wikiForgeNumericId(userId, 'utilisateur')}/messages`;
	const response = await apiRequest<WikiForgeCursorResult<WikiForgeMessageDto>>(
		cursorPath(path, cursor),
		{ ...options, apiTarget: 'wikiforge' }
	);
	return {
		items: (response.results ?? []).map(toWikiForgeMessage),
		nextCursor: response.nextCursor ?? null,
		hasNext: response.hasNext ?? false
	};
};

export const sendMessage = async (
	userId: string,
	input: { content: string },
	options?: RequestOptions
): Promise<MessageRecord> => {
	const content = input.content.trim();
	if (!content || content.length > 2_000) {
		throw new Error('Le message doit contenir entre 1 et 2 000 caractères.');
	}
	const response = await apiRequest<WikiForgeMessageDto>(
		`/conversations/${wikiForgeNumericId(userId, 'utilisateur')}/messages`,
		{ ...options, apiTarget: 'wikiforge', method: 'POST', body: { content } }
	);
	return toWikiForgeMessage(response);
};
