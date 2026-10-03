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

		document.body.style.overflow = '';
		await page.getByRole('button', { name: 'Étiquettes: Étiquettes' }).click();
		await page.getByRole('searchbox').fill('FAVORIS');
		expect(document.body.style.overflow).not.toBe('hidden');
		const option = page.getByRole('button', { name: /Favoris/ }).last();
		await expect.element(option).toBeVisible();
		const selector = document.querySelector('[data-testid="tag-filter-selector"]');
		const menu = document.querySelector('[data-testid="tag-choices"]');
		expect(selector?.contains(menu)).toBe(false);
		await option.click();
		await expect.element(page.getByRole('button', { name: 'Étiquettes: Favoris' })).toBeVisible();
	});
});
