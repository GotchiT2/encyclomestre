vi.mock('$env/dynamic/public', () => ({ env: {} }));
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
vi.mock('$lib/api/users', () => ({
	searchUsers: vi.fn().mockResolvedValue([
		{
			id: '17',
			username: 'Alice',
			displayName: 'Alice',
			role: 'user',
			createdAt: '',
			updatedAt: ''
		}
	])
}));
import WishlistAccessDialog from './wishlist-access-dialog.svelte';
describe('partage de wishlist', () => {
	it('invite le joueur choisi par son pseudonyme', async () => {
		const onInvite = vi.fn();
		render(WishlistAccessDialog, { open: true, followers: [], onInvite, onRevoke: vi.fn() });
		const invite = page.getByRole('button', { name: 'Inviter' });
		await expect.element(invite).toBeDisabled();
		await page.getByRole('searchbox').fill('Alice');
		await page.getByRole('button', { name: 'Alice', exact: true }).click();
		await expect.element(invite).toBeEnabled();
		await invite.click();
		expect(onInvite).toHaveBeenCalledWith('17');
	});
});
