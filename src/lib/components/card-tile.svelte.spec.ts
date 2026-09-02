import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CardTile from './card-tile.svelte';
import { setNsfwFilterSettings } from '$lib/content/nsfw-filter';
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
	it('blurs the illustration when it matches a configured NSFW keyword', async () => {
		setNsfwFilterSettings({ enabled: false, keywords: ['sensible'] });
		render(CardTile, { card: { ...card, shortDescription: 'Notice sensible.' } });
		await expect
			.element(page.getByTestId('card-nsfw-blur'))
			.toHaveAttribute('aria-label', 'Illustration floutée par le filtre NSFW');
		setNsfwFilterSettings({});
	});
	it('shows an accessible protection indicator for protected collection cards', async () => {
		render(CardTile, { card: { ...card, userProtected: true, ownedCount: 2 } });
		await expect.element(page.getByTestId('card-protected-indicator')).toBeVisible();
		await expect
			.element(page.getByTestId('card-protected-indicator'))
			.toHaveAttribute('aria-label', 'Carte protégée');
		const cluster = page.getByTestId('card-left-indicators').element();
		expect(page.getByTestId('card-protected-indicator').element().parentElement).toBe(cluster);
		expect(page.getByTestId('card-state-indicators').element().parentElement).toBe(cluster);
		expect(cluster).toHaveClass('flex-col', 'gap-1');
	});

	it('opens card details through its callback without navigation', async () => {
		const onOpen = vi.fn();
		render(CardTile, { card, onOpen });
		await expect.element(page.getByTestId('card-tile')).toHaveClass('bg-transparent');
		await page.getByRole('button', { name: card.title }).click();
		expect(onOpen).toHaveBeenCalledWith(card);
		await expect
			.element(page.getByRole('button', { name: card.title }))
			.toHaveClass('inset-0', 'size-auto', 'hover:bg-primary/20');
		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});

	it('renders the data inside the legendary full-art frame', async () => {
		render(CardTile, { card: { ...card, isFullArt: true } });
		await expect
			.element(page.getByTestId('card-tile'))
			.toHaveAttribute('data-frame', '/images/card-L---Overframe-empty.png');
		await expect.element(page.getByTestId('card-tile')).toHaveAttribute('data-layout', 'full-art');
		await expect.element(page.getByLabelText('ATK 9500')).toBeVisible();
		await expect.element(page.getByLabelText('DEF 9800')).not.toBeInTheDocument();
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

	it('distinguishes the compared collection ownership count', async () => {
		render(CardTile, {
			card,
			comparisonOwnership: { count: 4, label: 'Alice possède 4 exemplaires' }
		});

		await expect.element(page.getByLabelText('Alice possède 4 exemplaires')).toBeVisible();
		await expect
			.element(page.getByTestId('ownership-count-comparison'))
			.toHaveClass('text-sky-200');
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
		['Commune', 'C', '/images/templates/commune-v2.png'],
		['Peu Commune', 'PC', '/images/templates/peu-commune-v2.png'],
		['Rare', 'R', '/images/templates/rare-v2.png'],
		['Super-Rare', 'SR', '/images/templates/super-rare-v2.png'],
		['Ultra-Rare', 'UR', '/images/templates/ultra-rare-v2.png'],
		['Légendaire', 'L', '/images/templates/legendaire-v2.png']
	] as const)('selects the %s frame', async (rarity, rarityInitials, frame) => {
		render(CardTile, { card: { ...card, rarity, rarityInitials, isFullArt: false } });
		await expect.element(page.getByTestId('card-tile')).toHaveAttribute('data-frame', frame);
	});
});
