import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';

const { createSale } = vi.hoisted(() => ({
	createSale: vi.fn(async (input) => ({
		id: 'sale-created',
		sellerId: 'demo-user',
		cardId: 'variant-1',
		userCardId: input.userCardId,
		price: input.price,
		currentPrice: input.price,
		minimumBid: Math.ceil(input.price * 1.1),
		currency: 'CREDITS',
		type: input.type,
		status: 'active'
	}))
}));

vi.mock('$lib/api', () => ({ createSale }));

import SaleListingDialog from './sale-listing-dialog.svelte';
import type { CardRecord } from '$lib/types';

const copy: CardRecord = {
	id: 'owned-copy-1',
	catalogueId: 'variant-1',
	title: 'Carte disponible',
	shortDescription: 'Description.',
	longDescription: 'Description.',
	rarity: 'Rare',
	rarityInitials: 'R',
	rarityColor: '#5c1dcf',
	viewCount: 1,
	imageUrl: '',
	wikipediaUrl: '',
	attack: 10,
	defense: 20,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: [],
	acquiredAt: '2026-07-01T00:00:00Z',
	collectionTags: []
};

describe('SaleListingDialog', () => {
	it('centers the editor and submits the validated auction defaults', async () => {
		const onCreated = vi.fn();
		render(SaleListingDialog, { open: true, copies: [copy], onCreated });

		const dialog = document.querySelector<HTMLElement>('[data-testid="sale-listing-dialog"]')!;
		expect(dialog).toHaveClass('left-1/2', '-translate-x-1/2');
		expect(dialog).toHaveClass('top-1/2', '-translate-y-1/2');

		const price = document.querySelector<HTMLInputElement>('input[type="number"]')!;
		expect(price.value).toBe('10');
		await page.getByRole('button', { name: 'Mettre en vente', exact: true }).click();

		await vi.waitFor(() => expect(createSale).toHaveBeenCalledOnce());
		expect(createSale).toHaveBeenCalledWith({
			userCardId: copy.id,
			type: 'auction',
			price: 10,
			durationMinutes: 60
		});
		expect(onCreated).toHaveBeenCalledOnce();
	});

	it('disables an already listed copy', async () => {
		render(SaleListingDialog, {
			open: true,
			copies: [
				{
					...copy,
					activeSale: {
						id: 'sale-active',
						type: 'auction',
						status: 'active',
						price: 10,
						currentPrice: 10,
						minimumBid: 11,
						endsAt: '2026-07-18T00:00:00Z'
					}
				}
			],
			onCreated: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: /Carte disponible/ })).toBeDisabled();
		await expect
			.element(page.getByRole('button', { name: 'Mettre en vente', exact: true }))
			.toBeDisabled();
	});
});
