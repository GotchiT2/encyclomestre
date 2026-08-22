import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import FilterControls from './filter-controls.svelte';

describe('FilterControls', () => {
	it('selects relevance on text input and still allows a later manual sort', async () => {
		render(FilterControls, {
			query: '',
			sortBy: 'rarity',
			selectedRarities: [],
			tagFilterIds: [],
			variant: 'all',
			saleState: 'ALL',
			tags: [],
			untaggedOption: '__untagged__',
			onOpenTagEditor: vi.fn(),
			onClear: vi.fn()
		});

		await page.getByLabelText('Rechercher une carte').fill('Rose');
		const sort = page.getByLabelText('Trier par exemplaires');
		await expect.element(sort).toHaveValue('relevance');

		await sort.selectOptions('name');
		await expect.element(sort).toHaveValue('name');
	});
});
