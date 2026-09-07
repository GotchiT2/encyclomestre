import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';

const { gotoMock, getVariantCopiesMock, getWikiForgeCollectionCardMock, getFriendCollectionPageMock } = vi.hoisted(() => ({
	gotoMock: vi.fn(),
	getVariantCopiesMock: vi.fn(async () => []),
	getWikiForgeCollectionCardMock: vi.fn(async () => ({ sharedWishlistMemberships: [] })),
	getFriendCollectionPageMock: vi.fn<() => Promise<CollectionPageResult>>(async () => ({ items: [], page: 0, total: 0, hasNext: false, nextCursor: null, rarityResults: null }))
}));
vi.mock('$app/navigation', () => ({ goto: gotoMock }));

vi.mock('$lib/api', () => ({
	addWikiForgeCardTag: vi.fn(),
	removeWikiForgeCardTag: vi.fn(),
	applyWikiForgeTag: vi.fn(),
	removeWikiForgeTag: vi.fn(),
	createWikiForgeTag: vi.fn(),
	updateWikiForgeTag: vi.fn(),
	deleteWikiForgeTag: vi.fn(),
	getVariantCopies: getVariantCopiesMock,
	getWikiForgeCollectionCard: getWikiForgeCollectionCardMock,
	getFriendCollectionPage: getFriendCollectionPageMock,
	getWikiForgeCollectionPage: vi.fn(async () => ({ items: [], page: 0, total: 0, hasNext: false, nextCursor: null, rarityResults: null })),
	createTradeOffer: vi.fn(),
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
import type { CollectionPageResult } from '$lib/api/collection';

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
	afterEach(async () => {
		gotoMock.mockClear();
		getVariantCopiesMock.mockClear();
		await page.viewport(1280, 720);
	});

	it('does not load local collection copies for a public catalogue card', async () => {
		render(CardDetailModal, {
			card,
			loadVariantCopies: false,
			onToggleWishlist: vi.fn(),
			onClose: vi.fn()
		});

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(getVariantCopiesMock).not.toHaveBeenCalled();
	});

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
		expect(
			Number(getComputedStyle(page.getByTestId('card-market-modal').element()).zIndex)
		).toBeGreaterThan(Number(getComputedStyle(modal).zIndex));
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
		expect(actions.querySelectorAll('button')).toHaveLength(1);
		for (const button of actions.querySelectorAll('button')) {
			expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		}
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	});

	it('stacks tag management above the card detail and offsets state indicators', async () => {
		render(CardDetailModal, {
			card: { ...card, ownedCount: 2 },
			owned: true,
			tags: [],
			assignments: {},
			onToggleWishlist: vi.fn(),
			onClose: vi.fn()
		});

		const indicators = page.getByTestId('card-state-indicators');
		await expect.element(indicators).toBeVisible();
		expect(indicators.element().parentElement?.style.top).toContain('10px');

		await page.getByRole('button', { name: 'Gérer les étiquettes' }).click();
		const tagDialog = page.getByRole('dialog', { name: 'Étiquettes' });
		await expect.element(tagDialog).toBeVisible();
		const detail = page.getByTestId('card-detail-modal').element();
		expect(Number(getComputedStyle(tagDialog.element()).zIndex)).toBeGreaterThan(
			Number(getComputedStyle(detail).zIndex)
		);
		expect(tagDialog.element().contains(document.activeElement)).toBe(true);
	});

	it('lets an owner toggle the collection protection state', async () => {
		const onToggleProtection = vi.fn();
		render(CardDetailModal, {
			card: { ...card, userProtected: true },
			owned: true,
			loadVariantCopies: false,
			onToggleWishlist: vi.fn(),
			onToggleProtection,
			onClose: vi.fn()
		});

		await page.getByRole('button', { name: 'Retirer la protection' }).click();
		expect(onToggleProtection).toHaveBeenCalledOnce();
	});

	it('prepares an exchange with the selected owner rarity', async () => {
		const onClose = vi.fn();
		render(CardDetailModal, {
			card: {
				...card,
				baseCardId: 42,
				friendsWhoOwn: [
					{
						friendId: 'friend-1',
						username: 'alice',
						avatarUrl: '',
						ownedCount: 3,
						rarityCounts: { SR: 2, C: 1 }
					}
				]
			},
			onToggleWishlist: vi.fn(),
			onClose
		});
		getFriendCollectionPageMock.mockResolvedValueOnce({
			items: [{ ...card, id: 'requested-copy', baseCardId: 42, rarityInitials: 'SR' }],
			page: 0,
			total: 1,
			hasNext: false,
			nextCursor: null,
			rarityResults: null
		});

		await page.getByRole('tab', { name: 'Réseau' }).first().click();
		await page.getByRole('button', { name: /alice.*SR/i }).click();
		await expect.element(page.getByRole('dialog', { name: /Échanger avec alice/i })).toBeVisible();
		expect(onClose).not.toHaveBeenCalled();
		expect(gotoMock).not.toHaveBeenCalled();
		expect(getFriendCollectionPageMock).toHaveBeenCalledWith('friend-1', { rarities: ['SR'] });
	});
});
