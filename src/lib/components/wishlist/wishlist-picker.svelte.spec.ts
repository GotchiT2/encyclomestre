import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import WishlistPicker from './wishlist-picker.svelte';
import type { CardRecord } from '$lib/types';

const card: CardRecord = {
	id: '42',
	title: 'Carte distante',
	shortDescription: '',
	longDescription: '',
	rarity: 'Légendaire',
	rarityInitials: 'L',
	rarityColor: '#cf1d1d',
	viewCount: 0,
	imageUrl: '',
	wikipediaUrl: '',
	attack: 10,
	defense: 20,
	ownedCount: 0,
	globalSupply: 0,
	friendsWhoOwn: []
};

describe('WishlistPicker', () => {
	it('loads one API page only after the picker opens', async () => {
		const loadCards = vi.fn().mockResolvedValue({
			items: [card],
			meta: { page: 1, pageSize: 12, total: 30, totalPages: 3 }
		});
		const props = {
			open: false,
			existingCardIds: [],
			loadCards,
			onSelect: vi.fn(),
			title: 'Cartes recherchées'
		};
		const result = render(WishlistPicker, props);

		expect(loadCards).not.toHaveBeenCalled();
		await result.rerender({ ...props, open: true });
		await vi.waitFor(() => expect(loadCards).toHaveBeenCalledOnce());
		await expect.element(page.getByRole('heading', { name: 'Cartes recherchées' })).toBeVisible();
		expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
		expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
		const closeButton = document.querySelector<HTMLElement>('[data-slot="dialog-close"]');
		const closeIcon = closeButton?.querySelector<SVGElement>('svg');
		expect(closeButton).not.toBeNull();
		expect(closeIcon).not.toBeNull();
		const buttonBounds = closeButton!.getBoundingClientRect();
		const iconBounds = closeIcon!.getBoundingClientRect();
		expect(
			Math.abs(
				buttonBounds.left + buttonBounds.width / 2 - (iconBounds.left + iconBounds.width / 2)
			)
		).toBeLessThan(1);
		const pagination = page.getByTestId('card-picker-pagination');
		await expect.element(pagination).toBeVisible();
		expect(pagination.element().parentElement).toHaveAttribute('data-slot', 'dialog-content');
		await page.getByRole('button', { name: 'Masquer les filtres' }).click();
		await expect.element(page.getByPlaceholder('Rechercher une carte')).not.toBeVisible();
		await expect.element(pagination).toBeVisible();
		await page.getByRole('button', { name: 'Afficher les filtres' }).click();
		await expect.element(page.getByPlaceholder('Rechercher une carte')).toBeVisible();
		expect(loadCards).toHaveBeenLastCalledWith(
			expect.objectContaining({
				page: 1,
				pageSize: 12,
				sortBy: 'rarity',
				sortDirection: 'DESC'
			})
		);
		await expect.element(page.getByText('Carte distante')).toBeVisible();
		await page.getByRole('button', { name: 'Carte distante' }).click();
		expect(props.onSelect).toHaveBeenCalledWith(card);
		await expect.element(page.getByRole('heading', { name: 'Cartes recherchées' })).toBeVisible();
	});

	it('can identify a personal collection picker without changing its card workflow', async () => {
		render(WishlistPicker, {
			open: true,
			existingCardIds: [],
			loadCards: vi.fn().mockResolvedValue({
				items: [card],
				meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 }
			}),
			onSelect: vi.fn(),
			title: 'Choisir un avatar',
			catalogueLabel: 'Votre collection'
		});

		await expect.element(page.getByText('Votre collection')).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Choisir un avatar' })).toBeVisible();
	});

	it('debounces catalogue searches through the API', async () => {
		const loadCards = vi.fn().mockResolvedValue({
			items: [],
			meta: { page: 1, pageSize: 12, total: 0, totalPages: 1 }
		});
		render(WishlistPicker, {
			open: true,
			existingCardIds: [],
			loadCards,
			onSelect: vi.fn()
		});
		await vi.waitFor(() => expect(loadCards).toHaveBeenCalledOnce());
		await expect
			.element(page.getByText('Aucune carte ne correspond à cette recherche.'))
			.toBeVisible();
		await expect.element(page.getByText('Le catalogue est indisponible.')).not.toBeInTheDocument();

		await page.getByPlaceholder('Rechercher une carte').fill('Mars');
		expect(loadCards).toHaveBeenCalledOnce();
		await vi.waitFor(
			() =>
				expect(loadCards).toHaveBeenLastCalledWith(
					expect.objectContaining({ query: 'Mars', page: 1 })
				),
			{ timeout: 800 }
		);
		expect(loadCards).toHaveBeenLastCalledWith(
			expect.objectContaining({ sortBy: 'relevance', sortDirection: 'DESC' })
		);
	});

	it('shows the API error only when loading rejects', async () => {
		render(WishlistPicker, {
			open: true,
			existingCardIds: [],
			loadCards: vi.fn().mockRejectedValue(new Error('API unavailable')),
			onSelect: vi.fn()
		});

		await expect.element(page.getByText('Le catalogue est indisponible.')).toBeVisible();
		await expect
			.element(page.getByText('Aucune carte ne correspond à cette recherche.'))
			.not.toBeInTheDocument();
	});
});
