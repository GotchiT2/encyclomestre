import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import type { Conversation, MessageRecord } from '$lib/types';

const api = vi.hoisted(() => ({
	getConversations: vi.fn(),
	getConversationMessages: vi.fn(),
	markConversationRead: vi.fn(),
	sendMessage: vi.fn(),
	setMessageReaction: vi.fn()
}));

vi.mock('$lib/api', () => api);

import MessageInbox from './message-inbox.svelte';

const conversations: Conversation[] = [
	{
		id: 'conversation-1',
		kind: 'direct',
		title: 'Alice Martin',
		participantIds: ['user-1', 'user-2'],
		preview: 'Bonjour, cette carte est disponible.',
		unreadCount: 1,
		updatedAt: '2026-07-16T10:30:00Z'
	},
	{
		id: 'conversation-2',
		kind: 'direct',
		title: 'Bruno Leroy',
		participantIds: ['user-1', 'user-3'],
		preview: 'Merci pour la proposition.',
		unreadCount: 0,
		updatedAt: '2026-07-15T18:20:00Z'
	}
];

const messages: MessageRecord[] = [
	{
		id: 'message-1',
		conversationId: 'conversation-1',
		senderId: 'user-2',
		content: 'Bonjour, cette carte est disponible.',
		createdAt: '2026-07-16T10:30:00Z',
		readAt: null,
		reactions: []
	}
];

describe('MessageInbox', () => {
	beforeEach(() => {
		api.getConversations.mockReset().mockResolvedValue(conversations);
		api.getConversationMessages.mockReset().mockResolvedValue(messages);
		api.markConversationRead.mockReset().mockResolvedValue(undefined);
		api.sendMessage.mockReset();
		api.setMessageReaction.mockReset();
	});

	afterEach(async () => page.viewport(1280, 900));

	it('loads the mobile conversation only after the user selects it', async () => {
		await page.viewport(390, 844);
		render(MessageInbox, { userId: 'user-1' });

		const alice = page.getByRole('button', { name: /Alice Martin/ });
		await expect.element(alice).toBeVisible();
		expect(api.getConversationMessages).not.toHaveBeenCalled();

		await alice.click();
		await expect.element(page.getByTestId('mobile-message-thread')).toBeVisible();
		await expect
			.element(
				page.getByTestId('mobile-message-thread').getByText('Bonjour, cette carte est disponible.')
			)
			.toBeVisible();
		expect(api.getConversationMessages).toHaveBeenCalledOnce();
		expect(api.getConversationMessages).toHaveBeenCalledWith('conversation-1');
		await expect.element(page.getByRole('button', { name: 'Envoyer' })).toBeVisible();

		const rect = await page.getByTestId('mobile-message-thread').element().getBoundingClientRect();
		expect(rect.left).toBeGreaterThanOrEqual(0);
		expect(rect.right).toBeLessThanOrEqual(390);

		await page.getByRole('button', { name: 'Retour aux conversations' }).click();
		await expect.element(page.getByTestId('mobile-message-thread')).not.toBeInTheDocument();
		await expect.element(alice).toBeVisible();
	});

	it('shows the conversation list and selected thread side by side on desktop', async () => {
		await page.viewport(1280, 900);
		render(MessageInbox, { userId: 'user-1' });

		await expect
			.element(page.getByTestId('message-thread').getByText('Bonjour, cette carte est disponible.'))
			.toBeVisible();
		expect(api.getConversationMessages).toHaveBeenCalledWith('conversation-1');

		const listRect = await page.getByTestId('conversation-list').element().getBoundingClientRect();
		const threadRect = await page.getByTestId('message-thread').element().getBoundingClientRect();
		expect(listRect.right).toBeLessThanOrEqual(threadRect.left + 1);
		expect(threadRect.width).toBeGreaterThan(listRect.width);
	});
});
