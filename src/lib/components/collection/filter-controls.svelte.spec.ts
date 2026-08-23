import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import FilterControls from './filter-controls.svelte';

describe('FilterControls', () => {
	it('exposes only collection sorts and explains the minimum search length', async () => {
		render(FilterControls, {
			query: '',
			sortBy: 'acquiredDate',
			selectedRarities: [],
			tagFilterIds: [],
			duplicate: 'all',
			protected: 'all',
			tags: [],
			canonical: true,
			onOpenTagEditor: vi.fn(),
			onClear: vi.fn()
		});

		const sort = page.getByLabelText('Trier par exemplaires');
		await expect.element(sort).toHaveValue('acquiredDate');
		expect(sort.element().querySelector('option[value="relevance"]')).toBeNull();
		await page.getByLabelText('Rechercher une carte').fill('ab');
		await expect
			.element(page.getByText('Saisissez au moins 3 caractères pour rechercher.'))
			.toBeVisible();
	});
});
