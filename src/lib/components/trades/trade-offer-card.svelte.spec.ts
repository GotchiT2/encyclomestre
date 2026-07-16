import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import TradeOfferCard from './trade-offer-card.svelte';
import type { CardRecord, TradeOffer } from '$lib/types';

const cards: CardRecord[] = [
	{
		id: 'offered-user-card',
		catalogueId: 'offered-variant',
		title: 'Carte proposée',
		shortDescription: '',
		longDescription: '',
		rarity: 'Rare',
		rarityInitials: 'R',
		rarityColor: '#7c4dff',
		viewCount: 0,
		imageUrl: '/card-placeholder.svg',
		wikipediaUrl: '',
		attack: 10,
		defense: 20,
		ownedCount: 1,
		globalSupply: 1,
		friendsWhoOwn: []
	},
	{
		id: 'requested-user-card',
		catalogueId: 'requested-variant',
		title: 'Carte demandée',
		shortDescription: '',
		longDescription: '',
		rarity: 'Légendaire',
		rarityInitials: 'L',
		rarityColor: '#e04b3f',
		viewCount: 0,
		imageUrl: '/card-placeholder.svg',
		wikipediaUrl: '',
		attack: 30,
		defense: 40,
		ownedCount: 1,
		globalSupply: 1,
		friendsWhoOwn: []
	}
];

const offer: TradeOffer = {
	id: 'trade-1',
	initiatorId: 'user-claire',
	recipientId: 'current-user',
	initiator: {
		id: 'user-claire',
		username: 'claire.trade',
		displayName: 'Claire Trade'
	},
	recipient: { id: 'current-user', username: 'test', displayName: 'Test' },
	offeredCardIds: ['offered-user-card'],
	requestedCardIds: ['requested-user-card'],
	offeredCredits: 0,
	requestedCredits: 40,
	status: 'pending',
	createdAt: '2026-07-15T17:36:16Z',
	updatedAt: '2026-07-15T17:36:16Z'
};

describe('TradeOfferCard', () => {
	afterEach(async () => page.viewport(1280, 900));

	it('shows participant display names and resolves cards by user-card UUID on mobile', async () => {
		await page.viewport(390, 844);
		render(TradeOfferCard, {
			offer,
			cards,
			currentUserId: 'current-user',
			onRespond: vi.fn(),
			onView: vi.fn(),
			onCounterOffer: vi.fn()
		});

		await expect.element(page.getByText('De Claire Trade')).toBeVisible();
		await expect.element(page.getByText('@claire.trade')).toBeVisible();
		await expect.element(page.getByText('Carte proposée')).toBeVisible();
		await expect.element(page.getByText('Carte demandée')).toBeVisible();
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
	});
});
