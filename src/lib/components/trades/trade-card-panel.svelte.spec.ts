import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import TradeCardPanel from './trade-card-panel.svelte';
import type { CardRecord } from '$lib/types';

const cards = Array.from({ length: 12 }, (_, index): CardRecord => ({
	id: `copy-${index + 1}`,
	catalogueId: `variant-${index + 1}`,
	title: `Carte ${index + 1}`,
	shortDescription: '',
	longDescription: '',
	rarity: 'Rare',
	rarityInitials: 'R',
	rarityColor: '#5c1dcf',
	viewCount: 0,
	imageUrl: '/card-placeholder.svg',
	wikipediaUrl: '',
	attack: 1,
	defense: 1,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: []
}));

describe('TradeCardPanel', () => {
	it('waits for filters before loading one compact page of cards', async () => {
		const loadCards = vi.fn(async () => ({
			items: cards,
			meta: { page: 1, pageSize: 12, total: 36, totalPages: 3 }
		}));
		render(TradeCardPanel, {
			title: 'Votre proposition',
			scopeKey: 'user-1',
			loadCards
		});

		expect(loadCards).not.toHaveBeenCalled();
		await expect.element(page.getByText(/Utilisez la recherche ou les filtres/)).toBeVisible();
		await page.getByRole('button', { name: 'R Rare', exact: true }).click();
		await page.getByRole('button', { name: 'Afficher les cartes' }).click();

		await vi.waitFor(() =>
			expect(document.querySelectorAll('[data-testid="card-tile"]')).toHaveLength(12)
		);
		expect(loadCards).toHaveBeenCalledOnce();
		expect(loadCards).toHaveBeenCalledWith(
			expect.objectContaining({ rarities: ['Rare'], page: 0, pageSize: 12 })
		);
		const grid = document.querySelector<HTMLElement>('[data-testid="card-tile"]')?.parentElement
			?.parentElement;
		expect(grid?.className).toContain('grid-cols-2');
		expect(grid?.className).toContain('xl:grid-cols-7');
		await expect.element(page.getByText('Page 1 / 3')).toBeVisible();
	});
});
