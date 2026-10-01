import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('./client', () => ({ apiRequest }));

import { getNotifications, markAllNotificationsRead, markNotificationRead } from './notifications';

describe('WikiForge notifications', () => {
	beforeEach(() => apiRequest.mockReset());
	it('loads cursor-paginated notifications and safely parses metadata', async () => {
		apiRequest.mockResolvedValue({
			results: [
				{
					id: 4,
					type: 'UNKNOWN',
					meta: '{invalid',
					read: false,
					creationDate: '2026-08-23T14:31:00'
				}
			],
			nextCursor: 'cursor',
			hasNext: true,
			unread: 3
		});
		await expect(getNotifications({ cursor: 'cursor', unreadOnly: true })).resolves.toMatchObject({
			hasNext: true,
			unread: 3,
			items: [{ id: '4', type: 'UNKNOWN', meta: null }]
		});
		expect(apiRequest).toHaveBeenCalledWith('/notifications?cursor=cursor&unreadOnly=true', {
			apiTarget: 'wikiforge'
		});
	});
	it('keeps a readable notification when its date is missing or invalid', async () => {
		apiRequest.mockResolvedValue({
			results: [
				{ id: 1, type: 'UNKNOWN', read: false },
				{ id: 2, type: 'FRIEND_ACCEPTED', read: true, creationDate: 'invalid-date' }
			]
		});
		await expect(getNotifications()).resolves.toMatchObject({
			items: [
				{ id: '1', createdAt: '' },
				{ id: '2', createdAt: '' }
			]
		});
	});

	it('marks one or all notifications read with the canonical methods', async () => {
		apiRequest.mockResolvedValue(undefined);
		await markNotificationRead('4');
		await markAllNotificationsRead();
		expect(apiRequest).toHaveBeenNthCalledWith(1, '/notifications/4/read', {
			apiTarget: 'wikiforge',
			method: 'PATCH'
		});
		expect(apiRequest).toHaveBeenNthCalledWith(2, '/notifications/read-all', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
	});
});
