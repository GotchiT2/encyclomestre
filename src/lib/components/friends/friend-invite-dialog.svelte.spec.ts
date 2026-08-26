import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import FriendInviteDialog from './friend-invite-dialog.svelte';
import type { User } from '$lib/types';

const candidate: User = {
	id: 'user-2',
	username: 'marie',
	displayName: 'Marie',
	role: 'user',
	createdAt: '',
	updatedAt: ''
};

describe('FriendInviteDialog', () => {
	it('searches only after text entry and sends the selected invitation', async () => {
		const loadUsers = vi.fn().mockResolvedValue([candidate]);
		const onInvite = vi.fn();
		render(FriendInviteDialog, {
			open: true,
			loadUsers,
			relationshipFor: () => 'none',
			onInvite
		});

		expect(loadUsers).not.toHaveBeenCalled();
		await page.getByPlaceholder('Rechercher un utilisateur').fill('ma');
		expect(loadUsers).not.toHaveBeenCalled();
		await page.getByPlaceholder('Rechercher un utilisateur').fill('mar');
		await vi.waitFor(() => expect(loadUsers).toHaveBeenCalledOnce(), { timeout: 700 });
		expect(loadUsers).toHaveBeenCalledWith('mar');
		await page.getByRole('button', { name: 'Envoyer l’invitation' }).click();
		expect(onInvite).toHaveBeenCalledWith(candidate);
	});
});
