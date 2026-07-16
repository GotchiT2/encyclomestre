import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CardEffects from './card-effects.svelte';

describe('CardEffects', () => {
	it.each([
		['PC', 'pc', '1', 'false'],
		['R', 'r', '2', 'false'],
		['SR', 'sr', '3', 'true'],
		['UR', 'ur', '4', 'true'],
		['L', 'l', '5', 'true']
	] as const)('renders the progressive %s profile', async (rarity, profile, level, ambient) => {
		render(CardEffects, { rarity, active: true });

		const effects = page.getByTestId('card-effects');
		await expect.element(effects).toHaveAttribute('data-rarity', rarity);
		await expect.element(effects).toHaveAttribute('data-profile', profile);
		await expect.element(effects).toHaveAttribute('data-effect-level', level);
		await expect.element(effects).toHaveAttribute('data-ambient', ambient);
		await expect.element(effects).toHaveAttribute('data-active', 'true');
		expect(document.querySelectorAll('[data-testid="card-effects"] > span')).toHaveLength(3);
	});

	it('uses a dedicated full-art profile', async () => {
		render(CardEffects, { rarity: 'L', fullArt: true, active: true });

		await expect
			.element(page.getByTestId('card-effects'))
			.toHaveAttribute('data-profile', 'full-art');
		await expect
			.element(page.getByTestId('card-effects'))
			.toHaveAttribute('data-effect-level', '6');
		await expect.element(page.getByTestId('card-effects')).toHaveAttribute('data-ambient', 'true');
	});

	it('keeps ambient foil motion for SR and higher profiles', () => {
		render(CardEffects, { rarity: 'SR' });

		const foil = document.querySelector<HTMLElement>('.card-effects__foil');
		expect(getComputedStyle(foil!).animationName).toContain('wikiforge-foil-drift');
	});

	it('keeps common cards free from foil effects', async () => {
		render(CardEffects, { rarity: 'C', active: true });

		await expect.element(page.getByTestId('card-effects')).not.toBeInTheDocument();
	});
});
