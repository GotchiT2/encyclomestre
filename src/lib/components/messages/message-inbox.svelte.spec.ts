import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import type { Conversation, MessageRecord } from '$lib/types';
import { chatStreamEvent } from '$lib/messages/stream';

const api = vi.hoisted(() => ({
	getConversations: vi.fn(),
	getConversationMessages: vi.fn(),
	markConversationRead: vi.fn(),
	sendMessage: vi.fn(),
	setMessageReaction: vi.fn()
}));

vi.mock('$lib/api', () => api);
vi.mock('$lib/api/public-env', () => ({ env: {} }));
vi.mock('$lib/api/moderation', () => ({ getSanctions: vi.fn().mockResolvedValue([]) }));

import MessageInbox from './message-inbox.svelte';

const conversations: Conversation[] = [
	{
		id: 'conversation-1',
		userId: 'user-2',
		kind: 'direct',
		title: 'Alice Martin',
		participantIds: ['user-1', 'user-2'],
		preview: 'Bonjour, cette carte est disponible.',
		unreadCount: 1,
		updatedAt: '2026-07-16T10:30:00Z'
	},
	{
		id: 'conversation-2',
		userId: 'user-3',
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

const longThread: MessageRecord[] = Array.from({ length: 80 }, (_, index) => ({
	id: `message-${index + 1}`,
	conversationId: 'conversation-1',
	senderId: index % 2 ? 'user-1' : 'user-2',
	content: `Message ${index + 1}`,
	createdAt: `2026-07-16T10:${String(index).padStart(2, '0')}:00Z`,
	readAt: null,
	reactions: []
}));

async function expectThreadAtBottom() {
	await vi.waitFor(async () => {
		const element = (await page.getByTestId('message-scroll-area').element()) as HTMLDivElement;
		const metrics = {
			scrollTop: element.scrollTop,
			scrollHeight: element.scrollHeight,
			clientHeight: element.clientHeight
		};
		expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
		expect(metrics.scrollTop + metrics.clientHeight).toBeGreaterThanOrEqual(
			metrics.scrollHeight - 1
		);
	});
}

describe('MessageInbox', () => {
	beforeEach(() => {
		chatStreamEvent.set(null);
		api.getConversations
			.mockReset()
			.mockResolvedValue({ items: conversations, nextCursor: null, hasNext: false });
		api.getConversationMessages
			.mockReset()
			.mockResolvedValue({ items: messages, nextCursor: null, hasNext: false });
		api.markConversationRead.mockReset().mockResolvedValue(undefined);
		api.sendMessage.mockReset();
		api.setMessageReaction.mockReset();
	});

	afterEach(async () => {
		chatStreamEvent.set(null);
		await page.viewport(1280, 900);
	});

	it('loads the mobile conversation only after the user selects it', async () => {
		await page.viewport(390, 844);
		render(MessageInbox, {
			userId: 'user-1',
			loadFriends: vi.fn().mockResolvedValue([{ status: 'accepted', user: { id: 'user-2' } }])
		});

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
		expect(api.getConversationMessages).toHaveBeenCalledWith('user-2');
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
		render(MessageInbox, {
			userId: 'user-1',
			loadFriends: vi.fn().mockResolvedValue([{ status: 'accepted', user: { id: 'user-2' } }])
		});

		await expect
			.element(page.getByTestId('message-thread').getByText('Bonjour, cette carte est disponible.'))
			.toBeVisible();
		expect(api.getConversationMessages).toHaveBeenCalledWith('user-2');

		const listRect = await page.getByTestId('conversation-list').element().getBoundingClientRect();
		const threadRect = await page.getByTestId('message-thread').element().getBoundingClientRect();
		expect(listRect.right).toBeLessThanOrEqual(threadRect.left + 1);
		expect(threadRect.width).toBeGreaterThan(listRect.width);
	});

	it('keeps the internal thread scroll at the bottom when opened and when a message arrives', async () => {
		await page.viewport(1280, 900);
		api.getConversationMessages.mockResolvedValue({
			items: longThread.toReversed(),
			nextCursor: null,
			hasNext: false
		});
		render(MessageInbox, {
			userId: 'user-1',
			loadFriends: vi.fn().mockResolvedValue([{ status: 'accepted', user: { id: 'user-2' } }])
		});

		await expect.element(page.getByText('Message 80')).toBeVisible();
		await expectThreadAtBottom();

		const scrollArea = (await page.getByTestId('message-scroll-area').element()) as HTMLDivElement;
		scrollArea.scrollTop = 0;
		chatStreamEvent.set({
			conversationId: 'conversation-1',
			otherUserId: 'user-2',
			unread: 0,
			message: {
				id: 81,
				conversationId: 1,
				fromUserId: 2,
				type: 'TEXT',
				content: 'Nouveau message',
				creationDate: '2026-07-16T12:00:00Z'
			}
		});

		await expect
			.element(page.getByTestId('message-scroll-area').getByText('Nouveau message'))
			.toBeVisible();
		await expectThreadAtBottom();
	});
});
