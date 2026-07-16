import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RaritySelector from './rarity-selector.svelte';

describe('RaritySelector', () => {
	it('shows a clear pressed state and synchronizes form values', async () => {
		render(RaritySelector, {
			options: [
				{ value: 'Commune', initials: 'C', color: '#d3e4f8' },
				{ value: 'Rare', initials: 'R', color: '#5c1dcf' }
			],
			selected: ['Commune'],
			name: 'rarity'
		});

		const common = page.getByRole('button', { name: 'Commune' });
		const rare = page.getByRole('button', { name: 'Rare' });
		await expect.element(common).toHaveAttribute('aria-pressed', 'true');
		await expect.element(rare).toHaveAttribute('aria-pressed', 'false');
		await rare.click();
		await expect.element(rare).toHaveAttribute('aria-pressed', 'true');
		expect(document.querySelector('input[name="rarity"][value="Rare"]')).not.toBeNull();
	});
});
