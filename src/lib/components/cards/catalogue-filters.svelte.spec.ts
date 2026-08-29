import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';

const { gotoMock } = vi.hoisted(() => ({ gotoMock: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: gotoMock }));

import CatalogueFilters from './catalogue-filters.svelte';

describe('CatalogueFilters', () => {
	// Sans `restoreAllMocks`, une assertion en échec laisse le spy `requestSubmit`
	// en place et fait cascader les tests suivants.
	afterEach(() => {
		gotoMock.mockReset();
		vi.restoreAllMocks();
	});

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
		await expect.element(page.getByLabelText('Trier par')).toHaveValue('relevance');
		expect(requestSubmit).not.toHaveBeenCalled();
		await new Promise((resolve) => setTimeout(resolve, 700));
		expect(requestSubmit).toHaveBeenCalledOnce();
		await result.rerender({
			query: 'Mars',
			sortBy: 'relevance',
			sortDirection: 'DESC',
			selectedRarities: []
		});
		await new Promise(requestAnimationFrame);
		expect(document.activeElement).toBe(await searchInput.element());
		await expect.element(page.getByRole('button', { name: 'Filtrer' })).not.toBeInTheDocument();
		// Le panneau latéral n'affiche que les abréviations : le nom complet passe en tooltip.
		const rarityButtons = Array.from(document.querySelectorAll('button[aria-pressed]')).slice(0, 6);
		expect(rarityButtons.map((button) => button.textContent?.replace(/\s+/g, ''))).toEqual([
			'C',
			'PC',
			'R',
			'SR',
			'UR',
			'L'
		]);
		expect(rarityButtons.map((button) => button.getAttribute('title'))).toEqual([
			'Commune',
			'Peu Commune',
			'Rare',
			'Super-Rare',
			'Ultra-Rare',
			'Légendaire'
		]);
		requestSubmit.mockRestore();
	});

	it('keeps a manual sort selected after the textual search', async () => {
		render(CatalogueFilters, {
			query: 'Mars',
			sortBy: 'name',
			sortDirection: 'ASC',
			selectedRarities: []
		});

		const sort = page.getByLabelText('Trier par');
		await expect.element(sort).toHaveValue('name');
		document.querySelector<HTMLFormElement>('form')?.requestSubmit();

		await vi.waitFor(() =>
			expect(gotoMock).toHaveBeenCalledWith(
				expect.stringContaining('q=Mars&sortBy=name&sortDirection=ASC'),
				expect.any(Object)
			)
		);
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
