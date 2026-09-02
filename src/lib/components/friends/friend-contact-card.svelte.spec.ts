import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import FriendContactCard from './friend-contact-card.svelte';
import type { Friendship } from '$lib/types';

const friendship: Friendship = {
	id: 'friendship-1',
	status: 'accepted',
	createdAt: '',
	lastActiveAt: '',
	user: {
		id: 'friend-1',
		username: 'SoneS9',
		displayName: 'SoneS9',
		email: 'friend@example.test',
		avatarUrl: null,
		bio: null,
		role: 'user',
		preferences: {
			language: 'fr',
			timezone: 'Europe/Paris',
			emailNotifications: true,
			marketingEmails: false
		},
		createdAt: '',
		updatedAt: '',
		lastConnection: 'THIS_WEEK'
	}
};

describe('FriendContactCard', () => {
	it('exposes the shortcuts of an accepted friend', async () => {
		render(FriendContactCard, {
			friendship,
			onTrade: vi.fn(),
			onMessage: vi.fn(),
			onRemove: vi.fn(),
			onBlock: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Échanger' })).toBeEnabled();
		await expect.element(page.getByRole('button', { name: 'Écrire' })).toBeEnabled();
		await expect.element(page.getByText('Ami')).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: 'Dernière connexion cette semaine' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Bloquer' })).toBeEnabled();
	});
});
