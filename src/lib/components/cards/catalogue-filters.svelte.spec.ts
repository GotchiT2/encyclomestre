import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';

const { gotoMock } = vi.hoisted(() => ({ gotoMock: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: gotoMock }));

import CatalogueFilters from './catalogue-filters.svelte';

describe('CatalogueFilters', () => {
	afterEach(() => gotoMock.mockReset());

	it('applies text filters after a short debounce without a submit button', async () => {
		const requestSubmit = vi
			.spyOn(HTMLFormElement.prototype, 'requestSubmit')
			.mockImplementation(() => undefined);
		const result = render(CatalogueFilters, {
			query: '',
			sortBy: 'rarity',
			sortDirection: 'DESC',
			selectedRarities: []
		});

		const searchInput = page.getByPlaceholder('Rechercher une carte');
		await searchInput.fill('Mars');
		expect(requestSubmit).not.toHaveBeenCalled();
		await new Promise((resolve) => setTimeout(resolve, 700));
		expect(requestSubmit).toHaveBeenCalledOnce();
		await result.rerender({
			query: 'Mars',
			sortBy: 'rarity',
			sortDirection: 'DESC',
			selectedRarities: []
		});
		await new Promise(requestAnimationFrame);
		expect(document.activeElement).toBe(await searchInput.element());
		await expect.element(page.getByRole('button', { name: 'Filtrer' })).not.toBeInTheDocument();
		const rarityButtons = Array.from(document.querySelectorAll('button[aria-pressed]')).map(
			(button) => button.textContent?.replace(/\s+/g, '')
		);
		expect(rarityButtons.slice(0, 6)).toEqual([
			'CCommune',
			'PCPeuCommune',
			'RRare',
			'SRSuper-Rare',
			'URUltra-Rare',
			'LLégendaire'
		]);
		requestSubmit.mockRestore();
	});

	it('navigates without releasing focus when filters are submitted', async () => {
		render(CatalogueFilters, {
			query: 'Mars',
			sortBy: 'rarity',
			sortDirection: 'DESC',
			selectedRarities: []
		});

		const searchInput = page.getByPlaceholder('Rechercher une carte');
		await searchInput.click();
		document.querySelector<HTMLFormElement>('form')?.requestSubmit();

		await vi.waitFor(() =>
			expect(gotoMock).toHaveBeenCalledWith(
				expect.stringContaining('?q=Mars&sortBy=rarity&sortDirection=DESC'),
				expect.objectContaining({ keepFocus: true, noScroll: true, replaceState: true })
			)
		);
		expect(document.activeElement).toBe(await searchInput.element());
	});

	it('preserves a trailing space without refreshing the results', async () => {
		const requestSubmit = vi
			.spyOn(HTMLFormElement.prototype, 'requestSubmit')
			.mockImplementation(() => undefined);
		render(CatalogueFilters, {
			query: 'Nouvelle',
			sortBy: 'rarity',
			sortDirection: 'DESC',
			selectedRarities: []
		});

		const searchInput = page.getByPlaceholder('Rechercher une carte');
		await searchInput.fill('Nouvelle ');
		await new Promise((resolve) => setTimeout(resolve, 500));

		expect(requestSubmit).not.toHaveBeenCalled();
		await expect.element(searchInput).toHaveValue('Nouvelle ');
		requestSubmit.mockRestore();
	});
});
