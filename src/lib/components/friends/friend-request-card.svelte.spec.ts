import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import type { Friendship } from '$lib/types';
import FriendRequestCard from './friend-request-card.svelte';

const friendship = {
	id: 'request-1',
	status: 'received',
	createdAt: '',
	lastActiveAt: '',
	user: { id: 'player-1', username: 'NouveauJoueur', avatarUrl: null }
} as Friendship;

describe('FriendRequestCard', () => {
	it('only exposes accept, decline and block actions', async () => {
		render(FriendRequestCard, {
			friendship,
			onAccept: vi.fn(),
			onDecline: vi.fn(),
			onBlock: vi.fn()
		});

		expect(document.querySelectorAll('button')).toHaveLength(3);
		await expect.element(page.getByRole('button', { name: 'Accepter' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Refuser' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Bloquer' })).toBeVisible();
	});
});
