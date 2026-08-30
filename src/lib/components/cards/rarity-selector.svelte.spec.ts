import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import RaritySelector from './rarity-selector.svelte';

const options = [
	{ value: 'Commune' as const, initials: 'C', color: '#d3e4f8' },
	{ value: 'Rare' as const, initials: 'R', color: '#5c1dcf' }
];

describe('RaritySelector', () => {
	it('shows a clear pressed state and synchronizes form values', async () => {
		render(RaritySelector, { options, selected: ['Commune'], name: 'rarity' });

		const common = page.getByRole('button', { name: 'Commune' });
		const rare = page.getByRole('button', { name: 'Rare' });
		await expect.element(common).toHaveAttribute('aria-pressed', 'true');
		await expect.element(rare).toHaveAttribute('aria-pressed', 'false');
		await rare.click();
		await expect.element(rare).toHaveAttribute('aria-pressed', 'true');
		expect(document.querySelector('input[name="rarity"][value="Rare"]')).not.toBeNull();
	});

	it('carries the per-rarity result counts, compacted on screen and exact for assistive tech', async () => {
		render(RaritySelector, {
			options,
			selected: [],
			compact: true,
			counts: { C: 1_972_844, R: 12 }
		});

		const common = page.getByLabelText('Commune : 1 972 844 carte(s)');
		await expect.element(common).toBeVisible();
		await expect.element(common).toHaveTextContent('2 M');
		await expect.element(page.getByLabelText('Rare : 12 carte(s)')).toHaveTextContent('12');
	});
});
