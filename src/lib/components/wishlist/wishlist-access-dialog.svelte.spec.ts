import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistAccessDialog from './wishlist-access-dialog.svelte';

describe('WishlistAccessDialog', () => {
	it('accepts only a positive numeric WikiForge user id', async () => {
		const onInvite = vi.fn();
		render(WishlistAccessDialog, { open: true, followers: [], onInvite, onRevoke: vi.fn() });
		const invite = page.getByRole('button', { name: 'Inviter' });
		await expect.element(invite).toBeDisabled();
		await page.getByRole('textbox', { name: 'Identifiant utilisateur WikiForge' }).fill('17');
		await expect.element(invite).toBeEnabled();
		await invite.click();
		expect(onInvite).toHaveBeenCalledWith('17');
	});
});
