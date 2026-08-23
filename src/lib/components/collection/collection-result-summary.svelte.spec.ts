import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CollectionResultSummary from './collection-result-summary.svelte';

describe('CollectionResultSummary', () => {
	it('shows a progressive count when the API total is unknown', async () => {
		render(CollectionResultSummary, {
			total: -1,
			loaded: 50,
			hasNext: true,
			rarityResults: { L: 3, C: 47 }
		});

		await expect.element(page.getByText('50+ carte(s) chargée(s)')).toBeVisible();
		await expect.element(page.getByText('L · 3')).toBeVisible();
		await expect.element(page.getByText('C · 47')).toBeVisible();
	});

	it('shows the loaded exact count at the end of an unknown-total feed', async () => {
		render(CollectionResultSummary, {
			total: -1,
			loaded: 63,
			hasNext: false,
			rarityResults: {}
		});

		await expect.element(page.getByText('63 carte(s)')).toBeVisible();
	});
});
