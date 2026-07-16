import { describe, expect, it } from 'vitest';
import { reactionMenuAlignment, updateMessageReaction } from './reactions';
import type { MessageRecord } from '$lib/types';

const message: MessageRecord = {
	id: 'message-1',
	conversationId: 'conversation-1',
	senderId: 'friend-1',
	content: 'Bonjour',
	createdAt: '',
	readAt: null,
	reactions: []
};

describe('updateMessageReaction', () => {
	it('adds a selected emoji immediately and removes it when toggled off', () => {
		const selected = updateMessageReaction([message], message.id, '👍', 'user-1', true);
		expect(selected[0].reactions).toEqual([{ emoji: '👍', userIds: ['user-1'] }]);

		const removed = updateMessageReaction(selected, message.id, '👍', 'user-1', false);
		expect(removed[0].reactions).toEqual([]);
	});

	it('opens a friend message emoji menu toward the right', () => {
		expect(reactionMenuAlignment('friend-1', 'user-1')).toBe('left-0');
		expect(reactionMenuAlignment('user-1', 'user-1')).toBe('right-0');
	});
});
