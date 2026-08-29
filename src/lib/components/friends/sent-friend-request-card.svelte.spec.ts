import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import type { Friendship } from '$lib/types';
import SentFriendRequestCard from './sent-friend-request-card.svelte';

const friendship = {
	id: '2',
	status: 'sent',
	createdAt: '2026-08-27T19:03:55.468512',
	lastActiveAt: '',
	user: {
		id: '2',
		username: 'Test2',
		displayName: 'Test2',
		avatarUrl: null
	}
} as Friendship;

describe('SentFriendRequestCard', () => {
	it('shows an outgoing request and exposes its cancellation', async () => {
		const onCancel = vi.fn();
		render(SentFriendRequestCard, { friendship, onCancel });

		await expect.element(page.getByText('@Test2')).toBeVisible();
		await expect.element(page.getByText('Invitation envoyée')).toBeVisible();
		await page.getByRole('button', { name: 'Annuler la demande' }).click();
		expect(onCancel).toHaveBeenCalledOnce();
	});
});
