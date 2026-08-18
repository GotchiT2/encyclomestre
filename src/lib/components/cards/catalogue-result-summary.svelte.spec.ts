import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CatalogueResultSummary from './catalogue-result-summary.svelte';

describe('CatalogueResultSummary', () => {
	it('shows the total and the API rarity counts accessibly', async () => {
		render(CatalogueResultSummary, {
			total: 2_775_100,
			rarityResults: { C: 1_972_844, PC: 534_376, R: 184_628, SR: 68_597, UR: 12_743, L: 1_912 }
		});

		await expect.element(page.getByTestId('catalogue-result-summary')).toBeVisible();
		await expect.element(page.getByText('2 775 100 résultat(s)')).toBeVisible();
		await expect.element(page.getByLabelText('Légendaire : 1 912 carte(s)')).toBeVisible();
		await expect.element(page.getByLabelText('Commune : 1 972 844 carte(s)')).toBeVisible();
	});
});
