import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CardTile from './card-tile.svelte';
import type { CardRecord } from '$lib/types';

const card: CardRecord = {
	id: 'girls-generation-1',
	title: "Girls' Generation",
	shortDescription: 'Notice encyclopédique.',
	longDescription: 'Notice encyclopédique complète.',
	rarity: 'Légendaire',
	rarityInitials: 'L',
	rarityColor: '#E5A93C',
	viewCount: 100,
	imageUrl: '',
	wikipediaUrl: 'https://fr.wikipedia.org',
	attack: 9500,
	defense: 9800,
	ownedCount: 0,
	globalSupply: 100,
	friendsWhoOwn: []
};

describe('CardTile', () => {
	it('links directly to the card detail route', async () => {
		render(CardTile, { card });
		await expect
			.element(page.getByRole('link'))
			.toHaveAttribute('href', '/cards/girls-generation-1');
	});
});
