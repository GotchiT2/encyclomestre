import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import TagFilterSelector from './tag-filter-selector.svelte';

describe('TagFilterSelector', () => {
	it('makes selected tags clearly visible', async () => {
		render(TagFilterSelector, {
			values: [],
			tags: [{ id: 'favorites', name: 'Favoris', color: '#feb823' }],
			untaggedValue: '__untagged__',
			allowCreation: false
		});

		await page.getByText('Toutes les étiquettes').click();
		const option = page.getByRole('menuitemcheckbox', { name: 'Favoris' });
		await expect.element(option).toBeVisible();
		const selector = document.querySelector('[data-testid="tag-filter-selector"]');
		const menu = document.querySelector('[role="menu"]');
		expect(selector?.contains(menu)).toBe(false);
		await option.click();
		await expect.element(page.getByText('1 étiquette(s) sélectionnée(s)')).toBeVisible();
	});
});
