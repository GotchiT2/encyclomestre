import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import TradeOfferCard from './trade-offer-card.svelte';
import type { TradeOffer } from '$lib/types';

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

	it('shows participant names and card counts without collection hydration', async () => {
		await page.viewport(390, 844);
		render(TradeOfferCard, {
			offer,
			currentUserId: 'current-user',
			onRespond: vi.fn(),
			onView: vi.fn(),
			onCounterOffer: vi.fn()
		});

		await expect.element(page.getByText('De Claire Trade')).toBeVisible();
		await expect.element(page.getByText('@claire.trade')).toBeVisible();
		expect(page.getByText('1 carte(s)').all()).toHaveLength(2);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
	});
});
