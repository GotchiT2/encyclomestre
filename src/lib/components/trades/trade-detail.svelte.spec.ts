import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import TradeDetail from './trade-detail.svelte';
import type { CardRecord, TradeOffer } from '$lib/types';

const card = (id: string, title: string): CardRecord => ({
	id,
	title,
	shortDescription: '',
	longDescription: '',
	rarity: 'Commune',
	rarityInitials: 'C',
	rarityColor: '#d3e4f8',
	viewCount: 0,
	imageUrl: '/card-placeholder.svg',
	wikipediaUrl: '',
	attack: 10,
	defense: 10,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: []
});

const cards = [
	card('offered-user-card', 'Carte proposée'),
	card('requested-user-card', 'Carte demandée')
];
const offer: TradeOffer = {
	id: 'trade-1',
	initiatorId: 'user-claire',
	recipientId: 'current-user',
	initiator: { id: 'user-claire', username: 'claire.trade', displayName: 'Claire Trade' },
	recipient: { id: 'current-user', username: 'test', displayName: 'Test' },
	offeredCardIds: ['offered-user-card'],
	requestedCardIds: ['requested-user-card'],
	offeredCredits: 0,
	requestedCredits: 40,
	status: 'pending',
	createdAt: '2026-07-15T17:36:16Z',
	updatedAt: '2026-07-15T17:36:16Z'
};

describe('TradeDetail', () => {
	afterEach(async () => page.viewport(1280, 900));

	it('keeps both card compositions and actions inside a mobile viewport', async () => {
		await page.viewport(390, 844);
		render(TradeDetail, {
			open: true,
			offer,
			offeredCards: [cards[0]],
			requestedCards: [cards[1]],
			currentUserId: 'current-user',
			onCounterOffer: vi.fn(),
			onRespond: vi.fn(),
			onCancel: vi.fn()
		});

		await expect.element(page.getByText('Claire Trade → Test')).toBeVisible();
		expect(document.querySelectorAll('[data-testid="card-tile"]')).toHaveLength(2);
		await expect.element(page.getByRole('button', { name: 'Accepter' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Fermer' })).toBeVisible();
		await expect.element(page.getByText('trade-1')).not.toBeInTheDocument();
		expect(getComputedStyle(document.body).overflow).toBe('hidden');
		const scrollRect = await page
			.getByTestId('trade-detail-scroll')
			.element()
			.getBoundingClientRect();
		const actionRect = await page
			.getByTestId('trade-detail-actions')
			.element()
			.getBoundingClientRect();
		expect(scrollRect.bottom).toBeLessThanOrEqual(actionRect.top + 1);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
	});

	it('never substitutes a card from the other participant when an instance is unavailable', async () => {
		render(TradeDetail, {
			open: true,
			offer,
			offeredCards: [cards[0]],
			requestedCards: [],
			currentUserId: 'current-user',
			onCounterOffer: vi.fn(),
			onRespond: vi.fn(),
			onCancel: vi.fn()
		});

		expect(document.querySelectorAll('[data-testid="card-tile"]')).toHaveLength(1);
		await expect.element(page.getByText(/1 carte.*ne sont plus disponibles/)).toBeVisible();
		await expect.element(page.getByText('Carte demandée')).not.toBeInTheDocument();
	});
});
