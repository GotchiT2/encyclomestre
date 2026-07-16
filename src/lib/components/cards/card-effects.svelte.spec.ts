import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CardEffects from './card-effects.svelte';

describe('CardEffects', () => {
	it.each(['PC', 'R'] as const)('renders a neutral illustration effect for %s', async (rarity) => {
		render(CardEffects, { rarity, active: true });

		await expect.element(page.getByTestId('card-effects')).toHaveAttribute('data-rarity', rarity);
		await expect.element(page.getByTestId('card-effects')).toHaveAttribute('data-active', 'true');
	});

	it.each(['C', 'SR', 'UR', 'L'] as const)('does not render an effect for %s', async (rarity) => {
		render(CardEffects, { rarity, active: true });

		await expect.element(page.getByTestId('card-effects')).not.toBeInTheDocument();
	});
});
