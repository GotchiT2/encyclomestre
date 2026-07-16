import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import { getOrCreateDirectConversation } from './messages';

describe('direct conversations', () => {
	beforeEach(() => apiRequest.mockReset());

	it('creates or retrieves a direct conversation through the idempotent endpoint', async () => {
		apiRequest.mockResolvedValueOnce({
			id: 'conversation-uuid',
			kind: 'direct',
			title: 'Claire Trade',
			participantIds: ['current-user', 'user-claire'],
			preview: '',
			unreadCount: 0,
			updatedAt: '2026-07-16T12:00:00Z'
		});

		const conversation = await getOrCreateDirectConversation('user-claire');

		expect(apiRequest).toHaveBeenCalledOnce();
		expect(apiRequest).toHaveBeenCalledWith('/api/conversations/direct', {
			method: 'POST',
			body: { participantId: 'user-claire' }
		});
		expect(conversation.id).toBe('conversation-uuid');
	});
});
