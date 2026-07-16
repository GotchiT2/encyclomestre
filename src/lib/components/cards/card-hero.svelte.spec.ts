import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CardHero from './card-hero.svelte';
import type { CardRecord } from '$lib/types';

const card: CardRecord = {
	id: 'pc-card',
	title: 'Carte peu commune',
	shortDescription: 'Description courte.',
	longDescription: 'Description complète.',
	rarity: 'Peu Commune',
	rarityInitials: 'PC',
	rarityColor: '#4f9bd8',
	viewCount: 100,
	imageUrl: '/images/example.png',
	wikipediaUrl: 'https://fr.wikipedia.org',
	attack: 1200,
	defense: 1400,
	ownedCount: 1,
	globalSupply: 100,
	friendsWhoOwn: []
};

describe('CardHero', () => {
	it('contains the PC effect inside the Wikipedia illustration only', async () => {
		render(CardHero, { card });

		await expect.element(page.getByTestId('card-effects')).toBeInTheDocument();
		const effect = document.querySelector('[data-testid="card-effects"]');
		expect(effect?.closest('[data-testid="card-hero-illustration"]')).not.toBeNull();
	});
});
