import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { get } from 'svelte/store';
import '$lib/i18n';
import { goto } from '$app/navigation';
import { currentSession } from '$lib/auth/session';
import { getNotifications, markNotificationRead } from '$lib/api';
import { unreadNotifications } from '$lib/notifications/store';
import type { AuthSession, NotificationsPage } from '$lib/types';
import NotificationBell from './notification-bell.svelte';
import NotificationFeed from '../../../routes/notifications/+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (value: string) => value }));
vi.mock('$lib/api', () => ({
	getNotifications: vi.fn(),
	markNotificationRead: vi.fn(),
	markAllNotificationsRead: vi.fn()
}));

const session: AuthSession = {
	accessToken: 'mock-only',
	user: {
		id: 'notification-test',
		username: 'Alice',
		displayName: 'Alice',
		role: 'user',
		createdAt: '',
		updatedAt: ''
	}
};
const notifications: NotificationsPage = {
	items: [
		{
			id: '1',
			type: 'TRADE_RECEIVED',
			actor: { id: '2', name: 'Bob' },
			extId: '7',
			read: false,
			createdAt: new Date().toISOString()
		}
	],
	nextCursor: null,
	hasNext: false,
	unread: 3
};

beforeEach(() => {
	vi.clearAllMocks();
	currentSession.set(session);
	unreadNotifications.set(3);
	vi.mocked(getNotifications).mockResolvedValue(notifications);
});
afterEach(() => currentSession.set(null));

describe('notification count during concurrent updates', () => {
	for (const source of ['bell', 'feed']) {
		it(`${source} navigates immediately and rereads the server count after a read event`, async () => {
			const read = Promise.withResolvers<void>();
			vi.mocked(markNotificationRead).mockReturnValue(read.promise);
			if (source === 'bell') {
				render(NotificationBell);
				await page.getByTestId('notification-trigger').click();
			} else render(NotificationFeed);
			await page.getByText('Bob', { exact: true }).click();
			expect(goto).toHaveBeenCalledWith('/trades?trade=7');
			expect(markNotificationRead).toHaveBeenCalledExactlyOnceWith('1');
			// The stream may publish the new count before PATCH resolves.
			unreadNotifications.set(2);
			vi.mocked(getNotifications).mockResolvedValue({
				...notifications,
				unread: 2,
				items: notifications.items.map((item) => ({ ...item, read: true }))
			});
			read.resolve();
			await expect.poll(() => vi.mocked(getNotifications).mock.calls.length).toBe(2);
			await expect.poll(() => get(unreadNotifications)).toBe(2);
		});
	}
});
