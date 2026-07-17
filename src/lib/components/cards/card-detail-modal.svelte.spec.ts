import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';

vi.mock('$lib/api', () => ({
	applyWikiForgeTag: vi.fn(),
	removeWikiForgeTag: vi.fn(),
	createWikiForgeTag: vi.fn(),
	updateWikiForgeTag: vi.fn(),
	deleteWikiForgeTag: vi.fn(),
	getVariantCopies: vi.fn(async () => []),
	createSale: vi.fn(
		async (input: { userCardId: string; type: 'auction' | 'direct'; price: number }) => ({
			id: 'sale-created',
			sellerId: 'demo-user',
			cardId: 'card-1',
			userCardId: input.userCardId,
			price: input.price,
			currentPrice: input.price,
			minimumBid: Math.ceil(input.price * 1.1),
			currency: 'CREDITS',
			type: input.type,
			status: 'active'
		})
	),
	getCardPriceHistory: vi.fn(async (cardId: string) => ({
		cardId,
		points: [
			{ date: '2026-07-01', price: 120, currency: 'WF' },
			{ date: '2026-07-02', price: 180, currency: 'WF' }
		]
	})),
	getMarketListings: vi.fn(async () => [])
}));

import CardDetailModal from './card-detail-modal.svelte';
import type { CardRecord } from '$lib/types';

const card: CardRecord = {
	id: 'card-1',
	title: 'Carte de test',
	shortDescription: 'Description courte.',
	longDescription: 'Description complète.',
	rarity: 'Rare',
	rarityInitials: 'R',
	rarityColor: '#5c1dcf',
	viewCount: 10,
	imageUrl: '',
	wikipediaUrl: 'https://fr.wikipedia.org',
	attack: 100,
	defense: 200,
	ownedCount: 0,
	globalSupply: 10,
	friendsWhoOwn: []
};

describe('CardDetailModal', () => {
	afterEach(async () => page.viewport(1280, 720));

	it('uses its content height without an internal desktop scrollbar', async () => {
		await page.viewport(1280, 720);
		render(CardDetailModal, {
			card,
			onToggleWishlist: vi.fn(),
			onClose: vi.fn()
		});

		await expect.element(page.getByTestId('card-detail-modal')).toHaveClass(/sm:h-auto/);
		await expect.element(page.getByTestId('card-detail-modal')).toHaveClass(/sm:bottom-auto/);
		await expect.element(page.getByTestId('card-detail-modal')).not.toHaveClass(/lg:h-/);
		await expect
			.element(page.getByTestId('card-detail-tab-panel'))
			.not.toHaveClass(/overflow-y-auto/);
		expect(
			document
				.querySelector<HTMLElement>('.card-detail-preview .wikiforge-card-size')!
				.getBoundingClientRect().width
		).toBeGreaterThanOrEqual(330);
		await expect.element(page.getByText('Description complète.')).toBeVisible();
	});

	it('keeps the modal and its actions accessible on mobile', async () => {
		await page.viewport(390, 844);
		render(CardDetailModal, {
			card,
			onToggleWishlist: vi.fn(),
			onClose: vi.fn()
		});

		const modal = document.querySelector<HTMLElement>('[data-testid="card-detail-modal"]')!;
		const actions = document.querySelector<HTMLElement>(
			'[data-testid="card-detail-mobile-actions"]'
		)!;
		const tabs = document.querySelector<HTMLElement>('[data-testid="card-detail-mobile-tabs"]')!;
		const overlay = document.querySelector<HTMLElement>('[data-testid="card-detail-overlay"]')!;
		const modalRect = modal.getBoundingClientRect();
		const actionsRect = actions.getBoundingClientRect();
		const tabsRect = tabs.getBoundingClientRect();
		const cardRect = document
			.querySelector<HTMLElement>('.card-detail-preview .wikiforge-card-size')!
			.getBoundingClientRect();
		expect(modalRect.left).toBeGreaterThanOrEqual(0);
		expect(modalRect.right).toBeLessThanOrEqual(window.innerWidth);
		expect(modalRect.bottom).toBeLessThanOrEqual(window.innerHeight);
		expect(cardRect.width).toBeGreaterThanOrEqual(190);
		expect(Number(getComputedStyle(overlay).zIndex)).toBeGreaterThan(40);
		expect(actionsRect.bottom).toBeLessThanOrEqual(modalRect.bottom);
		expect(tabsRect.bottom).toBeLessThanOrEqual(actionsRect.top);
		await expect.element(page.getByRole('tab', { name: 'Données' })).toBeVisible();
		await page.getByRole('button', { name: 'Marché', exact: true }).click();
		await expect.element(page.getByTestId('card-market-modal')).toBeVisible();
		expect(document.querySelector('[data-testid="card-market-modal"] polyline')).not.toBeNull();
		document
			.querySelector<HTMLButtonElement>('[data-testid="card-market-modal"] button[aria-label]')
			?.click();
		await vi.waitFor(() =>
			expect(document.querySelector('[data-testid="card-market-modal"]')).toBeNull()
		);
		await page.getByRole('tab', { name: 'Données' }).click();
		await expect
			.element(page.getByRole('tab', { name: 'Données' }))
			.toHaveAttribute('aria-selected', 'true');
		expect(tabs.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			actions.getBoundingClientRect().top
		);
		expect(actions.querySelectorAll('button')).toHaveLength(2);
		for (const button of actions.querySelectorAll('button')) {
			expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		}
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	});
});
