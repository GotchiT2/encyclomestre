import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import CatalogueFilters from './catalogue-filters.svelte';

describe('CatalogueFilters', () => {
	it('applies text filters after a short debounce without a submit button', async () => {
		const requestSubmit = vi
			.spyOn(HTMLFormElement.prototype, 'requestSubmit')
			.mockImplementation(() => undefined);
		render(CatalogueFilters, {
			query: '',
			sortBy: 'rarity',
			sortDirection: 'DESC',
			selectedRarities: [],
			rarities: ['Commune', 'Rare']
		});

		await page.getByPlaceholder('Rechercher une carte').fill('Mars');
		expect(requestSubmit).not.toHaveBeenCalled();
		await new Promise((resolve) => setTimeout(resolve, 500));
		expect(requestSubmit).toHaveBeenCalledOnce();
		await expect.element(page.getByRole('button', { name: 'Filtrer' })).not.toBeInTheDocument();
		requestSubmit.mockRestore();
	});
});
