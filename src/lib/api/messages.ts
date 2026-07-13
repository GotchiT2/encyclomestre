import { apiRequest, type RequestOptions } from './client';
import type { Conversation, MessageRecord } from '$lib/types';

export const getConversations = (userId: string, options?: RequestOptions) =>
	apiRequest<Conversation[]>(`/messages?userId=${encodeURIComponent(userId)}`, options);

export const getConversationMessages = (id: string, options?: RequestOptions) =>
	apiRequest<MessageRecord[]>(`/messages/${encodeURIComponent(id)}`, options);

export const sendMessage = (
	id: string,
	input: Pick<MessageRecord, 'senderId' | 'content'>,
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
