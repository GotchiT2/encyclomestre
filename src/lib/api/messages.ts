import { apiRequest, type RequestOptions } from './client';
import type { Conversation, MessageRecord } from '$lib/types';

export const getConversations = (userId: string, options?: RequestOptions) =>
	apiRequest<Conversation[]>(`/messages?userId=${encodeURIComponent(userId)}`, options);

export const getConversationMessages = (id: string, options?: RequestOptions) =>
	apiRequest<MessageRecord[]>(`/messages/${encodeURIComponent(id)}`, options);

export const sendMessage = (
	id: string,
	input: Pick<MessageRecord, 'senderId' | 'content'> & { replyToMessageId?: string | null },
	options?: RequestOptions
) =>
	apiRequest<MessageRecord>(`/messages/${encodeURIComponent(id)}`, {
		...options,
		method: 'POST',
		body: input
	});

export const markConversationRead = (id: string, options?: RequestOptions) =>
	apiRequest<Conversation>(`/messages/${encodeURIComponent(id)}/read`, {
		...options,
		method: 'PATCH'
	});

export const toggleMessageReaction = (
	id: string,
	input: { userId: string; emoji: string },
	options?: RequestOptions
) =>
	apiRequest<MessageRecord>(`/messages/reactions/${encodeURIComponent(id)}`, {
		...options,
		method: 'PATCH',
		body: input
	});
