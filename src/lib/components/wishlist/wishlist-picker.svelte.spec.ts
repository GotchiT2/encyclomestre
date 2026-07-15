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
		const props = { open: false, existingCardIds: [], loadCards, onSelect: vi.fn() };
		const result = render(WishlistPicker, props);

		expect(loadCards).not.toHaveBeenCalled();
		await result.rerender({ ...props, open: true });
		await vi.waitFor(() => expect(loadCards).toHaveBeenCalledOnce());
		expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
		expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
		expect(loadCards).toHaveBeenLastCalledWith(
			expect.objectContaining({
				page: 1,
				pageSize: 12,
				sortBy: 'rarity',
				sortDirection: 'DESC'
			})
		);
		await expect.element(page.getByText('Carte distante')).toBeVisible();
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

		await page.getByPlaceholder('Rechercher une carte').fill('Mars');
		expect(loadCards).toHaveBeenCalledOnce();
		await vi.waitFor(
			() =>
				expect(loadCards).toHaveBeenLastCalledWith(
					expect.objectContaining({ query: 'Mars', page: 1 })
				),
			{ timeout: 800 }
		);
	});
});
