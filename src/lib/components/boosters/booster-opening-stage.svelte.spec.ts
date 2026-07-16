import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import BoosterOpeningStage from './booster-opening-stage.svelte';
import type { CardRecord } from '$lib/types';

const cards: CardRecord[] = [
	{
		id: 'first',
		title: 'Première carte',
		shortDescription: 'Première révélation.',
		longDescription: 'Première révélation.',
		rarity: 'Commune',
		rarityInitials: 'C',
		rarityColor: '#d3e4f8',
		viewCount: 1,
		imageUrl: '',
		wikipediaUrl: '',
		attack: 100,
		defense: 200,
		ownedCount: 0,
		globalSupply: 1,
		friendsWhoOwn: []
	},
	{
		id: 'second',
		title: 'Carte légendaire',
		shortDescription: 'Dernière révélation.',
		longDescription: 'Dernière révélation.',
		rarity: 'Légendaire',
		rarityInitials: 'L',
		rarityColor: '#cf1d1d',
		viewCount: 1,
		imageUrl: '',
		wikipediaUrl: '',
		attack: 900,
		defense: 800,
		ownedCount: 0,
		globalSupply: 1,
		friendsWhoOwn: [],
		isFullArt: true
	}
];

describe('BoosterOpeningStage', () => {
	beforeEach(() => localStorage.clear());
	afterEach(async () => page.viewport(1280, 720));

	it('prevents another opening while the request is active', async () => {
		const onOpen = vi.fn();
		render(BoosterOpeningStage, {
			available: 1,
			maximum: 1,
			opening: true,
			cards: null,
			onOpen,
			onReset: vi.fn()
		});

		const openButton = page.getByRole('button', { name: 'Ouverture en cours…' });
		await expect.element(openButton).toBeDisabled();
		expect(onOpen).not.toHaveBeenCalled();
	});

	it('reveals desktop cards in any order and advances with Space', async () => {
		const onOpen = vi.fn();
		const onOpenCard = vi.fn();
		render(BoosterOpeningStage, {
			available: 1,
			maximum: 2,
			opening: false,
			cards,
			onOpen,
			onReset: vi.fn(),
			onOpenCard
		});

		const legendary = document.querySelector<HTMLButtonElement>('[data-rarity="L"] button');
		expect(legendary?.getAttribute('aria-label')).toBe('Retourner la carte Légendaire');
		await vi.waitFor(() => expect(legendary).not.toBeDisabled(), { timeout: 1200 });
		legendary?.click();
		await vi.waitFor(() =>
			expect(document.querySelector('[data-rarity="L"]')).toHaveAttribute('data-revealed', 'true')
		);
		expect(document.querySelector('[data-rarity="C"]')).toHaveAttribute('data-revealed', 'false');
		await vi.waitFor(() =>
			expect(legendary?.getAttribute('aria-label')).toBe('Afficher les détails de Carte légendaire')
		);
		const legendaryLocator = page.elementLocator(legendary!);
		await legendaryLocator.hover();
		expect(onOpenCard).not.toHaveBeenCalled();
		const propagation = document.querySelector<HTMLElement>(
			'[data-rarity="L"] .booster-light-propagation span'
		);
		expect(getComputedStyle(propagation!).animationName).toContain('booster-light-wave');
		legendary?.dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })
		);
		await vi.waitFor(() =>
			expect(document.querySelector('[data-rarity="L"]')).toHaveClass('is-propagating')
		);
		legendary?.click();
		expect(onOpenCard).toHaveBeenCalledOnce();

		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
		await expect.element(page.getByText('Toutes les cartes ont été affichées')).toBeVisible();
		expect(document.querySelector('[data-rarity="C"]')).toHaveAttribute('data-revealed', 'true');

		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
		expect(onOpen).toHaveBeenCalledOnce();
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', repeat: true }));
		expect(onOpen).toHaveBeenCalledOnce();
	});

	it('suspends quick opening and resumes the remaining reveals after closing details', async () => {
		localStorage.setItem('wikiforge.booster.quick-opening', 'true');
		const props = {
			available: 1,
			maximum: 2,
			opening: false,
			cards,
			suspended: true,
			onOpen: vi.fn(),
			onReset: vi.fn(),
			onOpenCard: vi.fn()
		};
		const result = render(BoosterOpeningStage, props);

		await new Promise((resolve) => window.setTimeout(resolve, 800));
		expect(document.querySelectorAll('[data-revealed="true"]')).toHaveLength(0);
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
		expect(document.querySelectorAll('[data-revealed="true"]')).toHaveLength(0);

		await result.rerender({ ...props, suspended: false });
		await expect.element(page.getByText('Toutes les cartes ont été affichées')).toBeVisible();
		expect(document.querySelectorAll('[data-revealed="true"]')).toHaveLength(cards.length);
	});

	it('exposes every rarity aura and the Full Art signature', () => {
		const rarityCards: CardRecord[] = [
			['Commune', 'C', '#d3e4f8'],
			['Peu Commune', 'PC', '#1d71cf'],
			['Rare', 'R', '#5c1dcf'],
			['Super-Rare', 'SR', '#b41dcf'],
			['Ultra-Rare', 'UR', '#cf7d1d'],
			['Légendaire', 'L', '#cf1d1d']
		].map(([rarity, rarityInitials, rarityColor], index) => ({
			...cards[index % cards.length],
			id: `rarity-${rarityInitials}`,
			rarity: rarity as CardRecord['rarity'],
			rarityInitials: rarityInitials as CardRecord['rarityInitials'],
			rarityColor,
			isFullArt: rarityInitials === 'L'
		}));
		render(BoosterOpeningStage, {
			available: 0,
			maximum: 1,
			opening: false,
			cards: rarityCards,
			onOpen: vi.fn(),
			onReset: vi.fn()
		});

		for (const card of rarityCards) {
			const element = document.querySelector<HTMLElement>(`[data-rarity="${card.rarityInitials}"]`);
			expect(element).not.toBeNull();
			expect(element?.getAttribute('style')).toContain(card.rarityColor);
		}
		expect(document.querySelector('[data-rarity="L"]')).toHaveClass('is-full-art');
	});

	it('automatically reveals the pack with the persisted quick preference', async () => {
		localStorage.setItem('wikiforge.booster.quick-opening', 'true');
		render(BoosterOpeningStage, {
			available: 0,
			maximum: 1,
			opening: false,
			cards,
			onOpen: vi.fn(),
			onReset: vi.fn()
		});

		await expect.element(page.getByText('Toutes les cartes ont été affichées')).toBeVisible();
		expect(document.querySelectorAll('[data-revealed="true"]')).toHaveLength(cards.length);
		await expect.element(page.getByRole('switch', { name: 'Ouverture rapide' })).toBeChecked();
	});

	it('keeps the final mobile card visible before showing the recap', async () => {
		await page.viewport(390, 844);
		render(BoosterOpeningStage, {
			available: 0,
			maximum: 1,
			opening: false,
			cards,
			onOpen: vi.fn(),
			onReset: vi.fn()
		});

		await new Promise((resolve) => window.setTimeout(resolve, 760));
		document.querySelector<HTMLButtonElement>('.mobile-current button')?.click();
		await new Promise((resolve) => window.setTimeout(resolve, 720));
		const lastCard = document.querySelector<HTMLButtonElement>('.mobile-current button');
		expect(lastCard?.getAttribute('aria-label')).toContain('Légendaire');
		lastCard?.click();

		expect(document.querySelector('.booster-deck')?.getAttribute('data-phase')).toBe('revealing');
		await vi.waitFor(() =>
			expect(document.querySelector('.mobile-current [data-rarity="L"]')).toHaveAttribute(
				'data-revealed',
				'true'
			)
		);
		await new Promise((resolve) => window.setTimeout(resolve, 950));
		expect(document.querySelector('.booster-deck')?.getAttribute('data-phase')).toBe('revealing');
		await expect
			.element(page.getByRole('button', { name: 'Afficher le récapitulatif' }))
			.toBeVisible();
		await page.getByRole('button', { name: 'Afficher le récapitulatif' }).click();
		expect(document.querySelector('.booster-deck')?.getAttribute('data-phase')).toBe('complete');
	});

	it('shows a retry action after an API failure', async () => {
		const onOpen = vi.fn();
		render(BoosterOpeningStage, {
			available: 1,
			maximum: 1,
			opening: false,
			cards: null,
			error: true,
			onOpen,
			onReset: vi.fn()
		});

		await expect.element(page.getByText('L’ouverture du booster a échoué')).toBeVisible();
		document.querySelector<HTMLButtonElement>('button[aria-label="Réessayer"]')?.click();
		await vi.waitFor(() => expect(onOpen).toHaveBeenCalledOnce());
	});

	it('keeps the opening scene inside mobile, tablet and desktop viewports', async () => {
		render(BoosterOpeningStage, {
			available: 0,
			maximum: 1,
			opening: false,
			cards,
			onOpen: vi.fn(),
			onReset: vi.fn()
		});

		for (const [width, height] of [
			[390, 844],
			[768, 1024],
			[1440, 900]
		]) {
			await page.viewport(width, height);
			const overflowing = [...document.querySelectorAll<HTMLElement>('body *')]
				.filter(
					(element) => element.getBoundingClientRect().right > document.documentElement.clientWidth
				)
				.map((element) => `${element.tagName}.${element.className}`)
				.slice(0, 5);
			expect(document.documentElement.scrollWidth, overflowing.join('\n')).toBeLessThanOrEqual(
				document.documentElement.clientWidth
			);
		}
	});
});
