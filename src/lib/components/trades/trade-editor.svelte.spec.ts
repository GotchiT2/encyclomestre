import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import { mockCards } from '$lib/api/mocks/cards';
import TradeEditor from './trade-editor.svelte';

vi.mock('$lib/api/variants', async (original) => ({
	...(await original<typeof import('$lib/api/variants')>()),
	getVariants: vi.fn(async () => [])
}));

describe('trade negotiation', () => {
	it('keeps both selections while reviewing and only sends after confirmation', async () => {
		await page.viewport(1440, 950);
		const own = { ...mockCards[0], id: 'own', title: 'Carte donnée' };
		const other = { ...mockCards[1], id: 'other', title: 'Carte reçue' };
		const result = (items: typeof mockCards) => ({
			items,
			meta: { page: 1, pageSize: 12, total: 1, totalPages: 1, hasNext: false }
		});
		const onSubmit = vi.fn();
		render(TradeEditor, {
			open: true,
			currentUserId: '1',
			partner: {
				id: '2',
				username: 'Ariane',
				displayName: 'Ariane',
				role: 'user',
				money: 100,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			},
			initialOwnedCards: [own],
			initialPartnerCards: [other],
			loadOwnedCards: async () => result([own]),
			loadPartnerCards: async () => result([other]),
			onSubmit
		});
		const selector = page.getByTestId('trade-editor-card-selector');
		await selector.getByRole('button', { name: 'Carte donnée', exact: true }).click();
		await selector.getByRole('button', { name: 'Carte reçue', exact: true }).click();
		await page.getByRole('button', { name: 'Vérifier l’offre', exact: true }).click();
		expect(onSubmit).not.toHaveBeenCalled();
		await expect.element(page.getByText('Je donne · 1', { exact: true }).last()).toBeVisible();
		await page.getByRole('button', { name: 'Modifier l’offre', exact: true }).click();
		await expect
			.element(page.getByRole('button', { name: 'Retirer Carte donnée de la sélection' }))
			.toBeVisible();
		await page.getByRole('button', { name: 'Vérifier l’offre', exact: true }).click();
		await page.getByRole('button', { name: 'Envoyer l’offre', exact: true }).click();
		expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
			initiatorId: '1',
			recipientId: '2',
			offeredCardIds: ['own'],
			requestedCardIds: ['other'],
			offeredMoney: 0,
			requestedMoney: 0,
			message: ''
		});
	});
});
