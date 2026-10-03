import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { get } from 'svelte/store';
import '$lib/i18n';
import { currentSession } from '$lib/auth/session';
import { getNotifications } from '$lib/api';
import { unreadNotifications } from '$lib/notifications/store';
import type { AppNotification } from '$lib/types';
import Feed from '../../routes/notifications/+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (value: string) => value }));
vi.mock('$lib/api', () => ({
	getNotifications: vi.fn(),
	markNotificationRead: vi.fn(),
	markAllNotificationsRead: vi.fn()
}));
afterEach(() => currentSession.set(null));
const item = (id: string, type: string, read = false): AppNotification => ({
	id,
	type,
	read,
	actor: { id, name: 'Joueur ' + id },
	createdAt: new Date().toISOString()
});
describe('collapsible notification feed', () => {
	it('waits for session restoration before reading the account feed', async () => {
		vi.clearAllMocks();
		currentSession.set(null);
		vi.mocked(getNotifications).mockResolvedValue({
			items: [item('late', 'SALE_SOLD')],
			nextCursor: null,
			hasNext: false,
			unread: 1
		});
		render(Feed);
		expect(getNotifications).not.toHaveBeenCalled();
		currentSession.set({
			accessToken: 'mock',
			user: {
				id: 'restored',
				username: 'Demo',
				displayName: 'Demo',
				role: 'user',
				createdAt: '',
				updatedAt: ''
			}
		});
		await expect.element(page.getByText('Joueur late', { exact: true })).toBeVisible();
		expect(getNotifications).toHaveBeenCalledOnce();
	});
	it('merges families across pages, keeps collapse state and uses API global counts', async () => {
		currentSession.set({
			accessToken: 'mock',
			user: {
				id: '1',
				username: 'Demo',
				displayName: 'Demo',
				role: 'user',
				createdAt: '',
				updatedAt: ''
			}
		});
		const first = [item('1', 'TRADE_RECEIVED'), item('2', 'FRIEND_REQUEST', true)];
		const second = [item('3', 'TRADE_ACCEPTED'), item('4', 'FUTURE_EVENT')];
		vi.mocked(getNotifications).mockImplementation(async (query) =>
			query?.unreadOnly
				? { items: first.filter((n) => !n.read), nextCursor: null, hasNext: false, unread: 50 }
				: {
						items: query?.cursor ? second : first,
						nextCursor: query?.cursor ? null : 'page-2',
						hasNext: !query?.cursor,
						unread: 50
					}
		);
		render(Feed);
		const trades = page.getByRole('button', { name: /Échanges.*chargée/ });
		await expect.element(trades).toHaveAttribute('aria-expanded', 'true');
		await trades.click();
		await page.getByRole('button', { name: 'Charger la suite', exact: true }).click();
		await expect.element(trades).toHaveAttribute('aria-expanded', 'false');
		await expect.element(trades).toHaveTextContent(/2 notification/);
		expect(get(unreadNotifications)).toBe(50);
		await trades.click();
		await expect.element(page.getByText('Joueur 3', { exact: true })).toBeVisible();
		await expect.element(page.getByRole('button', { name: /Autres.*chargée/ })).toBeVisible();
		await page.getByRole('button', { name: 'Non lues', exact: true }).click();
		await expect.element(page.getByText('Joueur 2', { exact: true })).not.toBeInTheDocument();
		expect(vi.mocked(getNotifications).mock.calls.at(-1)?.[0]).toMatchObject({
			unreadOnly: true,
			cursor: null
		});
	});
});
