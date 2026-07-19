import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import PlayerRelationshipControl from './player-relationship-control.svelte';

describe('PlayerRelationshipControl', () => {
	it.each([
		['friend', 'Déjà ami'],
		['pending', 'Demande en attente'],
		['blocked', 'Joueur bloqué']
	] as const)('renders the %s relationship without an invite action', async (status, label) => {
		render(PlayerRelationshipControl, { status, onInvite: vi.fn() });

		await expect.element(page.getByText(label)).toBeVisible();
		await expect.element(page.getByRole('button')).not.toBeInTheDocument();
	});

	it('offers an invitation when no relationship exists', async () => {
		const onInvite = vi.fn();
		render(PlayerRelationshipControl, { status: 'none', onInvite });

		await page.getByRole('button', { name: 'Envoyer l’invitation' }).click();
		expect(onInvite).toHaveBeenCalledOnce();
	});
});
