import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CardEffects from './card-effects.svelte';

describe('CardEffects', () => {
	it.each([
		['PC', 'pc', '1', 'false', '0'],
		['R', 'r', '2', 'false', '0.1'],
		['SR', 'sr', '3', 'false', '0.26'],
		['UR', 'ur', '4', 'false', '0.34'],
		['L', 'l', '5', 'true', '0.4']
	] as const)(
		'renders the progressive %s profile',
		async (rarity, profile, level, ambient, varnish) => {
			render(CardEffects, { rarity, active: true });

			const effects = page.getByTestId('card-effects');
			await expect.element(effects).toHaveAttribute('data-rarity', rarity);
			await expect.element(effects).toHaveAttribute('data-profile', profile);
			await expect.element(effects).toHaveAttribute('data-effect-level', level);
			await expect.element(effects).toHaveAttribute('data-ambient', ambient);
			await expect.element(effects).toHaveAttribute('data-active', 'true');
			expect(document.querySelectorAll('[data-testid="card-effects"] > span')).toHaveLength(3);
			expect(
				getComputedStyle(document.querySelector<HTMLElement>('[data-testid="card-effects"]')!)
					.getPropertyValue('--varnish-active')
					.trim()
			).toBe(varnish);
		}
	);

	it('uses a dedicated full-art profile', async () => {
		render(CardEffects, { rarity: 'L', fullArt: true, active: true });

		await expect
			.element(page.getByTestId('card-effects'))
			.toHaveAttribute('data-profile', 'full-art');
		await expect
			.element(page.getByTestId('card-effects'))
			.toHaveAttribute('data-effect-level', '6');
		await expect.element(page.getByTestId('card-effects')).toHaveAttribute('data-ambient', 'true');
		expect(
			getComputedStyle(document.querySelector<HTMLElement>('[data-testid="card-effects"]')!)
				.getPropertyValue('--varnish-active')
				.trim()
		).toBe('0.32');
	});

	it.each(['SR', 'UR'] as const)('keeps %s still at rest', (rarity) => {
		render(CardEffects, { rarity });

		const varnish = document.querySelector<HTMLElement>('.card-effects__varnish');
		const sparkles = document.querySelector<HTMLElement>('.card-effects__sparkles');
		expect(getComputedStyle(varnish!).animationName).toBe('none');
		expect(getComputedStyle(sparkles!).animationName).toBe('none');
		expect(getComputedStyle(varnish!).backgroundImage).toContain('radial-gradient');
		expect(getComputedStyle(varnish!).backgroundImage).not.toContain('linear-gradient');
		expect(getComputedStyle(varnish!).backgroundImage).not.toContain('repeating');
	});

	it('only breathes the fixed legendary sparkles at rest', () => {
		render(CardEffects, { rarity: 'L' });

		const sparkles = document.querySelector<HTMLElement>('.card-effects__sparkles');
		expect(getComputedStyle(sparkles!).animationName).toContain('wikiforge-sparkle-breathe');
	});

	it('keeps common cards free from foil effects', async () => {
		render(CardEffects, { rarity: 'C', active: true });

		await expect.element(page.getByTestId('card-effects')).not.toBeInTheDocument();
	});
});
