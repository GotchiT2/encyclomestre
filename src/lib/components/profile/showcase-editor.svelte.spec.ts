import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import ShowcaseEditor from './showcase-editor.svelte';
import type { CardRecord } from '$lib/types';

const card: CardRecord = {
	id: '12',
	catalogueId: '42',
	baseCardId: 42,
	title: 'Rose',
	shortDescription: '',
	longDescription: '',
	rarity: 'Super-Rare',
	rarityInitials: 'SR',
	rarityColor: '#b41dcf',
	viewCount: 0,
	imageUrl: '/card-placeholder.svg',
	wikipediaUrl: '',
	attack: 20,
	defense: 0,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: []
};

describe('ShowcaseEditor', () => {
	it('keeps line order and card instance identifiers on save', async () => {
		const onSave = vi.fn();
		render(ShowcaseEditor, {
			showcase: {
				slots: 3,
				maxSlots: 4,
				usedSlots: 1,
				slotPrice: 100,
				lines: [{ title: 'Préférées', cards: [card] }]
			},
			collection: [card],
			money: 500,
			onSave,
			onBuySlot: vi.fn()
		});
		await expect.element(page.getByText('1 / 3 cartes exposées')).toBeVisible();
		await page.getByRole('button', { name: 'Enregistrer' }).click();
		expect(onSave).toHaveBeenCalledWith([{ title: 'Préférées', cardIds: ['12'] }]);
	});

	it('disables slot purchase at the server ceiling', async () => {
		render(ShowcaseEditor, {
			showcase: { slots: 4, maxSlots: 4, usedSlots: 0, slotPrice: 100, lines: [] },
			collection: [],
			money: 500,
			onSave: vi.fn(),
			onBuySlot: vi.fn()
		});
		await expect
			.element(page.getByRole('button', { name: 'Acheter un emplacement · 100 ◈' }))
			.toBeDisabled();
	});

	it('enables saving as soon as a named collection contains a card', async () => {
		render(ShowcaseEditor, {
			showcase: {
				slots: 3,
				maxSlots: 4,
				usedSlots: 1,
				slotPrice: 100,
				lines: [{ title: '', cards: [card] }]
			},
			collection: [card],
			money: 500,
			onSave: vi.fn(),
			onBuySlot: vi.fn()
		});
		await expect.element(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
		await page.getByRole('textbox', { name: 'Nom de la vitrine' }).fill('Collection été');
		await expect.element(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
	});
});
