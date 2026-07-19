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
		await expect
			.element(page.getByTestId('card-effects'))
			.toHaveAttribute('data-profile', 'full-art');
	});

	it('contains landscape Full Art illustrations on a white background', async () => {
		render(CardTile, {
			card: { ...card, imageUrl: '/card-placeholder.svg', isFullArt: true }
		});
		const image = document.querySelector<HTMLImageElement>('[data-testid="card-art"] img');
		expect(image).not.toBeNull();
		Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1600 });
		Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 900 });
		image?.dispatchEvent(new Event('load'));

		await expect.element(page.getByTestId('card-art')).toHaveAttribute('data-landscape', 'true');
		await expect.element(page.getByTestId('card-art')).toHaveClass('bg-white');
		expect(image).toHaveClass('object-contain', 'object-[center_35%]');
	});

	it('keeps a long title in its dedicated card zone', async () => {
		const title = 'Girls Generation Archives impériales de collection';
		render(CardTile, { card: { ...card, title } });
		await expect.element(page.getByText(title)).toBeVisible();
	});

	it('uses colored bookmarks for tags outside the detail view', async () => {
		const tags = [{ id: 'tag-1', name: 'Favorite', color: '#ff6600' }];
		render(CardTile, { card, tags });
		await expect.element(page.getByTestId('card-tag-bookmarks')).toBeInTheDocument();
		await expect
			.element(page.getByLabelText('Favorite'))
			.toHaveAttribute('style', expect.stringContaining('rgb(255, 102, 0)'));
		await expect.element(page.getByText('Favorite')).not.toBeInTheDocument();
	});

	it('keeps full tag labels only when explicitly requested by the detail view', async () => {
		render(CardTile, {
			card,
			tags: [{ id: 'tag-1', name: 'Favorite', color: '#ff6600' }],
			tagDisplay: 'full'
		});
		await expect.element(page.getByText('Favorite')).toBeVisible();
		await expect.element(page.getByTestId('card-tag-bookmarks')).not.toBeInTheDocument();
	});

	it('exposes compact ownership, wishlist and other-owner indicators', async () => {
		render(CardTile, {
			card: {
				...card,
				ownedCount: 2,
				wishlistMemberships: [{ id: 'list-1', title: 'Priorités', defaultList: false }],
				friendsWhoOwn: [{ friendId: 'friend-1', username: 'Ami', avatarUrl: '', ownedCount: 3 }]
			}
		});
		await expect.element(page.getByLabelText(/2 exemplaire/)).toBeVisible();
		await expect.element(page.getByLabelText(/Présente dans 1 wishlist/)).toBeVisible();
		await page.getByLabelText(/Possédée par 1 autre/).click();
		await expect.element(page.getByRole('menuitem', { name: /@Ami/ })).toBeVisible();
	});

	it('activates the PC illustration effect and tilt on focus', async () => {
		render(CardTile, {
			card: { ...card, rarity: 'Peu Commune', rarityInitials: 'PC' },
			onOpen: vi.fn()
		});

		document.querySelector<HTMLButtonElement>(`button[aria-label="${card.title}"]`)?.focus();
		await expect.element(page.getByTestId('card-effects')).toHaveAttribute('data-active', 'true');
		await expect
			.element(page.getByTestId('card-tile'))
			.toHaveAttribute('data-effect-active', 'true');
		await expect.element(page.getByTestId('card-tile')).toHaveAttribute('data-tilt-active', 'true');
	});

	it('keeps common cards static and free from foil effects', async () => {
		render(CardTile, {
			card: { ...card, rarity: 'Commune', rarityInitials: 'C' },
			onOpen: vi.fn()
		});

		document.querySelector<HTMLButtonElement>(`button[aria-label="${card.title}"]`)?.focus();
		await expect.element(page.getByTestId('card-effects')).not.toBeInTheDocument();
		await expect
			.element(page.getByTestId('card-tile'))
			.toHaveAttribute('data-effect-active', 'false');
		await expect
			.element(page.getByTestId('card-tile'))
			.toHaveAttribute('data-tilt-active', 'false');
	});

	it('temporarily reinforces an ultra-rare foil effect on touch', async () => {
		render(CardTile, {
			card: { ...card, rarity: 'Ultra-Rare', rarityInitials: 'UR' }
		});
		const tile = document.querySelector<HTMLElement>('[data-testid="card-tile"]')!;

		tile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
		await vi.waitFor(() => expect(tile).toHaveAttribute('data-effect-active', 'true'));
		tile.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }));
		await vi.waitFor(() => expect(tile).toHaveAttribute('data-effect-active', 'false'));
	});

	it('keeps the illustration effect inside the Wikipedia image area', async () => {
		render(CardTile, { card: { ...card, rarity: 'Rare', rarityInitials: 'R' } });

		const effect = document.querySelector('[data-testid="card-effects"]');
		expect(effect?.closest('[data-testid="card-art"]')).not.toBeNull();
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
