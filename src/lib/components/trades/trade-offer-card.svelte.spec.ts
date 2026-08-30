import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import TradeOfferCard from './trade-offer-card.svelte';
import type { CardRecord, TradeCardDetail, TradeOffer } from '$lib/types';

const card = (
	id: string,
	title: string,
	rarityInitials: CardRecord['rarityInitials'],
	rarityColor: string
): CardRecord => ({
	id,
	catalogueId: `${id}-variant`,
	title,
	shortDescription: '',
	longDescription: '',
	rarity: 'Rare',
	rarityInitials,
	rarityColor,
	viewCount: 0,
	imageUrl: '/card-placeholder.svg',
	wikipediaUrl: '',
	attack: 10,
	defense: 20,
	ownedCount: 1,
	globalSupply: 1,
	friendsWhoOwn: []
});

const cards: TradeCardDetail[] = [
	{
		userCardId: 'offered-user-card',
		side: 'offered',
		status: 'added',
		card: card('offered-user-card', 'Carte proposée', 'R', '#b59bf6')
	},
	{
		userCardId: 'requested-user-card',
		side: 'requested',
		status: 'added',
		card: card('requested-user-card', 'Carte demandée', 'L', '#f4d35e')
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
	message: 'Une proposition précise',
	status: 'pending',
	createdAt: '2026-07-15T17:36:16Z',
	updatedAt: '2026-07-15T17:36:16Z'
};

describe('TradeOfferCard', () => {
	afterEach(async () => page.viewport(1280, 900));

	it('shows both sides and the direct-message action on mobile', async () => {
		await page.viewport(390, 844);
		const onMessage = vi.fn();
		const onView = vi.fn();
		render(TradeOfferCard, {
			offer,
			cards,
			currentUserId: 'current-user',
			onRespond: vi.fn(),
			onView,
			onMessage,
			onCounterOffer: vi.fn()
		});

		await expect.element(page.getByText('De Claire Trade')).toBeVisible();
		await expect.element(page.getByText('@claire.trade')).toBeVisible();
		await expect.element(page.getByText('0 pièces').first()).toBeVisible();
		await expect.element(page.getByText('R · Carte proposée')).toBeVisible();
		await expect.element(page.getByText('L · Carte demandée')).toBeVisible();
		await page.getByRole('button', { name: 'Envoyer un message à Claire Trade' }).click();
		expect(onMessage).toHaveBeenCalledWith('user-claire');
		expect(onView).not.toHaveBeenCalled();
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
	});

	it('opens the shared detail from the bilateral desktop summary', async () => {
		await page.viewport(1440, 900);
		const onView = vi.fn();
		render(TradeOfferCard, {
			offer,
			cards,
			currentUserId: 'current-user',
			onRespond: vi.fn(),
			onView,
			onMessage: vi.fn(),
			onCounterOffer: vi.fn()
		});

		await page.getByRole('button', { name: 'Afficher le détail de l’offre' }).click();

		expect(onView).toHaveBeenCalledOnce();
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(1440);
	});
});
