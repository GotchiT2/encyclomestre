import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('./client', () => ({ apiRequest }));

import { getConversationMessages, getConversations, sendMessage } from './messages';

describe('WikiForge conversations', () => {
	beforeEach(() => apiRequest.mockReset());

	it('loads cursor-paginated conversations addressed by the other user', async () => {
		apiRequest.mockResolvedValue({
			results: [
				{
					id: 42,
					user: { id: 7, name: 'Claire', image: 'https://images.wikiforge.fr/claire.jpg' },
					lastMessage: {
						id: 9,
						conversationId: 42,
						fromUserId: 7,
						type: 'TEXT',
						content: 'Bonjour',
						creationDate: '2026-08-23T14:31:00'
					},
					unread: 2
				}
			],
			nextCursor: 'opaque',
			hasNext: true
		});

		const page = await getConversations();
		expect(apiRequest).toHaveBeenCalledWith('/conversations', { apiTarget: 'wikiforge' });
		expect(page).toMatchObject({
			hasNext: true,
			nextCursor: 'opaque',
			items: [{ id: '42', userId: '7', unreadCount: 2, updatedAt: '2026-08-23T14:31:00.000Z' }]
		});
	});

	it('reads and sends messages through the interlocutor id', async () => {
		apiRequest.mockResolvedValueOnce({ results: [], nextCursor: null, hasNext: false });
		await getConversationMessages('7', 'cursor');
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/conversations/7/messages?cursor=cursor', {
			apiTarget: 'wikiforge'
		});

		apiRequest.mockResolvedValueOnce({
			id: 10,
			conversationId: 42,
			fromUserId: 1,
			type: 'TEXT',
			content: 'Salut',
			creationDate: '2026-08-23T15:00:00'
		});
		await sendMessage('7', { content: ' Salut ' });
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/conversations/7/messages', {
			apiTarget: 'wikiforge',
			method: 'POST',
			body: { content: 'Salut' }
		});
	});

	it('ignores malformed trade metadata', async () => {
		apiRequest.mockResolvedValue({
			results: [
				{
					id: 11,
					conversationId: 42,
					fromUserId: 7,
					type: 'TRADE',
					meta: '{invalid',
					creationDate: '2026-08-23T15:00:00'
				}
			],
			hasNext: false
		});
		const page = await getConversationMessages('7');
		expect(page.items[0]).toMatchObject({ type: 'trade' });
		expect(page.items[0].tradeEvent).toBeUndefined();
	});
});
