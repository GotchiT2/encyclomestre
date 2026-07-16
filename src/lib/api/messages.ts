import { apiRequest, type RequestOptions } from './client';
import type { Conversation, MessageRecord } from '$lib/types';

const normalizeMessage = (message: MessageRecord): MessageRecord => ({
	...message,
	reactions: message.reactions ?? []
});

export const getConversations = (_userId?: string, options?: RequestOptions) =>
	apiRequest<Conversation[]>('/api/conversations', options);

export const getOrCreateDirectConversation = (participantId: string, options?: RequestOptions) =>
	apiRequest<Conversation>('/api/conversations/direct', {
		...options,
		method: 'POST',
		body: { participantId }
	});

export const getConversationMessages = async (id: string, options?: RequestOptions) =>
	(
		await apiRequest<MessageRecord[]>(
			`/api/conversations/${encodeURIComponent(id)}/messages`,
			options
		)
	).map(normalizeMessage);

export const sendMessage = (
	id: string,
	input: Pick<MessageRecord, 'content'> & {
		senderId?: string;
		replyToMessageId?: string | null;
	},
	options?: RequestOptions
) =>
	apiRequest<MessageRecord>(`/api/conversations/${encodeURIComponent(id)}/messages`, {
		...options,
		method: 'POST',
		body: { content: input.content, replyToMessageId: input.replyToMessageId ?? null }
	}).then(normalizeMessage);

export const markConversationRead = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/api/conversations/${encodeURIComponent(id)}/read`, {
		...options,
		method: 'PATCH'
	});

export const setMessageReaction = (
	id: string,
	emoji: string,
	active: boolean,
	options?: RequestOptions
) =>
	apiRequest<void>(
		`/api/messages/${encodeURIComponent(id)}/reactions/${encodeURIComponent(emoji)}`,
		{ ...options, method: active ? 'PUT' : 'DELETE' }
	);
