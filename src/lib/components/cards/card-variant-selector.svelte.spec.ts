import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CardVariantSelector from './card-variant-selector.svelte';

describe('CardVariantSelector', () => {
	it('selects all cards by default and exposes the alternative variant', async () => {
		const onChange = vi.fn();
		render(CardVariantSelector, { name: 'variant', onChange });

		await expect
			.element(page.getByRole('radio', { name: 'Tous' }))
			.toHaveAttribute('data-state', 'on');
		await page.getByRole('radio', { name: 'Alternatif' }).click();
		expect(onChange).toHaveBeenCalledWith('alternative');
		await expect
			.element(page.getByRole('radio', { name: 'Alternatif' }))
			.toHaveAttribute('data-state', 'on');
		expect(document.querySelector('input[name="variant"]')).toHaveValue('alternative');
	});
});
