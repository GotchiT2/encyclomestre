import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
import { mockCards } from '$lib/api/mocks/cards';
import type { WikiForgePublicPageCard } from '$lib/api/pages';
import CardVariantPreviews from './card-variant-previews.svelte';
vi.mock('$lib/api/public-env', () => ({ env: {} }));
const record: WikiForgePublicPageCard = {
	id: 10,
	title: 'Carte',
	atk: 1,
	globalCount: 1,
	variantIds: [1, 2],
	_variants: [
		{ id: 1, name: 'Normal', color: '#ffffff', styles: ['NORMAL'], renderKey: 'standard' },
		{ id: 2, name: 'Chrome', color: '#ffffff', styles: ['CHROME'], renderKey: 'chrome' },
		{ id: 3, name: 'Non disponible', color: '#ffffff', styles: ['NORMAL'], renderKey: 'standard' }
	]
};
describe('Catalogue variant directory', () => {
	it('lists every available variant and selects a single inspection without a comparison', async () => {
		const onSelect = vi.fn();
		render(CardVariantPreviews, { card: { ...mockCards[0], variantId: 1 }, record, onSelect });
		await expect.element(page.getByRole('button', { name: 'Normal' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Chrome' })).toBeVisible();
		await expect.element(page.getByText('Non disponible')).not.toBeInTheDocument();
		await expect.element(page.getByRole('checkbox')).not.toBeInTheDocument();
		await page.getByRole('button', { name: 'Chrome' }).click();
		expect(onSelect).toHaveBeenCalledWith(record._variants![1]);
	});
});
