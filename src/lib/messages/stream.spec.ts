import { describe, expect, it } from 'vitest';
import { toChatStreamEvent } from './stream';

describe('chat stream event', () => {
	it('accepts a valid WikiForge chat.message payload', () => {
		expect(
			toChatStreamEvent({
				message: {
					id: 18,
					conversationId: 1,
					fromUserId: 1,
					type: 'TEXT',
					content: 'bonjour',
					creationDate: '2026-09-02T16:57:00.499553'
				},
				conversationId: 1,
				otherUserId: 1,
				unread: 1
			})
		).toMatchObject({ conversationId: '1', otherUserId: '1', unread: 1 });
	});

	it('rejects incomplete or malformed payloads', () => {
		expect(toChatStreamEvent({ conversationId: 1, otherUserId: 1, unread: 1 })).toBeNull();
		expect(
			toChatStreamEvent({ message: {}, conversationId: 1, otherUserId: 1, unread: -1 })
		).toBeNull();
	});
});
