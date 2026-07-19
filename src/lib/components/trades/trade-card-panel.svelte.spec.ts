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
	it('loads one compact initial page, then applies filters on demand', async () => {
		const loadCards = vi.fn(async () => ({
			items: cards,
			meta: { page: 1, pageSize: 12, total: 36, totalPages: 3 }
		}));
		render(TradeCardPanel, {
			title: 'Votre proposition',
			scopeKey: 'user-1',
			active: true,
			loadCards
		});

		await vi.waitFor(() =>
			expect(document.querySelectorAll('[data-testid="card-tile"]')).toHaveLength(12)
		);
		expect(loadCards).toHaveBeenCalledOnce();
		expect(loadCards).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({ rarities: [], page: 0, pageSize: 12 })
		);
		await page.getByRole('button', { name: 'R Rare', exact: true }).click();
		await page.getByRole('button', { name: 'Afficher les cartes' }).click();

		await vi.waitFor(() =>
			expect(document.querySelectorAll('[data-testid="card-tile"]')).toHaveLength(12)
		);
		expect(loadCards).toHaveBeenCalledTimes(2);
		expect(loadCards).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ rarities: ['Rare'], page: 0, pageSize: 12 })
		);
		const grid = document.querySelector<HTMLElement>('[data-testid="card-tile"]')?.parentElement
			?.parentElement;
		expect(grid?.className).toContain('grid-cols-2');
		expect(grid?.className).toContain('xl:grid-cols-7');
		await expect.element(page.getByText('Page 1 / 3')).toBeVisible();
	});

	it('does not preload an inactive panel', async () => {
		const loadCards = vi.fn();
		render(TradeCardPanel, {
			title: 'Proposition du partenaire',
			scopeKey: 'user-2',
			active: false,
			loadCards
		});

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(loadCards).not.toHaveBeenCalled();
	});
});
