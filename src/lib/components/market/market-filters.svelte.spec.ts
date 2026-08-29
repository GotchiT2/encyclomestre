import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import MarketFilters from './market-filters.svelte';

describe('MarketFilters', () => {
	it('expose recherche, variante, raretés et tri dans le panneau latéral', async () => {
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
		await expect.element(page.getByText('Alternatif', { exact: true })).toBeVisible();

		const sort = page.getByLabelText('Trier les ventes');
		await expect.element(sort).toHaveValue('ending');
		expect(sort.element().querySelector('option[value="bid_desc"]')).not.toBeNull();

		// Les raretés n'affichent que leur abréviation, le nom complet passe en tooltip.
		const rare = page.getByRole('button', { name: 'Rare', exact: true });
		await expect.element(rare).toHaveTextContent('R');
		await expect.element(rare).toHaveAttribute('title', 'Rare');
	});
});
