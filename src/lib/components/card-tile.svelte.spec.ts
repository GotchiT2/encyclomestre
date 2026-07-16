import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
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
	rarityColor: '#cf1d1d',
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
	it('opens card details through its callback without navigation', async () => {
		const onOpen = vi.fn();
		render(CardTile, { card, onOpen });
		await expect.element(page.getByTestId('card-tile')).toHaveClass('bg-transparent');
		await page.getByRole('button', { name: card.title }).click();
		expect(onOpen).toHaveBeenCalledWith(card);
		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});

	it('renders the data inside the legendary full-art frame', async () => {
		render(CardTile, { card: { ...card, isFullArt: true } });
		await expect
			.element(page.getByTestId('card-tile'))
			.toHaveAttribute('data-frame', '/images/card-L---Overframe-empty.png');
		await expect.element(page.getByTestId('card-tile')).toHaveAttribute('data-layout', 'full-art');
		await expect.element(page.getByLabelText('ATK 9500')).toBeVisible();
		await expect.element(page.getByLabelText('DEF 9800')).toBeVisible();
		await expect.element(page.getByText('Notice encyclopédique.')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('card-art')).toHaveClass('top-[6.3%]');
	});

	it('keeps a long title in its dedicated card zone', async () => {
		const title = 'Girls Generation Archives impériales de collection';
		render(CardTile, { card: { ...card, title } });
		await expect.element(page.getByText(title)).toBeVisible();
	});

	it.each([
		['Commune', 'C', '/images/card-C-empty.png'],
		['Peu Commune', 'PC', '/images/card-PC-empty.png'],
		['Rare', 'R', '/images/card-R-empty.png'],
		['Super-Rare', 'SR', '/images/card-SR-empty.png'],
		['Ultra-Rare', 'UR', '/images/card-UR-empty.png'],
		['Légendaire', 'L', '/images/card-L-empty.png']
	] as const)('selects the %s frame', async (rarity, rarityInitials, frame) => {
		render(CardTile, { card: { ...card, rarity, rarityInitials, isFullArt: false } });
		await expect.element(page.getByTestId('card-tile')).toHaveAttribute('data-frame', frame);
	});
});
