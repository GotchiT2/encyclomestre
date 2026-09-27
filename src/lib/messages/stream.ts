import { writable } from 'svelte/store';
import { toWikiForgeMessage, type WikiForgeMessageDto } from '$lib/api/messages';
import type { MessageRecord } from '$lib/types';

export interface ChatStreamEvent {
	message: WikiForgeMessageDto;
	conversationId: string;
	otherUserId: string;
	unread: number;
}

function numericId(value: unknown): string | null {
	return typeof value === 'number' && Number.isInteger(value) && value > 0 ? String(value) : null;
}

/** Valide un événement SSE avant de le transmettre à la boîte de réception. */
export function toChatStreamEvent(value: unknown): ChatStreamEvent | null {
	if (!value || typeof value !== 'object') return null;
	const message = Reflect.get(value, 'message');
	const conversationId = numericId(Reflect.get(value, 'conversationId'));
	const otherUserId = numericId(Reflect.get(value, 'otherUserId'));
	const unread = Reflect.get(value, 'unread');
	if (
		!message ||
		typeof message !== 'object' ||
		!conversationId ||
		!otherUserId ||
		typeof unread !== 'number' ||
		!Number.isInteger(unread) ||
		unread < 0 ||
		!numericId(Reflect.get(message, 'id')) ||
		!numericId(Reflect.get(message, 'conversationId')) ||
		!numericId(Reflect.get(message, 'fromUserId')) ||
		typeof Reflect.get(message, 'type') !== 'string' ||
		typeof Reflect.get(message, 'creationDate') !== 'string'
	) {
		return null;
	}
	return {
		message: message as WikiForgeMessageDto,
		conversationId,
		otherUserId,
		unread
	};
}

export function toChatStreamMessage(event: ChatStreamEvent): MessageRecord {
	return toWikiForgeMessage(event.message);
}

export const chatStreamEvent = writable<ChatStreamEvent | null>(null);
