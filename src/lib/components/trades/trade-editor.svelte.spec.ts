import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import TradeEditor from './trade-editor.svelte';
import type { CardRecord, PaginatedResponse, User } from '$lib/types';

const partner: User = {
	id: '2',
	username: 'partenaire',
	displayName: 'Partenaire',
	role: 'user',
	createdAt: '',
	updatedAt: ''
};

const card: CardRecord = {
	id: 'card-1',
	title: 'Carte proposée',
	shortDescription: '',
	longDescription: '',
	rarity: 'Commune',
	rarityInitials: 'C',
	rarityColor: '#d3e4f8',
	viewCount: 0,
	imageUrl: '/card-placeholder.svg',
	wikipediaUrl: '',
	attack: 0,
	defense: 0,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: []
};

const loadCards = async (): Promise<PaginatedResponse<CardRecord>> => ({
	items: [card],
	meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 }
});

describe('TradeEditor', () => {
	afterEach(async () => page.viewport(1280, 900));

	it('keeps the compact exchange workspace and its actions visible on mobile', async () => {
		await page.viewport(390, 844);
		render(TradeEditor, {
			open: true,
			currentUserId: '1',
			availableMoney: 75,
			partner,
			initialOwnedCards: [card],
			loadOwnedCards: loadCards,
			loadPartnerCards: loadCards,
			draft: { offeredCardIds: ['card-1'] },
			onSubmit: vi.fn()
		});

		await expect
			.element(page.getByText('Moi : 1 carte(s) ↔ Partenaire : 0 carte(s)'))
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Mes cartes' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Cartes de Partenaire' })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: 'Ajouter des pièces et un message · 0 / 0' }))
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Envoyer l’offre' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Annuler' })).toBeVisible();
		await expect
			.element(page.getByRole('spinbutton', { name: 'Argent proposé' }))
			.not.toBeInTheDocument();
		expect(document.querySelectorAll('[data-slot="sheet-content"]')).toHaveLength(0);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
	});

	it('switches card sides and expands inline terms without losing the draft', async () => {
		await page.viewport(390, 844);
		const loadOwnedCards = vi.fn(loadCards);
		const loadPartnerCards = vi.fn(loadCards);
		render(TradeEditor, {
			open: true,
			currentUserId: '1',
			availableMoney: 75,
			partner,
			initialOwnedCards: [card],
			loadOwnedCards,
			loadPartnerCards,
			draft: {
				offeredCardIds: ['card-1'],
				offeredMoney: 10,
				requestedMoney: 2,
				message: 'Bonjour'
			},
			onSubmit: vi.fn()
		});

		await page.getByRole('button', { name: 'Ajouter des pièces et un message · 10 / 2' }).click();
		await expect.element(page.getByRole('spinbutton', { name: 'Argent proposé' })).toHaveValue(10);
		await expect.element(page.getByRole('spinbutton', { name: 'Argent demandé' })).toHaveValue(2);
		await expect
			.element(page.getByRole('textbox', { name: 'Message facultatif' }))
			.toHaveValue('Bonjour');

		await page.getByRole('button', { name: 'Cartes de Partenaire' }).click();
		await vi.waitFor(() => expect(loadPartnerCards).toHaveBeenCalledOnce());
		await page.getByRole('button', { name: 'Mes cartes' }).click();
		await vi.waitFor(() => expect(loadOwnedCards).toHaveBeenCalledOnce());
		await expect
			.element(page.getByText('Moi : 1 carte(s) ↔ Partenaire : 0 carte(s)'))
			.toBeVisible();
		await expect
			.element(page.getByRole('textbox', { name: 'Message facultatif' }))
			.toHaveValue('Bonjour');
	});
});
