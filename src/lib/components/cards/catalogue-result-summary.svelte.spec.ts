import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CatalogueResultSummary from './catalogue-result-summary.svelte';

describe('CatalogueResultSummary', () => {
	// La répartition par rareté a migré sur les pastilles du filtre (voir RaritySelector).
	it('shows the total on its own', async () => {
		render(CatalogueResultSummary, { total: 2_775_100 });

		await expect.element(page.getByTestId('catalogue-result-summary')).toBeVisible();
		await expect.element(page.getByText('2 775 100 résultat(s)')).toBeVisible();
	});
});
