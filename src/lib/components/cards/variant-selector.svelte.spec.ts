import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
import VariantSelector from './variant-selector.svelte';
vi.mock('$env/dynamic/public', () => ({ env: {} }));
const options = [
	{ id: 1, name: 'Standard', color: '#ffffff', styles: ['NORMAL'], renderKey: 'standard' },
	{ id: 2, name: 'Chrome', color: '#ffffff', styles: ['CHROME'], renderKey: 'chrome' }
];
describe('Compact variant selector', () => {
	it('searches and selects multiple variants without losing unknown selections', async () => {
		const changed = vi.fn();
		render(VariantSelector, { options, selected: [99], onChange: changed });
		await page.getByRole('button', { name: 'Variantes: #99' }).click();
		await page.getByRole('searchbox').fill('Chrome');
		await page.getByRole('button', { name: 'Chrome' }).click();
		expect(changed).toHaveBeenCalledOnce();
		await expect
			.element(page.getByRole('button', { name: 'Chrome' }))
			.toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('searchbox').fill('');
		await expect.element(page.getByRole('button', { name: '#99' })).toBeVisible();
	});
	it('closes after a single choice', async () => {
		render(VariantSelector, { options, multiple: false });
		await page.getByRole('button', { name: 'Variantes: Toutes les variantes' }).click();
		await page.getByRole('button', { name: 'Standard' }).click();
		await expect.element(page.getByRole('button', { name: 'Variantes: Standard' })).toBeVisible();
		await expect.element(page.getByRole('searchbox')).not.toBeInTheDocument();
	});
});
