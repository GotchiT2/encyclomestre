import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import MarketFilters from './market-filters.svelte';

describe('MarketFilters', () => {
	it('keeps search visible and exposes card variants in the compact filter menu', async () => {
		const onSearch = vi.fn();
		const onFilterChange = vi.fn();
		render(MarketFilters, {
			query: '',
			variant: 'all',
			rarities: [],
			sort: 'ending',
			onSearch,
			onFilterChange
		});

		await expect.element(page.getByPlaceholder('Rechercher une carte ou un vendeur')).toBeVisible();
		await page.getByRole('button', { name: /Filtres/ }).click();
		await expect.element(page.getByRole('menuitemradio', { name: 'Alternatif' })).toBeVisible();
		await expect
			.element(page.getByRole('menuitemradio', { name: 'Fin la plus proche' }))
			.toBeVisible();
		await expect.element(page.getByText('Rare', { exact: true })).toBeVisible();
	});
});
